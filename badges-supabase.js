// Supabase tabanlı rozet sistemi
const BADGES = [
  { id: 'hos-geldin-yolcusu', title: 'Hoş Geldin Yolcusu', desc: 'Kayıt olduktan sonraki anketi tamamladın!', icon: '🏆' },
  { id: 'mini-seri-yolcusu', title: 'Mini Seri Yolcusu', desc: '5 gün üst üste giriş yaptın', icon: '🏆' },
  { id: 'gelenek-bekcisi', title: 'Gelenek Bekçisi', desc: '7 gün üst üste giriş yaptın', icon: '🏆' },
  { id: 'istikrar-ustasi', title: 'İstikrar Ustası', desc: '10 gün üst üste giriş yaptın', icon: '🏆' },
  { id: 'aliskanlik-ustasi', title: 'Alışkanlık Ustası', desc: '21 farklı gün siteye giriş yaptın', icon: '🏆' },
  { id: 'gelenek-koruyucusu', title: 'Gelenek Koruyucusu', desc: '30 gün üst üste giriş yaptın', icon: '🏆' },
  { id: 'egitmen', title: 'Eğitmen', desc: 'AF-GROOVE eğitmeni', icon: '👨‍🏫' },
  { id: 'gelistirici', title: 'Geliştirici', desc: 'AF-GROOVE geliştirici ekibi', icon: '💻' }
];

const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]));

window.badges = {
  BADGES,
  BADGE_MAP,

  // Kullanıcının rozetlerini al
  async getUserBadges(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data ? data.map(row => row.badge_id) : [];
    } catch (err) {
      console.error('Rozet yükleme hatası:', err);
      return [];
    }
  },

  // Rozet ver
  async awardBadge(userId, badgeId) {
    if (!userId || !badgeId || !BADGE_MAP[badgeId]) return false;
    
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId });
      
      if (error) {
        // 23505 = unique constraint violation (rozet zaten var)
        if (error.code === '23505') {
          console.log(`Rozet zaten var: ${badgeId}`);
          return false;
        }
        throw error;
      }
      
      console.log(`✅ Rozet verildi: ${BADGE_MAP[badgeId].title}`);
      return true;
    } catch (err) {
      console.error('Rozet verme hatası:', err);
      return false;
    }
  },

  // Birden fazla rozet ver
  async awardBadges(userId, badgeIds) {
    if (!Array.isArray(badgeIds)) return;
    for (const badgeId of badgeIds) {
      await this.awardBadge(userId, badgeId);
    }
  },

  // Streak tabanlı rozet kontrolleri
  async checkStreakBadges(userId, streakData) {
    if (!userId || !streakData) return;
    
    try {
      const { count, visits } = streakData;
      const totalVisits = visits ? visits.length : 0;
      
      // Streak rozetleri (üst üste giriş)
      if (count >= 30) {
        await this.awardBadge(userId, 'gelenek-koruyucusu');
      }
      if (count >= 10) {
        await this.awardBadge(userId, 'istikrar-ustasi');
      }
      if (count >= 7) {
        await this.awardBadge(userId, 'gelenek-bekcisi');
      }
      if (count >= 5) {
        await this.awardBadge(userId, 'mini-seri-yolcusu');
      }
      
      // Toplam farklı gün rozeti
      if (totalVisits >= 21) {
        await this.awardBadge(userId, 'aliskanlik-ustasi');
      }
    } catch (err) {
      console.error('Streak rozet kontrol hatası:', err);
    }
  },

  // Rozet carousel'ini render et
  async renderBadgeCarousel(userId, containerId = 'badgeCarousel') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const userBadges = await this.getUserBadges(userId);
    
    // Rozetleri kazanılanlar ve kazanılmayanlar olarak ayır
    const earnedBadges = BADGES.filter(b => userBadges.includes(b.id));
    const lockedBadges = BADGES.filter(b => !userBadges.includes(b.id));
    const sortedBadges = [...earnedBadges, ...lockedBadges];
    
    let scrollPosition = 0;
    const badgeWidth = 160; // Her rozet kartının genişliği (140px + gap)
    const visibleCount = 4; // Aynı anda görünen rozet sayısı
    const maxScroll = Math.max(0, (sortedBadges.length - visibleCount) * badgeWidth);

    function render() {
      const badgeHTML = sortedBadges.map(badge => {
        const isEarned = userBadges.includes(badge.id);
        return `
          <div class="badge-item ${isEarned ? 'earned' : 'locked'}">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-desc">${badge.desc}</div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="badge-carousel-wrapper">
          <button class="badge-nav-btn prev" ${scrollPosition <= 0 ? 'disabled' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="badge-scroll-container">
            <div class="badge-grid" style="transform: translateX(-${scrollPosition}px); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
              ${badgeHTML}
            </div>
          </div>
          <button class="badge-nav-btn next" ${scrollPosition >= maxScroll ? 'disabled' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div class="badge-progress">${userBadges.length} / ${BADGES.length} rozet kazanıldı</div>
      `;

      // Event listeners
      const prevBtn = container.querySelector('.prev');
      const nextBtn = container.querySelector('.next');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (scrollPosition > 0) {
            scrollPosition = Math.max(0, scrollPosition - badgeWidth);
            render();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (scrollPosition < maxScroll) {
            scrollPosition = Math.min(maxScroll, scrollPosition + badgeWidth);
            render();
          }
        });
      }
    }

    render();
  }
};
