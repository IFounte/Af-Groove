// Supabase tabanlı rozet sistemi
const BADGES = [
  { id: 'hos-geldin', title: 'Hoş Geldin', desc: 'İlk girişini yaptın!', icon: '👋' },
  { id: 'anket-ustasi', title: 'Anket Ustası', desc: 'İlk anketi doldurdun', icon: '📝' },
  { id: 'profil-ustasi', title: 'Profil Ustası', desc: 'Profilini tamamladın', icon: '✨' },
  { id: 'ilk-gonderi', title: 'İlk Gönderi', desc: 'İlk paylaşımını yaptın', icon: '🎯' },
  { id: 'sosyal-kullanici', title: 'Sosyal Kullanıcı', desc: '5 gönderi paylaştın', icon: '🌟' },
  { id: 'aktif-uye', title: 'Aktif Üye', desc: '7 gün üst üste giriş yaptın', icon: '🔥' },
  { id: 'muzik-sever', title: 'Müzik Sever', desc: 'İlk playlist oluşturdun', icon: '🎵' },
  { id: 'koleksiyoncu', title: 'Koleksiyoncu', desc: '10 favori ekledin', icon: '💎' },
  { id: 'yorumcu', title: 'Yorumcu', desc: 'İlk yorumunu yaptın', icon: '💬' },
  { id: 'destek-kahramani', title: 'Destek Kahramanı', desc: '10 beğeni aldın', icon: '❤️' },
  { id: 'kesfedici', title: 'Keşfedici', desc: '3 farklı kategori keşfettin', icon: '🔍' },
  { id: 'sadik-uye', title: 'Sadık Üye', desc: '30 gün üyeliğini tamamladın', icon: '🏆' }
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

  // Otomatik rozet kontrolleri
  async checkAndAwardBadges(userId) {
    if (!userId) return;
    
    try {
      // İlk giriş rozeti
      await this.awardBadge(userId, 'hos-geldin');
    } catch (err) {
      console.error('Rozet kontrol hatası:', err);
    }
  },

  // Rozet carousel'ini render et
  async renderBadgeCarousel(userId, containerId = 'badgeCarousel') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const userBadges = await this.getUserBadges(userId);
    const badgesPerPage = 6;
    let currentPage = 0;
    const totalPages = Math.ceil(BADGES.length / badgesPerPage);

    function renderPage() {
      const start = currentPage * badgesPerPage;
      const end = start + badgesPerPage;
      const pageBadges = BADGES.slice(start, end);

      const badgeHTML = pageBadges.map(badge => {
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
          <button class="badge-nav-btn prev" ${currentPage === 0 ? 'disabled' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="badge-grid">
            ${badgeHTML}
          </div>
          <button class="badge-nav-btn next" ${currentPage === totalPages - 1 ? 'disabled' : ''}>
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
          if (currentPage > 0) {
            currentPage--;
            renderPage();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentPage < totalPages - 1) {
            currentPage++;
            renderPage();
          }
        });
      }
    }

    renderPage();
  }
};
