// achievements.js - rozet koşulları ve değerlendirme
// Not: Mevcut veri henüz tüm koşulları desteklemiyor. Eksik eventler için placeholder kullanım.

// Tam rozet listesi (ikon placeholder)
const BADGES = [
  {id:'hos-geldin-yolcusu', title:'Hoş Geldin Yolcusu', desc:'İlk giriş ve anketi tamamlayan.', icon:'🏅', condition:'first_login_and_survey'},
  {id:'kasif', title:'Kaşif', desc:'İlk videoyu izleyen.', icon:'🏅', condition:'first_video'},
  {id:'oyuncu', title:'Oyuncu', desc:'İlk etkileşimli içeriği tamamlayan.', icon:'🏅', condition:'first_interactive'},
  {id:'kultur-gezgini', title:'Kültür Gezgini', desc:'3 farklı kategoriden içerik deneyen.', icon:'🏅', condition:'three_categories'},
  {id:'gelenek-bekcisi', title:'Gelenek Bekçisi', desc:'7 gün üst üste giriş yapan.', icon:'🏅', condition:'streak_7'},
  {id:'istikrar-ustasi', title:'İstikrar Ustası', desc:'10 gün üst üste giriş yapan.', icon:'🏅', condition:'streak_10'},
  {id:'aliskanlik-ustasi', title:'Alışkanlık Ustası', desc:'21 gün aktif kalan.', icon:'🏅', condition:'streak_21'},
  {id:'gelenek-koruyucusu', title:'Gelenek Koruyucusu', desc:'30 gün boyunca kesintisiz giriş.', icon:'🏅', condition:'streak_30'},
  {id:'mini-seri-yolcusu', title:'Mini Seri Yolcusu', desc:'5 gün üst üste giriş yapan.', icon:'🏅', condition:'streak_5'},
  {id:'kultur-destekcisi', title:'Kültür Destekçisi', desc:'Proje anketini dolduran.', icon:'🏅', condition:'survey_complete'},
  {id:'cirak', title:'Çırak', desc:'Bir eğitimin ilk kısmını tamamlayan.', icon:'🏅', condition:'course_part_1'},
  {id:'groover', title:'Groover', desc:'Eğitim içi bir aşamayı bitiren.', icon:'🏅', condition:'course_step'},
  {id:'groover-plus', title:'Groover+', desc:'Bir eğitimi tamamen bitiren.', icon:'🏅', condition:'course_completed'},
  {id:'kurs-ustasi', title:'Kurs Ustası', desc:'Her kursun kendine özel bitirme rozeti.', icon:'🏅', condition:'any_course_master'},
  {id:'gercek-uzman', title:'Gerçek Uzman', desc:'Tüm kategorilerden 1 kurs tamamlayan.', icon:'🏅', condition:'all_categories_one_course'},
  {id:'tekrarci', title:'Tekrarcı', desc:'Aynı içeriği ikinci kez tamamlayan.', icon:'🏅', condition:'repeat_content'},
  {id:'seri-bitirici', title:'Seri Bitirici', desc:'Arka arkaya 3 kurs bitiren.', icon:'🏅', condition:'three_courses_in_row'},
  {id:'derin-ogrenen', title:'Derin Öğrenen', desc:'Orta seviye bir kursu bitiren.', icon:'🏅', condition:'course_medium'},
  {id:'ustaliga-giden-yol', title:'Ustalığa Giden Yol', desc:'İleri seviye kurs bitiren.', icon:'🏅', condition:'course_advanced'},
  {id:'surekli-ogrenen', title:'Sürekli Öğrenen', desc:'20 içerik tamamlayan.', icon:'🏅', condition:'content_20'},
  {id:'ritim-yolcusu', title:'Ritim Yolcusu', desc:'İlk müzik/dans eğitimini bitiren.', icon:'🏅', condition:'first_music_or_dance'},
  {id:'kalp-atisi', title:'Kalp Atışı', desc:'Bir ritim egzersizini tamamlayan.', icon:'🏅', condition:'rhythm_exercise'},
  {id:'dans-ustasi', title:'Dans Ustası', desc:'Bir dans eğitiminin tüm seviyelerini bitiren.', icon:'🏅', condition:'dance_all_levels'},
  {id:'ritmik-geri-donus', title:'Ritmik Geri Dönüş', desc:'Aynı dansı tekrar çalışıp gelişim gösteren.', icon:'🏅', condition:'dance_repeat_improve'},
  {id:'makam-kesfedicisi', title:'Makam Keşfedicisi', desc:'3 farklı müzik türünü deneyen.', icon:'🏅', condition:'three_music_types'},
  {id:'seviye-atlama', title:'Seviye Atlama Rozeti', desc:'Müziğin 1–2–3. seviye rozetleri.', icon:'🏅', condition:'music_levels_123'},
  {id:'el-emegi-yolcusu', title:'El Emeği Yolcusu', desc:'İlk el sanatı içeriğini tamamlayan.', icon:'🏅', condition:'first_handcraft'},
  {id:'atolye-ciragi', title:'Atölye Çırağı', desc:'Proje tamamlayıp #groove ile paylaşan.', icon:'🏅', condition:'project_shared'},
  {id:'motif-kesfedicisi', title:'Motif Keşfedicisi', desc:'3 farklı teknik izleyen.', icon:'🏅', condition:'three_techniques'},
  {id:'geleneksel-zanaatkar', title:'Geleneksel Zanaatkâr', desc:'Bir el sanatı dalında tüm seviyeleri tamamlayan.', icon:'🏅', condition:'handcraft_all_levels'},
  {id:'el-sanati-arsivcisi', title:'El Sanatı Arşivcisi', desc:'10 el sanatı videosu tamamlayan.', icon:'🏅', condition:'handcraft_10_videos'},
  {id:'zanaat-yolcusu', title:'Zanaat Yolcusu', desc:'El sanatı mini sınavını bitiren.', icon:'🏅', condition:'handcraft_quiz'},
  {id:'desen-avcisi', title:'Desen Avcısı', desc:'İşlenen desenleri doğru tanımlayan.', icon:'🏅', condition:'pattern_identify'},
  {id:'atolye-sadakati', title:'Atölye Sadakati', desc:'Aynı dersi ikinci kez yapan.', icon:'🏅', condition:'lesson_repeat'},
  {id:'hikaye-avcisi', title:'Hikaye Avcısı', desc:'İlk hikayeyi tamamlayan.', icon:'🏅', condition:'first_story'},
  {id:'diyar-gezgini', title:'Diyar Gezgini', desc:'5 farklı bölgeye ait hikaye dinleyen.', icon:'🏅', condition:'five_regions_stories'},
  {id:'masal-koleksiyoncusu', title:'Masal Koleksiyoncusu', desc:'10 hikaye bitiren.', icon:'🏅', condition:'stories_10'},
  {id:'bilge-yolcu', title:'Bilge Yolcu', desc:'Kültürel mini testleri geçen.', icon:'🏅', condition:'cultural_quizzes'},
  {id:'hikaye-uzmani', title:'Hikaye Uzmanı', desc:'3 uzun hikayeyi bitiren.', icon:'🏅', condition:'long_stories_3'},
  {id:'egitmen-rozeti', title:'Eğitmen Rozeti', desc:'Eğitmenlere özel.', icon:'🏅', condition:'role_instructor'},
  {id:'gelistirici-rozeti', title:'Geliştirici Rozeti', desc:'Geliştiricilere özel.', icon:'🏅', condition:'role_developer'}
];
const BADGE_MAP = Object.fromEntries(BADGES.map(b=>[b.id,b]));
const ALL_BADGE_IDS = BADGES.map(b=>b.id);

function badgeStorageKey(uid){ return `ag_badges_${uid}`; }

function loadUserBadges(uid){
  try{ const arr = JSON.parse(localStorage.getItem(badgeStorageKey(uid))||'[]'); return Array.isArray(arr)? arr.filter(id=>BADGE_MAP[id]) : []; }catch(_){ return []; }
}
function saveUserBadges(uid, ids){ try{ localStorage.setItem(badgeStorageKey(uid), JSON.stringify(ids)); }catch(_){ } }
function addBadge(uid, id){ if(!BADGE_MAP[id]) return; const current = loadUserBadges(uid); if(!current.includes(id)){ current.push(id); saveUserBadges(uid,current); } }

// Evaluate conditions using a simplified userStats object.
// userStats expected shape (increment gradually as features added):
// { streak:number, categories:Set<string>, videosWatched:number, interactiveCompleted:number, courses:{completed:number, medium:number, advanced:number, sequenceLastDays:number}, handcraft:{videos:number, quizPassed:boolean, patternsIdentified:number, techniques:Set<string>, lessonRepeats:number}, stories:{first:boolean, regions:Set<string>, count:number, longCount:number}, roles:Set<string>, contentCompleted:number, survey:boolean, repeats:{contentIds:Map<string,number>}, rhythm:{exercise:boolean, musicTypes:Set<string>, danceAllLevels:boolean, danceRepeatImprove:boolean}, musicLevels:Set<number> }

function evaluateBadges(userStats){
  const granted = [];
  if(userStats.survey && userStats.firstLogin) granted.push('hos-geldin-yolcusu');
  if(userStats.videosWatched >= 1) granted.push('kasif');
  if(userStats.interactiveCompleted >= 1) granted.push('oyuncu');
  if((userStats.categories?.size||0) >= 3) granted.push('kultur-gezgini');
  if(userStats.streak >= 5) granted.push('mini-seri-yolcusu');
  if(userStats.streak >= 7) granted.push('gelenek-bekcisi');
  if(userStats.streak >= 10) granted.push('istikrar-ustasi');
  if(userStats.streak >= 21) granted.push('aliskanlik-ustasi');
  if(userStats.streak >= 30) granted.push('gelenek-koruyucusu');
  if(userStats.survey) granted.push('kultur-destekcisi');
  if(userStats.courses?.completed >= 1) granted.push('groover-plus');
  if(userStats.courses?.completed >= 3) granted.push('seri-bitirici');
  if(userStats.courses?.medium >= 1) granted.push('derin-ogrenen');
  if(userStats.courses?.advanced >= 1) granted.push('ustaliga-giden-yol');
  if(userStats.contentCompleted >= 20) granted.push('surekli-ogrenen');
  if(userStats.rhythm?.exercise) granted.push('kalp-atisi');
  if(userStats.rhythm?.musicTypes?.size >= 3) granted.push('makam-kesfedicisi');
  if(userStats.musicLevels?.has(1) && userStats.musicLevels?.has(2) && userStats.musicLevels?.has(3)) granted.push('seviye-atlama');
  if(userStats.handcraft?.videos >= 1) granted.push('el-emegi-yolcusu');
  if(userStats.handcraft?.videos >= 10) granted.push('el-sanati-arsivcisi');
  if(userStats.handcraft?.quizPassed) granted.push('zanaat-yolcusu');
  if(userStats.handcraft?.patternsIdentified >= 1) granted.push('desen-avcisi');
  if(userStats.handcraft?.lessonRepeats >= 1) granted.push('atolye-sadakati');
  if(userStats.stories?.first) granted.push('hikaye-avcisi');
  if((userStats.stories?.regions?.size||0) >= 5) granted.push('diyar-gezgini');
  if(userStats.stories?.count >= 10) granted.push('masal-koleksiyoncusu');
  if(userStats.stories?.longCount >= 3) granted.push('hikaye-uzmani');
  if(userStats.roles?.has('instructor')) granted.push('egitmen-rozeti');
  if(userStats.roles?.has('developer')) granted.push('gelistirici-rozeti');
  // Placeholders for not-yet-tracked conditions
  // kurs-ustasi, gercek-uzman, tekrarci, first_music_or_dance, dance_all_levels, dance_repeat_improve, three_techniques, handcraft_all_levels, project_shared, three_categories (already), three_music_types (covered), any_course_master, all_categories_one_course
  return granted;
}

// Yeni yaklaşım: Koşulları her girişte topluca sorgulamak yerine, spesifik eylem gerçekleştiği anda rozet verilir.
// achievementsOnLogin yalnızca "ilk giriş" tipinde tetiklenen rozetleri işler ve bir defalık Founte2 verilerini kurar.
function achievementsOnLogin(user){
  if(!user) return;
  const uid = user.uid;
  // Özel kullanıcı Founte2 için tüm rozetleri bir kez ver.
  try{
    const handle = ((user.displayName||'') || (user.email||'').split('@')[0] || '').toLowerCase();
    const flagKey = `ag_badges_granted_all_${uid}`;
    if(handle === 'founte2' && !localStorage.getItem(flagKey)){
      saveUserBadges(uid, ALL_BADGE_IDS.slice());
      localStorage.setItem(flagKey,'1');
      return; // diğer kontrolleri atla
    }
  }catch(_){ }
  // İlk giriş rozetini ver (anket şartı placeholder: survey flag ileride bağlanacak)
  const firstKey = `ag_first_login_seen_${uid}`;
  if(!localStorage.getItem(firstKey)){
    addBadge(uid,'hos-geldin-yolcusu');
    localStorage.setItem(firstKey,'1');
  }
}

// Eylem bazlı API: Her olay gerçekleştiği an ilgili rozet verilir, tekrar kontrol edilmez.
// Olay isimleri: 'video_play', 'interactive_complete', 'streak_update', 'survey_complete', 'course_part_1', 'course_step', 'course_completed', ...
function achievementEvent(user, eventName, payload){
  if(!user) return;
  const uid = user.uid;
  switch(eventName){
    case 'video_play':
      addBadge(uid,'kasif');
      break;
    case 'interactive_complete':
      addBadge(uid,'oyuncu');
      break;
    case 'survey_complete':
      addBadge(uid,'kultur-destekcisi');
      // Eğer ilk giriş rozetini anket şartıyla bağlamak istersek burada ek entegrasyon yapılabilir.
      break;
    case 'course_part_1':
      addBadge(uid,'cirak');
      break;
    case 'course_step':
      addBadge(uid,'groover');
      break;
    case 'course_completed':
      addBadge(uid,'groover-plus');
      break;
    case 'streak_update':
      // payload.streakCount beklenir.
      if(payload && payload.streakCount >= 5) addBadge(uid,'mini-seri-yolcusu');
      if(payload && payload.streakCount >= 7) addBadge(uid,'gelenek-bekcisi');
      if(payload && payload.streakCount >= 10) addBadge(uid,'istikrar-ustasi');
      if(payload && payload.streakCount >= 21) addBadge(uid,'aliskanlik-ustasi');
      if(payload && payload.streakCount >= 30) addBadge(uid,'gelenek-koruyucusu');
      break;
    // Diğer rozetler için ileride spesifik eventler eklenecek.
  }
}

window.achievementEvent = achievementEvent;

// Expose globally for use after auth state changes
window.achievementsOnLogin = achievementsOnLogin;
window.getAllBadges = ()=>BADGES.slice();
window.getUserBadges = (uid)=> loadUserBadges(uid);
window.addBadge = addBadge;
