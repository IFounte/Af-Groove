// badges.js - Firestore tabanli rozet sistemi
/* global firebase */

const BADGES = [
  { id: 'hos-geldin', title: 'Hos Geldin!', desc: 'Ilk girisini yaptin', icon: '', condition: 'first_login' },
  { id: 'profil-tamamla', title: 'Profil Ustasi', desc: 'Profilini tamamladin', icon: '', condition: 'profile_complete' },
  { id: 'anket-ustasi', title: 'Anket Ustasi', desc: 'Ilk anketi tamamladin', icon: '', condition: 'survey_complete' },
  { id: 'ilk-gonderi', title: 'Ilk Gonderi', desc: 'Ilk gonderini paylastin', icon: '', condition: 'first_post' },
  { id: 'sosyal-kullanici', title: 'Sosyal Kullanici', desc: '5 gonderi paylastin', icon: '', condition: 'post_count_5' },
  { id: 'aktif-uye', title: 'Aktif Uye', desc: '7 gun ust uste giris yaptin', icon: '', condition: 'login_streak_7' },
  { id: 'muzik-sever', title: 'Muzik Sever', desc: 'Ilk calma listeni olustur dun', icon: '', condition: 'first_playlist' },
  { id: 'koleksiyoner', title: 'Koleksiyoner', desc: '10 muzik favorilere eklendi', icon: '', condition: 'favorite_count_10' },
  { id: 'yorumcu', title: 'Yorumcu', desc: 'Ilk yorumunu yaptin', icon: '', condition: 'first_comment' },
  { id: 'destek-kahramani', title: 'Destek Kahramani', desc: '10 begeni aldin', icon: '', condition: 'likes_received_10' },
  { id: 'kesfedici', title: 'Kesfedici', desc: '3 farkli kategori kesfettin', icon: '', condition: 'explore_categories_3' },
  { id: 'sadik-uye', title: 'Sadik Uye', desc: '30 gun uyeligin doldu', icon: '', condition: 'membership_30_days' }
];

const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]));

async function getUserBadges(uid) {
  if (!uid || !firebase?.firestore) return [];
  try {
    const doc = await firebase.firestore().collection('users').doc(uid).get();
    if (!doc.exists) return [];
    const data = doc.data();
    return Array.isArray(data.badges) ? data.badges : [];
  } catch (err) {
    console.error('Rozet okuma hatasi:', err);
    return [];
  }
}

async function awardBadge(uid, badgeId) {
  if (!uid || !badgeId || !BADGE_MAP[badgeId] || !firebase?.firestore) return false;
  try {
    const ref = firebase.firestore().collection('users').doc(uid);
    const doc = await ref.get();
    if (doc.exists) {
      const currentBadges = doc.data().badges || [];
      if (currentBadges.includes(badgeId)) {
        console.log('Rozet zaten var: ' + badgeId);
        return false;
      }
    }
    await ref.set({ badges: firebase.firestore.FieldValue.arrayUnion(badgeId) }, { merge: true });
    console.log('Rozet verildi: ' + BADGE_MAP[badgeId].title);
    return true;
  } catch (err) {
    console.error('Rozet verme hatasi:', err);
    return false;
  }
}

async function awardBadges(uid, badgeIds) {
  if (!Array.isArray(badgeIds)) return;
  for (const badgeId of badgeIds) {
    await awardBadge(uid, badgeId);
  }
}

async function renderBadgeCarousel(uid, containerId) {
  if (!containerId) containerId = 'badgeCarousel';
  const container = document.getElementById(containerId);
  if (!container) return;
  const userBadges = await getUserBadges(uid);
  const badgesPerPage = 6;
  let currentPage = 0;
  const totalPages = Math.ceil(BADGES.length / badgesPerPage);
  function renderPage() {
    const start = currentPage * badgesPerPage;
    const end = start + badgesPerPage;
    const pageBadges = BADGES.slice(start, end);
    const badgeHTML = pageBadges.map(badge => {
      const isEarned = userBadges.includes(badge.id);
      return '<div class="badge-item ' + (isEarned ? 'earned' : 'locked') + '"><div class="badge-icon">' + badge.icon + '</div><div class="badge-title">' + badge.title + '</div><div class="badge-desc">' + badge.desc + '</div></div>';
    }).join('');
    container.innerHTML = '<div class="badge-carousel-wrapper"><button class="badge-nav-btn prev" ' + (currentPage === 0 ? 'disabled' : '') + '><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button><div class="badge-grid">' + badgeHTML + '</div><button class="badge-nav-btn next" ' + (currentPage === totalPages - 1 ? 'disabled' : '') + '><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div><div class="badge-progress">' + userBadges.length + ' / ' + BADGES.length + ' rozet kazanildi</div>';
    const prevBtn = container.querySelector('.prev');
    const nextBtn = container.querySelector('.next');
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (currentPage > 0) {
          currentPage--;
          renderPage();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages - 1) {
          currentPage++;
          renderPage();
        }
      });
    }
  }
  renderPage();
}

async function checkAndAwardBadges(uid) {
  if (!uid || !firebase?.firestore) return;
  try {
    const userDoc = await firebase.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return;
    const userData = userDoc.data();
    const currentBadges = userData.badges || [];
    if (!currentBadges.includes('hos-geldin')) {
      await awardBadge(uid, 'hos-geldin');
    }
    if (userData.username && userData.bio && !currentBadges.includes('profil-tamamla')) {
      await awardBadge(uid, 'profil-tamamla');
    }
    if (userData.surveyComplete && !currentBadges.includes('anket-ustasi')) {
      await awardBadge(uid, 'anket-ustasi');
    }
    if (userData.createdAt) {
      const daysSinceJoin = Math.floor((Date.now() - userData.createdAt) / (1000 * 60 * 60 * 24));
      if (daysSinceJoin >= 30 && !currentBadges.includes('sadik-uye')) {
        await awardBadge(uid, 'sadik-uye');
      }
    }
  } catch (err) {
    console.error('Rozet kontrol hatasi:', err);
  }
}

window.badges = {
  BADGES: BADGES,
  BADGE_MAP: BADGE_MAP,
  getUserBadges: getUserBadges,
  awardBadge: awardBadge,
  awardBadges: awardBadges,
  renderBadgeCarousel: renderBadgeCarousel,
  checkAndAwardBadges: checkAndAwardBadges
};
