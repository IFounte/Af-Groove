// Supabase tabanlı rozet sistemi (Merged with achievements.js data)

const BADGES = [
  { id: 'hos-geldin-yolcusu', title: 'Hoş Geldin Yolcusu', desc: 'İlk giriş ve anketi tamamlayan.', icon: '🏅' },
  { id: 'kasif', title: 'Kaşif', desc: 'İlk videoyu izleyen.', icon: '🏅' },
  { id: 'oyuncu', title: 'Oyuncu', desc: 'İlk etkileşimli içeriği tamamlayan.', icon: '🏅' },
  { id: 'kultur-gezgini', title: 'Kültür Gezgini', desc: '3 farklı kategoriden içerik deneyen.', icon: '🏅' },
  { id: 'gelenek-bekcisi', title: 'Gelenek Bekçisi', desc: '7 gün üst üste giriş yapan.', icon: '🏅' },
  { id: 'istikrar-ustasi', title: 'İstikrar Ustası', desc: '10 gün üst üste giriş yapan.', icon: '🏅' },
  { id: 'aliskanlik-ustasi', title: 'Alışkanlık Ustası', desc: '21 gün aktif kalan.', icon: '🏅' },
  { id: 'gelenek-koruyucusu', title: 'Gelenek Koruyucusu', desc: '30 gün boyunca kesintisiz giriş.', icon: '🏅' },
  { id: 'mini-seri-yolcusu', title: 'Mini Seri Yolcusu', desc: '5 gün üst üste giriş yapan.', icon: '🏅' },
  { id: 'kultur-destekcisi', title: 'Kültür Destekçisi', desc: 'Proje anketini dolduran.', icon: '🏅' },
  { id: 'cirak', title: 'Çırak', desc: 'Bir eğitimin ilk kısmını tamamlayan.', icon: '🏅' },
  { id: 'groover', title: 'Groover', desc: 'Eğitim içi bir aşamayı bitiren.', icon: '🏅' },
  { id: 'groover-plus', title: 'Groover+', desc: 'Bir eğitimi tamamen bitiren.', icon: '🏅' },
  { id: 'kurs-ustasi', title: 'Kurs Ustası', desc: 'Her kursun kendine özel bitirme rozeti.', icon: '🏅' },
  { id: 'gercek-uzman', title: 'Gerçek Uzman', desc: 'Tüm kategorilerden 1 kurs tamamlayan.', icon: '🏅' },
  { id: 'tekrarci', title: 'Tekrarcı', desc: 'Aynı içeriği ikinci kez tamamlayan.', icon: '🏅' },
  { id: 'seri-bitirici', title: 'Seri Bitirici', desc: 'Arka arkaya 3 kurs bitiren.', icon: '🏅' },
  { id: 'derin-ogrenen', title: 'Derin Öğrenen', desc: 'Orta seviye bir kursu bitiren.', icon: '🏅' },
  { id: 'ustaliga-giden-yol', title: 'Ustalığa Giden Yol', desc: 'İleri seviye kurs bitiren.', icon: '🏅' },
  { id: 'surekli-ogrenen', title: 'Sürekli Öğrenen', desc: '20 içerik tamamlayan.', icon: '🏅' },
  { id: 'ritim-yolcusu', title: 'Ritim Yolcusu', desc: 'İlk müzik/dans eğitimini bitiren.', icon: '🏅' },
  { id: 'kalp-atisi', title: 'Kalp Atışı', desc: 'Bir ritim egzersizini tamamlayan.', icon: '🏅' },
  { id: 'dans-ustasi', title: 'Dans Ustası', desc: 'Bir dans eğitiminin tüm seviyelerini bitiren.', icon: '🏅' },
  { id: 'ritmik-geri-donus', title: 'Ritmik Geri Dönüş', desc: 'Aynı dansı tekrar çalışıp gelişim gösteren.', icon: '🏅' },
  { id: 'makam-kesfedicisi', title: 'Makam Keşfedicisi', desc: '3 farklı müzik türünü deneyen.', icon: '🏅' },
  { id: 'seviye-atlama', title: 'Seviye Atlama Rozeti', desc: 'Müziğin 1–2–3. seviye rozetleri.', icon: '🏅' },
  { id: 'el-emegi-yolcusu', title: 'El Emeği Yolcusu', desc: 'İlk el sanatı içeriğini tamamlayan.', icon: '🏅' },
  { id: 'atolye-ciragi', title: 'Atölye Çırağı', desc: 'Proje tamamlayıp #groove ile paylaşan.', icon: '🏅' },
  { id: 'motif-kesfedicisi', title: 'Motif Keşfedicisi', desc: '3 farklı teknik izleyen.', icon: '🏅' },
  { id: 'geleneksel-zanaatkar', title: 'Geleneksel Zanaatkâr', desc: 'Bir el sanatı dalında tüm seviyeleri tamamlayan.', icon: '🏅' },
  { id: 'el-sanati-arsivcisi', title: 'El Sanatı Arşivcisi', desc: '10 el sanatı videosu tamamlayan.', icon: '🏅' },
  { id: 'zanaat-yolcusu', title: 'Zanaat Yolcusu', desc: 'El sanatı mini sınavını bitiren.', icon: '🏅' },
  { id: 'desen-avcisi', title: 'Desen Avcısı', desc: 'İşlenen desenleri doğru tanımlayan.', icon: '🏅' },
  { id: 'atolye-sadakati', title: 'Atölye Sadakati', desc: 'Aynı dersi ikinci kez yapan.', icon: '🏅' },
  { id: 'hikaye-avcisi', title: 'Hikaye Avcısı', desc: 'İlk hikayeyi tamamlayan.', icon: '🏅' },
  { id: 'diyar-gezgini', title: 'Diyar Gezgini', desc: '5 farklı bölgeye ait hikaye dinleyen.', icon: '🏅' },
  { id: 'masal-koleksiyoncusu', title: 'Masal Koleksiyoncusu', desc: '10 hikaye bitiren.', icon: '🏅' },
  { id: 'bilge-yolcu', title: 'Bilge Yolcu', desc: 'Kültürel mini testleri geçen.', icon: '🏅' },
  { id: 'hikaye-uzmani', title: 'Hikaye Uzmanı', desc: '3 uzun hikayeyi bitiren.', icon: '🏅' },
  { id: 'egitmen-rozeti', title: 'Eğitmen Rozeti', desc: 'Eğitmenlere özel.', icon: '🏅' },
  { id: 'gelistirici-rozeti', title: 'Geliştirici Rozeti', desc: 'Geliştiricilere özel.', icon: '🏅' }
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
      // Önce kullanıcının zaten bu rozete sahip olup olmadığını kontrol edelim
      // (Client-side optimization, RLS also prevents, but let's be safe)
      // Supabase insert with ignoreDuplicates functionality depends on DB constraints usually.

      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId });

      if (error) {
        // 23505 = unique constraint violation (rozet zaten var)
        if (error.code === '23505') {
          // console.log(`Rozet zaten var: ${badgeId}`);
          return false;
        }
        throw error;
      }

      console.log(`✅ Rozet verildi: ${BADGE_MAP[badgeId].title}`);

      // Opsiyonel: Toast notification göster
      if (window.showToast) window.showToast(`Yeni Rozet: ${BADGE_MAP[badgeId].title}`);
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
    const visibleCount = 4; // Aynı anda görünen rozet sayısı (desktop approx)
    const maxScroll = Math.max(0, (sortedBadges.length - visibleCount) * badgeWidth);

    function render() {
      const badgeHTML = sortedBadges.map(badge => {
        const isEarned = userBadges.includes(badge.id);
        const iconDisplay = isEarned ? badge.icon : '🔒';
        return `
          <div class="badge-item ${isEarned ? 'earned' : 'locked'}" title="${badge.title}">
            <div class="badge-icon">${iconDisplay}</div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-desc">${badge.desc}</div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="badge-carousel-wrapper">
          <button class="badge-nav-btn prev" ${scrollPosition <= 0 ? 'disabled' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div class="badge-scroll-container">
            <div class="badge-grid" style="transform: translateX(-${scrollPosition}px);">
              ${badgeHTML}
            </div>
          </div>
          <button class="badge-nav-btn next" ${scrollPosition >= maxScroll ? 'disabled' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div class="badge-progress">${earnedBadges.length} / ${BADGES.length} rozet kazanıldı</div>
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

// Global achievementEvent handler (replaces logic from achievements.js)
window.achievementEvent = async function (user, eventName, payload) {
  if (!user || !user.uid) return;
  const uid = user.uid;

  // Map events to badge IDs
  switch (eventName) {
    case 'video_play':
      await window.badges.awardBadge(uid, 'kasif');
      break;
    case 'interactive_complete':
      await window.badges.awardBadge(uid, 'oyuncu');
      break;
    case 'survey_complete':
      await window.badges.awardBadge(uid, 'kultur-destekcisi');
      break;
    case 'course_part_1':
      await window.badges.awardBadge(uid, 'cirak');
      break;
    case 'course_step':
      await window.badges.awardBadge(uid, 'groover');
      break;
    case 'course_completed':
      await window.badges.awardBadge(uid, 'groover-plus');
      break;
    case 'streak_update':
      if (payload && payload.streakCount) {
        const s = payload.streakCount;
        if (s >= 5) await window.badges.awardBadge(uid, 'mini-seri-yolcusu');
        if (s >= 7) await window.badges.awardBadge(uid, 'gelenek-bekcisi');
        if (s >= 10) await window.badges.awardBadge(uid, 'istikrar-ustasi');
        if (s >= 21) await window.badges.awardBadge(uid, 'aliskanlik-ustasi');
        if (s >= 30) await window.badges.awardBadge(uid, 'gelenek-koruyucusu');
      }
      break;
  }
};

