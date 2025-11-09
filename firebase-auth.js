// Minimal Firebase Auth integration using compat SDKs already included in index.html
// Exposes UI behaviors for sign up / sign in / sign out using email/password.

(function(){
  // We'll attempt to initialize Firebase when the user tries to authenticate so
  // that late-loaded scripts or slight ordering issues won't prevent auth from working.
  let auth = null;
  let firebaseInitialized = false;
  let firstInitHandled = false;

  // ===== Daily Streak helpers =====
  function ymdLocal(date){
    const d = date ? new Date(date) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function parseYMD(ymd){
    if(!ymd) return null;
    const [y,m,d] = ymd.split('-').map(Number);
    return new Date(y, m-1, d);
  }
  function daysBetweenYMD(aYmd, bYmd){
    if(!aYmd || !bYmd) return NaN;
    const a = parseYMD(aYmd), b = parseYMD(bYmd);
    if(!a || !b) return NaN;
    const ms = b.setHours(0,0,0,0) - a.setHours(0,0,0,0);
    return Math.round(ms / 86400000);
  }
  function streakKey(uid){ return `ag_streak_${uid}`; }
  function loadStreak(uid){
    try{
      const raw = localStorage.getItem(streakKey(uid));
      if(!raw) return { count: 0, lastDay: null, lastShownDay: null, pendingCelebrate: false, visits: [] };
      const obj = JSON.parse(raw);
      return Object.assign({ count: 0, lastDay: null, lastShownDay: null, pendingCelebrate: false, visits: [] }, obj||{});
    }catch(_){ return { count:0, lastDay:null, lastShownDay:null, pendingCelebrate:false, visits: [] }; }
  }
  function saveStreak(uid, obj){
    try{ localStorage.setItem(streakKey(uid), JSON.stringify(obj)); }catch(_){ }
    return obj;
  }
  // Update daily streak and mark celebration pending when continued streak
  function updateDailyStreak(uid){
    const today = ymdLocal();
    let s = loadStreak(uid);
    // ensure visits array exists
    if(!Array.isArray(s.visits)) s.visits = [];
    const addVisitIfMissing = ()=>{ if(!s.visits.includes(today)) s.visits.push(today); };

    if(!s.lastDay){
      // first ever visit
      s.count = 1; s.lastDay = today; s.pendingCelebrate = false; // don't celebrate first day
      addVisitIfMissing();
      saveStreak(uid, s);
      return { changed:true, streak:s };
    }
    if(s.lastDay === today){
      // already counted today; nothing to do
      addVisitIfMissing();
      saveStreak(uid, s);
      return { changed:false, streak:s };
    }
    const diff = daysBetweenYMD(s.lastDay, today);
    if(diff === 1){
      // continued streak
      s.count = (s.count||0) + 1;
      s.lastDay = today;
      s.pendingCelebrate = true; // show +1 once on any page
      addVisitIfMissing();
      saveStreak(uid, s);
      return { changed:true, streak:s };
    }
    // missed at least one day -> reset
    s.count = 1;
    s.lastDay = today;
    s.pendingCelebrate = false;
    addVisitIfMissing();
    saveStreak(uid, s);
    return { changed:true, streak:s };
  }
  function ensureStreakPill(){
    const pill = document.getElementById('streakPill');
    if(pill) return pill;
    // If userArea exists, inject a minimal pill container (fallback)
    if(userArea){
      const wrapper = userArea.querySelector('.signed-in');
      if(wrapper){
        const el = document.createElement('div');
        el.className = 'streak-pill';
        el.id = 'streakPill';
        el.title = 'Günlük Seri';
        el.innerHTML = '🔥 <span id="streakCount">0</span>';
        wrapper.insertBefore(el, wrapper.firstChild);
        return el;
      }
    }
    return null;
  }
  function renderOrUpdateStreakPill(count){
    const pill = ensureStreakPill();
    if(!pill) return;
    const c = pill.querySelector('#streakCount');
    if(c) c.textContent = String(count||0);
  }
  function showStreakIfPending(uid){
    const today = ymdLocal();
    const s = loadStreak(uid);
    if(!s) return;
    if(s.pendingCelebrate && s.count >= 2 && s.lastShownDay !== today){
      // Show modal once
      openStreakCelebrateModal(s.count);
      s.pendingCelebrate = false;
      s.lastShownDay = today;
      saveStreak(uid, s);
    }
  }
  function openStreakCelebrateModal(newCount){
    const modal = document.createElement('div');
    modal.className = 'streak-modal';
    modal.innerHTML = `
      <div class="streak-card" role="dialog" aria-modal="true" aria-labelledby="streakTitle">
        <div class="streak-icon">🔥</div>
        <div class="streak-text">
          <div id="streakTitle" class="streak-title">Günlük Seri!</div>
          <div class="streak-sub">Serin arttı</div>
        </div>
        <div class="plus-one">+1</div>
        <div class="streak-total">${newCount} Gün</div>
        <button class="btn secondary close-streak" aria-label="Kapat">Tamam</button>
      </div>`;
    document.body.appendChild(modal);
    // auto close after 2.2s or on click
    const closer = ()=>{ try{ modal.remove(); }catch(_){ } };
    modal.addEventListener('click', (e)=>{ if(e.target === modal) closer(); });
    modal.querySelector('.close-streak')?.addEventListener('click', closer);
    setTimeout(closer, 2200);
    // brief pulse on pill if present
    try{
      const pill = document.getElementById('streakPill');
      if(pill){ pill.classList.add('pulse'); setTimeout(()=> pill.classList.remove('pulse'), 1200); }
    }catch(_){ }
  }

  function openStreakHistoryModal(uid){
    const s = loadStreak(uid);
    const today = parseYMD(ymdLocal());
    let windowOffsetDays = 0; // 0 means window ends today
    const hasVisit = (dateYmd)=> Array.isArray(s.visits) && s.visits.includes(dateYmd);

    const renderWindow = ()=>{
      const modal = document.getElementById('streakHistoryModal');
      const grid = modal?.querySelector('.week-grid');
      if(!modal || !grid) return;
      grid.innerHTML = '';
      // Show 7 sequential days ending at (today - windowOffsetDays), oldest -> newest left to right
      const endDate = new Date(today); // newest day in window
      endDate.setDate(endDate.getDate() - windowOffsetDays);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6); // oldest day in window
      const TR_DAYS = ['Paz','Pts','Sal','Çar','Per','Cum','Cmt'];
      for(let i=0;i<7;i++){
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const weekday = TR_DAYS[d.getDay()] || '';
        const label = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
        const cell = document.createElement('div');
        cell.className = 'day' + (hasVisit(ymd) ? ' has-visit' : '');
        const ariaState = hasVisit(ymd) ? 'Giriş yapıldı' : 'Giriş yok';
        cell.setAttribute('aria-label', `${label} ${ariaState}`);
        cell.innerHTML = `<div class="wday">${weekday}</div><div class="dlabel">${label}</div>`;
        grid.appendChild(cell);
      }
      // enable/disable right arrow (cannot go into future beyond today)
      const right = modal.querySelector('#histRight');
      if(right) right.disabled = (windowOffsetDays <= 0);
    };

    const modal = document.createElement('div');
    modal.className = 'streak-history-modal';
    modal.id = 'streakHistoryModal';
    modal.innerHTML = `
      <div class="streak-history-card" role="dialog" aria-modal="true" aria-labelledby="histTitle">
        <div class="hist-header">
          <button class="hist-nav" id="histLeft" aria-label="Geçmiş hafta">◀</button>
          <div id="histTitle" class="hist-title">Son 7 Gün</div>
          <button class="hist-nav" id="histRight" aria-label="İleri hafta">▶</button>
        </div>
        <div class="week-grid"></div>
        <div class="hist-legend"><span class="dot yes"></span> Girdiğin günler</div>
        <div class="hist-actions"><button class="btn secondary" id="histClose">Kapat</button></div>
      </div>`;
    document.body.appendChild(modal);
    const closer = ()=>{ try{ modal.remove(); }catch(_){ } };
    modal.addEventListener('click', (e)=>{ if(e.target === modal) closer(); });
    modal.querySelector('#histClose')?.addEventListener('click', closer);
    modal.querySelector('#histLeft')?.addEventListener('click', ()=>{ windowOffsetDays += 7; renderWindow(); });
    modal.querySelector('#histRight')?.addEventListener('click', ()=>{ windowOffsetDays = Math.max(0, windowOffsetDays - 7); renderWindow(); });
    renderWindow();
  }

  function isOnHomePage(){
    try{
      const path = (location && location.pathname ? location.pathname : '').toLowerCase();
      return path.endsWith('/anasayfa.html') || path.endsWith('anasayfa.html');
    }catch(_){ return false; }
  }

  function allowHomeRedirect(){
    try{ return !(typeof window !== 'undefined' && window.AG_DISABLE_HOME_REDIRECT); }
    catch(_){ return true; }
  }

  function navigateToHome(){
    if(allowHomeRedirect()){
      window.location.href = 'anasayfa.html';
      return true;
    }
    return false;
  }

  function ensureAuthInitialized(){
    const hasFirebase = (typeof firebase !== 'undefined');
    const hasConfig = (typeof firebaseConfig !== 'undefined');
    if(!hasFirebase || !hasConfig){
      console.warn('Firebase init check:', { hasFirebase, hasConfig });
      return { ok:false, hasFirebase, hasConfig };
    }
    if(!firebaseInitialized){
      try{
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        firebaseInitialized = true;
        // start observing auth state
        auth.onAuthStateChanged(user=>{
          if(user) {
            renderSignedIn(user);
                // on first init, if profile complete send user to the dedicated homepage
                if(!firstInitHandled){
                  firstInitHandled = true;
                  try{
                            if(isProfileComplete(user.uid)){
                              // if we're already on the homepage, render in-place; otherwise navigate there (unless disabled)
                              if(isOnHomePage()){
                                showAppArea({scroll:false});
                              } else {
                                navigateToHome();
                              }
                    } else {
                      // Profile NOT complete - stay on index.html and show the survey
                      if(isOnHomePage()){
                        // if somehow on anasayfa.html without profile, go back to index
                        window.location.href = 'index.html';
                      } else {
                        // we're on index.html - show the profile form
                        showAppArea({scroll:true});
                      }
                    }
                  }catch(e){ if(heroSection) heroSection.style.display = ''; }
                }
          } else {
            renderSignedOut();
          }
        });
      }catch(e){
        console.error('Error initializing Firebase (might already be initialized):', e);
        try{ auth = firebase.auth(); firebaseInitialized = true; }catch(_){/* ignore */}
      }
    }
    return { ok:true };
  }

  const userArea = document.getElementById('userArea');
  const openSignup = document.getElementById('openSignup');
  const openSignin = document.getElementById('openSignin');
  const appArea = document.getElementById('appArea');
  const heroSection = document.querySelector('.hero');

  // Profile completion helpers (uses localStorage keyed by uid)
  function profileKey(uid){ return `ag_profile_complete_${uid}`; }
  function isProfileComplete(uid){
    if(!uid) return false;
    try{ return localStorage.getItem(profileKey(uid)) === '1'; }catch(e){ return false; }
  }
  function setProfileComplete(uid, val=true){
    if(!uid) return;
    try{ localStorage.setItem(profileKey(uid), val ? '1' : '0'); }catch(e){}
  }
  // expose helper for later use
  window.markProfileComplete = function(){ if(auth && auth.currentUser) setProfileComplete(auth.currentUser.uid, true); };

  function showAppArea(opts){
    // opts: { scroll: boolean } - default: false to avoid unexpected scrolling on page load
    const doScroll = opts && typeof opts.scroll !== 'undefined' ? !!opts.scroll : false;
    if(heroSection) heroSection.style.display = 'none';
    if(appArea) appArea.style.display = 'block';
    // scroll to app area only when explicitly requested (e.g. user-initiated actions)
    if(doScroll) appArea && appArea.scrollIntoView({behavior:'smooth'});
    // if profile not complete, show profile form inside appArea
    try{
      const user = auth && auth.currentUser;
      if(user && !isProfileComplete(user.uid)){
        renderProfileForm(user.uid);
      } else {
        renderMainForUser();
      }
    }catch(e){ renderMainForUser(); }
  }

  function renderMainForUser(){
    if(!appArea) return;

    // If a previous slider instance exists, tear it down before rebuilding to avoid dangling timers/listeners.
    try{
      if(window.__ag_cleanup_slider){
        window.__ag_cleanup_slider();
        delete window.__ag_cleanup_slider;
      }
    }catch(_){ }

    // Define all possible slides
    const allSlides = [
      {id:'baglama', title:'Bağlama Eğitimi', img: encodeURI('assets/Bağlama_yatay.png'), desc:'Bağlama çalmayı öğrenin: akorlar, ritimler ve repertuar.'},
      {id:'ney', title:'Ney ve Üflemeli Çalgılar', img: encodeURI('assets/Ney_yatay.png'), desc:'Ney teknikleri ve nefes çalışmaları ile müzikal yolculuğunuzu başlatın.'},
      {id:'gorsel', title:'Görsel Sanatlar', img: encodeURI('assets/Görsel Sanatlar.png'), desc:'Görsel sanatlar: resim, kompozisyon ve farklı tekniklerle yaratıcılığınızı keşfedin.'},
      {id:'halk', title:'Halk Oyunları', img: encodeURI('assets/Halk Oyunları Yatay.png'), desc:'Yerel dans stilleri ve koreografilerle kültürel mirası yaşayın.'},
  {id:'ut', title:'Ut Eğitimi', img: encodeURI('assets/Ut.png'), desc:'Ut öğrenin: temel teknikler, makamlar ve icra pratikleri.'},
  {id:'halkhikaye', title:'Halk Hikayeleri', img: encodeURI('assets/halkhikayeleri.png'), desc:'Halk hikayeleri ve anonim kültürel anlatılarla geçmişe yolculuk.'}
    ];

  // Build slides list by prioritizing user's selected interests first, then the rest
    let slides = allSlides;
    try{
      const user = auth && auth.currentUser;
      if(user){
        const raw = localStorage.getItem(`ag_profile_${user.uid}`);
        if(raw){
          const profile = JSON.parse(raw);
          if(profile && Array.isArray(profile.interests) && profile.interests.length>0){
            const picked = profile.interests.map(id=>id.toString());
            // keep order: first the picked ones in the order they appear in allSlides, then the remaining slides
            const pickedSlides = allSlides.filter(s => picked.includes(s.id));
            const otherSlides = allSlides.filter(s => !picked.includes(s.id));
            slides = pickedSlides.concat(otherSlides);
          }
        }
      }
    }catch(e){ console.warn('Error reading profile for slider filter', e); }

    // Determine picked slides (user's interests) and slider content (all slides)
    let pickedSlides = [];
    try{
      const user = auth && auth.currentUser;
      if(user){
        const raw = localStorage.getItem(`ag_profile_${user.uid}`);
        if(raw){
          const profile = JSON.parse(raw);
          if(profile && Array.isArray(profile.interests) && profile.interests.length>0){
            const pickedIds = profile.interests.map(id=>id.toString());
            pickedSlides = allSlides.filter(s => pickedIds.includes(s.id));
          }
        }
      }
    }catch(e){ console.warn('Error reading profile for picked slides', e); }

    appArea.innerHTML = `
      <!-- Slider pinned to top (no heading) -->
      <div class="slider slider-top" id="mainSlider">
        <div class="slides" id="slides"></div>
      </div>
      <div class="dots" id="sliderDots"></div>

      <section style="padding:14px 18px">
        <h2>İlgi Alanlarınız</h2>
        <div class="cards-row" id="cardsRow"></div>
      </section>

      <section style="padding:14px 18px">
        <h2>Yeni İlgi Alanları</h2>
        <div class="all-interests-grid" id="allInterestsRow"></div>
      </section>
    `;

    // Slider uses allSlides as content (show all interest areas)
    const slidesEl = document.getElementById('slides');
    const dotsEl = document.getElementById('sliderDots');

    // Helper: simple Fisher-Yates shuffle (non-destructive)
    function shuffled(arr){
      const a = arr.slice();
      for(let i=a.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // Build slider order: shuffle allSlides so slider order differs from other lists
    const sliderSlides = shuffled(allSlides);

    // Preload the first N important images (above-the-fold) to improve initial paint
    try{
      const preloadCount = Math.min(2, sliderSlides.length);
      for(let i=0;i<preloadCount;i++){
        const href = sliderSlides[i].img;
        // avoid duplicate preload tags
        if(href && !document.querySelector(`link[rel="preload"][href="${href}"]`)){
          const l = document.createElement('link');
          l.rel = 'preload'; l.as = 'image'; l.href = href;
          document.head.appendChild(l);
        }
      }
    }catch(e){/* non-fatal */}

    // helper to create slide element
    // makeSlideElement accepts opts.priority to mark high-priority images
    function makeSlideElement(s, opts){
      const slide = document.createElement('div'); slide.className = 'slide';
      const eager = opts && opts.priority;
      const attrs = eager ? 'loading="eager" fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
      slide.innerHTML = `<img src="${s.img}" alt="${s.title}" ${attrs} /><div class="slide-caption"><h3>${s.title}</h3><p>${s.desc}</p></div>`;
      // small JS-level fallback: if image fails to load, add a CSS class so it can be styled (no external fallback required)
      try{
        const img = slide.querySelector('img'); if(img){ img.addEventListener('error', ()=>{ img.classList.add('img-error'); }); }
      }catch(e){}
      return slide;
    }

    // helper to wire interest cards to dedicated pages
    const wireCardNav = (el, id) => {
      if(!el || !id) return;
      try{
        const pageMap = {
          baglama: 'baglama.html',
          ney: 'ney.html',
          gorsel: 'gorsel.html',
          halk: 'halk.html',
          ut: 'ut.html',
          halkhikaye: 'halkhikaye.html'
        };
        const page = pageMap[id];
        if(page){
          el.style.cursor = 'pointer';
          el.setAttribute('role','link');
          el.tabIndex = 0;
          const go = ()=>{ window.location.href = page; };
          el.addEventListener('click', go);
          el.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
        }
      }catch(_){ }
    };

    // Build augmented slider for seamless infinite loop: [cloneLast, ...origins, cloneFirst]
    slidesEl.innerHTML = '';
    const origCount = sliderSlides.length;
    if(origCount > 0){
  // prepend clone of last
  const cloneLast = makeSlideElement(sliderSlides[origCount-1]); cloneLast.classList.add('clone'); slidesEl.appendChild(cloneLast);
  // originals (mark the first original as high-priority)
  const _preloadCount = Math.min(2, sliderSlides.length);
  sliderSlides.forEach((s, idx)=> slidesEl.appendChild(makeSlideElement(s, { priority: idx < _preloadCount })));
  // append clone of first
  const cloneFirst = makeSlideElement(sliderSlides[0]); cloneFirst.classList.add('clone'); slidesEl.appendChild(cloneFirst);
    }

    // build dots for originals only
    dotsEl.innerHTML = '';
    for(let i=0;i<origCount;i++){
      const dot = document.createElement('div'); dot.className='dot'; dot.dataset.idx = i; dotsEl.appendChild(dot);
      dot.addEventListener('click', ()=>{ goToSlide(i); resetAuto(); });
    }

  // Render picked cards (compact) BELOW the slider
  const cardsRow = document.getElementById('cardsRow');
    if(pickedSlides.length === 0){
      // No picks: show all slides in a different deterministic order (rotate by 1)
      const rotated = allSlides.slice(1).concat(allSlides.slice(0,1));
        

        rotated.forEach(s=>{
        const c = document.createElement('div'); c.className='mini-card';
        c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`;
        cardsRow.appendChild(c);
        wireCardNav(c, s.id);
      });
      const prompt = document.createElement('div'); prompt.style.padding = '12px'; prompt.style.color = 'var(--muted)'; prompt.innerHTML = `Henüz ilgi alanı seçmediniz. `;
      const btn = document.createElement('button'); btn.className = 'btn primary'; btn.id = 'openProfile'; btn.textContent = 'Anketi Doldur';
      prompt.appendChild(btn);
      cardsRow.appendChild(prompt);
      btn.addEventListener('click', ()=>{ if(auth && auth.currentUser) renderProfileForm(auth.currentUser.uid); else openAuthModal('signup'); });
    } else {
      // Respect user's selection order (profile.interests order)
      try{
        const user = auth && auth.currentUser;
        const raw = user ? localStorage.getItem(`ag_profile_${user.uid}`) : null;
        let profileOrder = null;
        if(raw){ const profile = JSON.parse(raw); if(profile && Array.isArray(profile.interests)) profileOrder = profile.interests.map(String); }
        if(profileOrder){
          profileOrder.forEach(id=>{
            const s = allSlides.find(x => x.id === id);
            if(s){ const c = document.createElement('div'); c.className='mini-card'; c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`; cardsRow.appendChild(c); wireCardNav(c, s.id); }
          });
        } else {
          pickedSlides.forEach(s=>{
            const c = document.createElement('div'); c.className='mini-card';
            c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`;
            cardsRow.appendChild(c);
            wireCardNav(c, s.id);
          });
        }
      }catch(e){
        pickedSlides.forEach(s=>{
          const c = document.createElement('div'); c.className='mini-card';
          c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`;
          cardsRow.appendChild(c);
          wireCardNav(c, s.id);
        });
      }
    }

    // Populate the 'Yeni İlgi Alanları' all-interests grid (show all categories)
    try{
      const allRow = document.getElementById('allInterestsRow');
      if(allRow){
        // clear any existing children
        allRow.innerHTML = '';
        allSlides.forEach(s=>{
          const c = document.createElement('div'); c.className='interest-card'; c.setAttribute('data-id', s.id);
          c.innerHTML = `<div class="thumb"><img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/></div><div class="label">${s.title}</div><div class="desc">${s.desc}</div>`;
          allRow.appendChild(c);
          // if this is the Bağlama card, make it navigate to its dedicated page
          try{ if(typeof wireCardNav === 'function') wireCardNav(c, s.id); }catch(_){ }
        });
      }
    }catch(e){console.warn('Could not populate allInterestsRow', e);} 

    const slider = document.getElementById('mainSlider');

    // setup augmented slider state
    const originals = sliderSlides.length;
    let current = originals > 0 ? 1 : 0; // start at first real slide (index 1 in augmented list)
    let isTransitioning = false;
    let isDragging = false;
    let pendingUpdateRetry = null;
    let transitionFailsafe = null;
    let prevTranslate = 0;

    const clearTransitionFailsafe = ()=>{
      if(transitionFailsafe){
        clearTimeout(transitionFailsafe);
        transitionFailsafe = null;
      }
    };

    function clampAugIndex(value){
      if(value < 0) return 0;
      const upper = originals + 1;
      if(value > upper) return upper;
      return value;
    }

    const update = ()=>{
      const width = slideWidth();
      const validWidth = Number.isFinite(width) && width > 0;
      if(!validWidth){
        if(!pendingUpdateRetry){
          pendingUpdateRetry = setTimeout(()=>{
            pendingUpdateRetry = null;
            update();
          }, 140);
        }
        return;
      }
      if(pendingUpdateRetry){
        clearTimeout(pendingUpdateRetry);
        pendingUpdateRetry = null;
      }
      const translate = -current * width;
      slidesEl.style.transform = `translateX(${translate}px)`;
      const activeIndex = originals > 0 ? ((current - 1 + originals) % originals) : -1;
      Array.from(dotsEl.children).forEach((d,i)=> d.classList.toggle('active', i === activeIndex));
      Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
    };

    const handleLoopBoundaries = ()=>{
      if(originals === 0) return;
      const rawWidth = slideWidth();
      const width = (Number.isFinite(rawWidth) && rawWidth > 0) ? rawWidth : (slider ? slider.clientWidth : 0);
      if(current === originals + 1){
        slidesEl.style.transition = 'none';
        current = 1;
        const translate = -current * width;
        slidesEl.style.transform = `translateX(${translate}px)`;
        Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
        void slidesEl.offsetWidth;
        slidesEl.style.transition = '';
        update();
      } else if(current === 0){
        slidesEl.style.transition = 'none';
        current = originals;
        const translate = -current * width;
        slidesEl.style.transform = `translateX(${translate}px)`;
        Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
        void slidesEl.offsetWidth;
        slidesEl.style.transition = '';
        update();
      }
    };

    function startTransitionMonitor(previousIndex){
      if(previousIndex === current) return;
      if(isDragging) return;
      if(slidesEl.style.transition === 'none') return;
      isTransitioning = true;
      clearTransitionFailsafe();
      transitionFailsafe = setTimeout(()=>{
        if(!isTransitioning) return;
        handleLoopBoundaries();
        isTransitioning = false;
      }, 700);
    }

    function setCurrentAug(nextIndex){
      const clamped = clampAugIndex(nextIndex);
      const previous = current;
      current = clamped;
      update();
      startTransitionMonitor(previous);
    }

    function goToSlide(i){
      if(originals === 0) return;
      if(isTransitioning && !isDragging) return;
      setCurrentAug(i+1);
    }

    function next(){
      if(originals <= 1) return;
      if(isTransitioning || isDragging) return;
      setCurrentAug(current+1);
    }

    // Auto-advance every 10s
    let auto = null;
    function stopAuto(){
      if(auto){
        clearInterval(auto);
        auto = null;
      }
    }
    function startAuto(){
      if(originals <= 1) return;
      stopAuto();
      auto = setInterval(next, 10000);
    }
    function resetAuto(){
      stopAuto();
      startAuto();
    }
    startAuto();

    // Pause on hover
    // Named handlers for cleanup
    const onMouseEnter = ()=> stopAuto();
    const onMouseLeave = ()=> { resetAuto(); };
    if(slider){
      slider.addEventListener('mouseenter', onMouseEnter);
      slider.addEventListener('mouseleave', onMouseLeave);
    }

    // transition events: handle seamless jump when hitting clones and clean up flags
    const onTransitionEnd = (ev)=>{
      if(ev.target !== slidesEl || ev.propertyName !== 'transform') return;
      handleLoopBoundaries();
      isTransitioning = false;
      clearTransitionFailsafe();
    };
    const onTransitionCancel = (ev)=>{
      if(ev.target !== slidesEl) return;
      if(ev.propertyName && ev.propertyName !== 'transform') return;
      handleLoopBoundaries();
      isTransitioning = false;
      clearTransitionFailsafe();
    };
    slidesEl.addEventListener('transitionend', onTransitionEnd);
    slidesEl.addEventListener('transitioncancel', onTransitionCancel);

  // Improved drag/swipe support with live dragging, parallax, and 10% threshold
  let startX = 0;
    function pxTranslate(x){ slidesEl.style.transform = `translateX(${x}px)`; }
    function slideWidth(){
      // Prefer the actual rendered slide width (accounts for padding/margins)
      try{
        const first = slidesEl.querySelector('.slide');
        if(first && first.clientWidth) return first.clientWidth;
      }catch(_){ }
      return slider ? slider.clientWidth : 0;
    }
    const thresholdRatio = 0.10; // 10%

    // Pointer handlers (named so they can be removed)
    const onPointerDown = (e)=>{
      isDragging = true;
      clearTransitionFailsafe();
      isTransitioning = false;
  if(slider) slider.classList.add('dragging');
      startX = e.clientX;
      prevTranslate = -current * slideWidth();
      slidesEl.style.transition = 'none';
      stopAuto();
      try{ slidesEl.setPointerCapture(e.pointerId); }catch(_){/* ignore */}
    };
    const onPointerMove = (e)=>{
      if(!isDragging) return;
      const dx = e.clientX - startX;
      // move slides
      pxTranslate(prevTranslate + dx);
      // parallax: move images slightly relative to drag
      const imgs = slidesEl.querySelectorAll('img');
      imgs.forEach((img, idx)=>{
        const factor = (idx === current) ? 0.25 : 0.12;
        img.style.transform = `translateX(${dx * factor}px)`;
      });
    };
    const onPointerUp = (e)=>{
      if(!isDragging) return;
      isDragging = false;
      if(slider) slider.classList.remove('dragging');
      slidesEl.style.transition = '';
      const dx = e.clientX - startX;
      const movedRatio = Math.abs(dx) / slideWidth();
      if(movedRatio >= thresholdRatio){
        if(dx < 0) setCurrentAug(current+1); else setCurrentAug(current-1);
      } else {
        setCurrentAug(current);
      }
      Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
      try{ slidesEl.releasePointerCapture(e.pointerId); }catch(_){/* ignore */}
      resetAuto();
    };
    const onPointerCancel = ()=>{
      if(!isDragging) return;
      isDragging = false;
      if(slider) slider.classList.remove('dragging');
      slidesEl.style.transition = '';
      setCurrentAug(current);
      Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
      resetAuto();
    };

    slidesEl.addEventListener('pointerdown', onPointerDown);
    slidesEl.addEventListener('pointermove', onPointerMove);
    slidesEl.addEventListener('pointerup', onPointerUp);
    slidesEl.addEventListener('pointercancel', onPointerCancel);

    // Expose a cleanup function so signing out can stop intervals and remove listeners
    // handle window resize to re-align pixel-based transforms
    let __ag_resize_timer = null;
    const onResize = ()=>{
      if(__ag_resize_timer) clearTimeout(__ag_resize_timer);
      __ag_resize_timer = setTimeout(()=>{
        try{ slidesEl.style.transition = 'none'; update(); void slidesEl.offsetWidth; slidesEl.style.transition = ''; prevTranslate = -current * slideWidth(); }catch(_){ }
      }, 120);
    };
    window.addEventListener('resize', onResize);

    window.__ag_cleanup_slider = function(){
      try{ stopAuto(); }catch(_){/* ignore */}
      try{ if(slider){ slider.removeEventListener('mouseenter', onMouseEnter); slider.removeEventListener('mouseleave', onMouseLeave); } }catch(_){ }
      try{ slidesEl.removeEventListener('pointerdown', onPointerDown); slidesEl.removeEventListener('pointermove', onPointerMove); slidesEl.removeEventListener('pointerup', onPointerUp); slidesEl.removeEventListener('pointercancel', onPointerCancel); }catch(_){ }
      try{ slidesEl.removeEventListener('transitionend', onTransitionEnd); slidesEl.removeEventListener('transitioncancel', onTransitionCancel); }catch(_){ }
      try{ window.removeEventListener('resize', onResize); if(__ag_resize_timer) { clearTimeout(__ag_resize_timer); __ag_resize_timer = null; } }catch(_){ }
      try{ if(pendingUpdateRetry){ clearTimeout(pendingUpdateRetry); pendingUpdateRetry = null; } }catch(_){ }
      try{ clearTransitionFailsafe(); }catch(_){ }
      isTransitioning = false;
      isDragging = false;
      try{ Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)'); }catch(_){ }
    };

    // initial state: run after a frame and after the first image paints to ensure correct widths
    requestAnimationFrame(()=>{
      update();
      prevTranslate = -current * slideWidth();
      // ensure we re-align once the first slide image loads (some browsers change layout after image decode)
      try{
        const imgs = slidesEl.querySelectorAll('img');
        let aligned = false;
        imgs.forEach(img=>{
          if(img.complete){ /* already loaded */ aligned = true; }
          img.addEventListener('load', ()=>{
            if(!aligned){ aligned = true; update(); prevTranslate = -current * slideWidth(); }
          });
        });
        if(aligned){ update(); prevTranslate = -current * slideWidth(); }
      }catch(_){ }
    });
  }

  function renderProfileForm(uid){
    if(!appArea) return;
    // interest options using local assets (use your assets/*.png files)
    const interests = [
      {id:'baglama', label:'Bağlama', img: encodeURI('assets/Bağlama_yatay.png')},
      {id:'ney', label:'Ney', img: encodeURI('assets/Ney_yatay.png')},
      {id:'gorsel', label:'Görsel Sanatlar', img: encodeURI('assets/Görsel Sanatlar.png')},
      {id:'halk', label:'Halk Oyunları', img: encodeURI('assets/Halk Oyunları Yatay.png')},
      {id:'ut', label:'Ut', img: encodeURI('assets/Ut.png')},
      {id:'halkhikaye', label:'Halk Hikayeleri', img: encodeURI('assets/halkhikayeleri.png')}
    ];

    appArea.innerHTML = `
      <div class="profile-form">
        <h2>Başlangıç Bilgileri</h2>
        <div id="stepInterests">
          <label>İlgi Alanların (en az birini seç):</label>
          <div class="interest-grid" id="interestGrid"></div>
          <div class="profile-actions"><button id="pfNext" class="btn primary">Devam</button></div>
        </div>
        <div id="stepAge" style="display:none">
          <label>Yaşın:</label>
          <input id="pf_age" type="number" min="8" max="120" />
          <div class="profile-actions"><button id="pfSave" class="btn primary">Kaydet ve İlerle</button></div>
        </div>
      </div>
    `;

    const grid = document.getElementById('interestGrid');
    const selected = new Set();
    // render cards with real images
    interests.forEach(it =>{
      const card = document.createElement('div'); card.className='interest-card'; card.setAttribute('data-id', it.id);
      card.innerHTML = `<div class="thumb"><img src="${it.img}" alt="${it.label}"/></div><div class="label">${it.label}</div>`;
      card.addEventListener('click', ()=>{
        if(card.classList.contains('selected')){ card.classList.remove('selected'); selected.delete(it.id); }
        else { card.classList.add('selected'); selected.add(it.id); }
      });
      grid.appendChild(card);
    });

    document.getElementById('pfNext').addEventListener('click', ()=>{
      if(selected.size === 0){ alert('Lütfen en az bir ilgi alanı seçin.'); return; }
      document.getElementById('stepInterests').style.display = 'none';
      document.getElementById('stepAge').style.display = '';
    });

    document.getElementById('pfSave').addEventListener('click', ()=>{
      const age = document.getElementById('pf_age').value.trim();
      if(!age){ alert('Lütfen yaşınızı girin.'); return; }
      const payload = { interests: Array.from(selected), age };
      try{ localStorage.setItem(`ag_profile_${uid}`, JSON.stringify(payload)); setProfileComplete(uid, true); }catch(e){ console.error(e); }
      // After completing the survey, send user to the main homepage (unless the page opted out)
      try{
        if(!navigateToHome()){
          renderMainForUser();
        }
      }catch(e){ renderMainForUser(); }
    });
  }

  function hideAppArea(){
    if(appArea) appArea.style.display = 'none';
    if(heroSection) heroSection.style.display = '';
  }

  function renderSignedOut(){
    // Keep userArea minimal when signed-out; use header buttons for auth actions.
    userArea.innerHTML = '';
    // If a slider or other app-area intervals/listeners are active, clean them up
    try{ if(window.__ag_cleanup_slider) { window.__ag_cleanup_slider(); delete window.__ag_cleanup_slider; } }catch(_){ }
    // hide/clear app area so signed-out users see the hero (first-time visitor experience)
    try{ if(appArea){ appArea.style.display = 'none'; appArea.innerHTML = ''; } }catch(_){ }
    // show header auth buttons
    const headerAuth = document.getElementById('headerAuth');
    if(headerAuth) headerAuth.style.display = '';
    // ensure hero section and its buttons are visible
    if(heroSection) heroSection.style.display = '';
    const openSign = document.getElementById('openSignin'); if(openSign) openSign.style.display = '';
    const openStart = document.getElementById('openSignup'); if(openStart) openStart.style.display = '';
  }

  function renderSignedIn(user){
    const initials = (user.displayName ? user.displayName.split(' ').map(s=>s[0]).join('') : (user.email||'').slice(0,2)).toUpperCase();
    userArea.innerHTML = `
      <div class="signed-in user-menu">
        <div class="notify-bell" id="notifyBell" title="Bildirimler" tabindex="0" aria-haspopup="true" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 17a3 3 0 0 0 6 0" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="notify-badge" id="notifyBadge" style="display:none">0</span>
          <div class="notifications-dropdown" id="notificationsDropdown" aria-label="Bildirimler">
            <div class="notifications-header">
              <h3>Bildirimler</h3>
              <div class="notifications-actions">
                <button class="btn secondary" id="markAllRead" style="padding:6px 10px">Tümünü okundu işaretle</button>
              </div>
            </div>
            <div class="notifications-list" id="notificationsList"></div>
            <div class="notifications-empty" id="notificationsEmpty" style="display:none">Yeni bildirim yok.</div>
          </div>
        </div>
        <div class="streak-pill" id="streakPill" title="Günlük Seri">🔥 <span id="streakCount">0</span></div>
        <div class="user-bubble" id="userBubble">${initials}</div>
        <div class="menu-dropdown" id="menuDropdown">
          <div class="menu-item" id="menuProfile">Profil</div>
          <div class="menu-item" id="manageAccount">Hesabı Yönet</div>
           <div class="menu-item" id="menuInstructors">Eğitmenlerimiz</div>
          <div class="menu-item" id="menuSignOut">Çıkış Yap</div>
        </div>
      </div>
    `;

  // hide header auth buttons when signed in
  const headerAuth = document.getElementById('headerAuth');
  if(headerAuth) headerAuth.style.display = 'none';

    const bubble = document.getElementById('userBubble');
    const dropdown = document.getElementById('menuDropdown');
    // make bubble keyboard accessible
    bubble.setAttribute('tabindex', '0');
    bubble.setAttribute('role', 'button');
    bubble.addEventListener('click', (ev)=>{
      ev.stopPropagation(); dropdown.classList.toggle('show');
    });
    bubble.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); dropdown.classList.toggle('show'); }
    });

    // close dropdown on outside click
    document.addEventListener('click', function docClose(){ if(dropdown && dropdown.classList.contains('show')) dropdown.classList.remove('show'); });

    document.getElementById('menuProfile').addEventListener('click', ()=>{
      window.location.href = 'profil.html';
    });

    document.getElementById('menuSignOut').addEventListener('click', ()=>{
      // confirmation modal
      const c = document.createElement('div'); c.className='auth-modal';
      c.innerHTML = `
        <div class="confirm-card">
          <h3>Çıkış Yap</h3>
          <p>Hesabınızdan çıkmak istediğinizden emin misiniz?</p>
          <div class="confirm-actions">
            <button class="btn secondary" id="cancelSignOut">İptal</button>
            <button class="btn primary" id="confirmSignOut">Çıkış Yap</button>
          </div>
        </div>`;
      document.body.appendChild(c);
      c.querySelector('#cancelSignOut').addEventListener('click', ()=>c.remove());
      c.querySelector('#confirmSignOut').addEventListener('click', async ()=>{
        try{ 
          await auth.signOut();
          // Navigate to landing page after sign out
          window.location.href = 'index.html';
        }catch(e){ console.error(e); }
        c.remove();
      });
    });

    document.getElementById('manageAccount').addEventListener('click', ()=>{
      window.location.href = 'account.html';
    });
    // If user hasn't completed initial profile, show hero and hide "Zaten bir hesabım var" button
    try{
      const complete = isProfileComplete(user.uid);
      if(!complete){
        // show hero section and hide the small 'Zaten bir hesabım var' button in hero
        if(heroSection) heroSection.style.display = '';
        const openSign = document.getElementById('openSignin'); if(openSign) openSign.style.display = 'none';
        // hide app area until they click Start
        if(appArea) appArea.style.display = 'none';
      } else {
        // profile complete -> navigate to homepage (anasayfa.html) unless we're already there
        if(isOnHomePage()){
          showAppArea({scroll:false});
        } else {
          navigateToHome();
        }
      }
    }catch(e){}

    // Update streak and reflect in navbar; show celebration if pending
    try{
      const result = updateDailyStreak(user.uid);
      renderOrUpdateStreakPill(result && result.streak ? result.streak.count : 0);
      // Defer celebration check a tick to allow DOM to settle
      setTimeout(()=> showStreakIfPending(user.uid), 250);
    }catch(_){ }

    // Make streak pill clickable to open history
    try{
      const pill = document.getElementById('streakPill');
      if(pill){
        const open = (ev)=>{ ev?.stopPropagation?.(); openStreakHistoryModal(user.uid); };
        pill.style.cursor = 'pointer';
        pill.addEventListener('click', open);
        pill.setAttribute('tabindex','0');
        pill.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); open(e); } });
      }
    }catch(_){ }

    // Notifications: fetch and render
    try{
      const bell = document.getElementById('notifyBell');
      const drop = document.getElementById('notificationsDropdown');
      const list = document.getElementById('notificationsList');
      const empty = document.getElementById('notificationsEmpty');
      const badge = document.getElementById('notifyBadge');
      const markAll = document.getElementById('markAllRead');
      const uid = user.uid;
      const storageKey = `ag_notifications_read_${uid}`;
      const getRead = ()=>{ try{ return JSON.parse(localStorage.getItem(storageKey)||'[]'); }catch(_){ return []; } };
      const setRead = (arr)=>{ try{ localStorage.setItem(storageKey, JSON.stringify(arr)); }catch(_){ } };

      async function fetchNotifications(){
        try{
          const res = await fetch('notifications.json', { cache: 'no-cache' });
          if(!res.ok) throw new Error('http-error');
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }catch(_){ return []; }
      }

      function render(items){
        const read = new Set(getRead());
        const unread = items.filter(it=> !read.has(String(it.id)));
        if(badge){ badge.textContent = String(unread.length); badge.style.display = unread.length>0 ? '' : 'none'; }
        if(!items.length){ empty.style.display = ''; list.innerHTML = ''; return; }
        empty.style.display = 'none';
        list.innerHTML = '';
        items.sort((a,b)=> (b.time||'').localeCompare(a.time||''));
        items.forEach(it=>{
          const el = document.createElement('div');
          el.className = 'notification-item' + (read.has(String(it.id)) ? '' : ' unread');
          const date = it.time ? new Date(it.time) : null;
          const when = date ? date.toLocaleString() : '';
          el.innerHTML = `<h4>${it.title||'Yeni içerik'}</h4><p>${it.body||''}</p><div class="notification-time">${when}</div>`;
          el.addEventListener('click', ()=>{
            // mark read on click
            const curr = getRead();
            const sid = String(it.id);
            if(!curr.includes(sid)){ curr.push(sid); setRead(curr); }
            el.classList.remove('unread');
            const n = Math.max(0, parseInt(badge.textContent||'0')-1); badge.textContent = String(n); badge.style.display = n>0 ? '' : 'none';
            if(it.url){
              const samePage = location.pathname.endsWith('index.html') && it.url.startsWith('index.html');
              if(samePage){
                // Only adjust hash without full reload for better UX
                const parts = it.url.split('#');
                if(parts[1]){
                  history.replaceState(null,'', '#'+parts[1]);
                  // attempt smooth scroll to target if exists
                  const target = document.getElementById(parts[1]) || document.querySelector(`[data-section='${parts[1]}']`);
                  if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
                }
              }else{
                window.location.href = it.url;
              }
            }
            // close dropdown after click
            drop.classList.remove('show');
            bell.setAttribute('aria-expanded','false');
          });
          list.appendChild(el);
        });
      }

      fetchNotifications().then((items)=>{
        render(items);
        // wire mark all once items are known
        markAll.addEventListener('click', ()=>{ const allIds = items.map(it=> String(it.id)); setRead(allIds); render(items); });
      });
      // toggle dropdown
      const toggle = (open)=>{
        drop.classList.toggle('show', open);
        bell.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      bell.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(!drop.classList.contains('show')); });
      bell.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(!drop.classList.contains('show')); }});
      document.addEventListener('click', (e)=>{ if(drop.classList.contains('show') && !bell.contains(e.target)) toggle(false); });
    }catch(_){ }

    // Instructors navigation
    try {
      const menuInstructors = document.getElementById('menuInstructors');
      if(menuInstructors){
        menuInstructors.addEventListener('click', ()=>{ window.location.href = 'egitmenlerimiz.html'; });
      }
    } catch(_){ }
  }

  // Basic modal UI (DOM creation)
  function openAuthModal(mode='signin'){
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-card">
        <button class="close">×</button>
        <h3>${mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}</h3>
        <input id="authEmail" type="email" placeholder="E-posta" />
        <input id="authPass" type="password" placeholder="Parola" />
        <button id="authSubmit" class="btn primary">${mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}</button>
        <div id="googleWrap" style="display:flex;align-items:center;gap:10px;margin-top:12px"></div>
        <p class="auth-switch">${mode === 'signup' ? 'Zaten bir hesabın var mı? <a href="#" id="toSignin">Giriş yap</a>' : 'Hesabın yok mu? <a href="#" id="toSignup">Kayıt ol</a>'}</p>
        <div class="auth-error" aria-live="polite"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close').addEventListener('click', ()=>modal.remove());
    // Allow Enter key to submit the modal form when typing in inputs
    modal.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        e.preventDefault();
        const submit = modal.querySelector('#authSubmit');
        if(submit) submit.click();
      }
    });

    modal.querySelector('#authSubmit').addEventListener('click', async ()=>{
      const email = modal.querySelector('#authEmail').value.trim();
      const pass = modal.querySelector('#authPass').value;
      const errEl = modal.querySelector('.auth-error');
      errEl.textContent = '';
      // Basic validation
      if(!email || !pass){ errEl.textContent = 'Lütfen e-posta ve parola girin.'; return; }
      // Ensure Firebase is initialized and auth is available
      const r = ensureAuthInitialized();
      if(!r.ok){
        // Show setup modal with details (keeps UX consistent with Google flow)
        openSetupModal(r);
        return;
      }
      try{
        let user = null;
        if(mode === 'signup'){
          const cred = await auth.createUserWithEmailAndPassword(email, pass);
          // prefer the user from the returned credential
          user = cred && cred.user ? cred.user : auth.currentUser;
        } else {
          await auth.signInWithEmailAndPassword(email, pass);
          user = auth.currentUser;
        }
        // after successful auth, route based on profile completion
        if(user){
          if(mode === 'signup'){
            modal.remove();
            // New signup - stay on index.html and show profile form
            showAppArea({scroll:true});
          } else if(isProfileComplete(user.uid)){
            modal.remove();
            if(allowHomeRedirect()) window.location.href = 'anasayfa.html';
          } else {
            modal.remove();
            // Existing user but profile incomplete - show the form
            showAppArea({scroll:true});
          }
        } else {
          modal.remove();
        }
      }catch(e){
        // Translate common Firebase errors to Turkish, but do not expose backend details for wrong credentials
        const code = e && e.code ? e.code : null;
        const genericAuthBad = new Set(['auth/wrong-password','auth/user-not-found','auth/invalid-email']);
        if(mode === 'signin' && genericAuthBad.has(code)){
          errEl.textContent = 'Yanlış e-posta veya şifre girdiniz.';
        } else {
          errEl.textContent = translateAuthError(code, e && e.message ? e.message : 'Giriş sırasında hata oluştu.');
        }
      }
    });

    modal.querySelector('#toSignup')?.addEventListener('click',(ev)=>{ev.preventDefault(); modal.remove(); openAuthModal('signup');});
    modal.querySelector('#toSignin')?.addEventListener('click',(ev)=>{ev.preventDefault(); modal.remove(); openAuthModal('signin');});

    // Google sign-in inside modal (small icon button)
    const googleWrap = modal.querySelector('#googleWrap');
    if(googleWrap){
      const gbtn = document.createElement('button');
      gbtn.className = 'btn google-icon';
      gbtn.title = 'Google ile giriş';
      // small Google 'G' svg
      gbtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.35 11.1h-9.2v2.8h5.2c-.23 1.3-1.1 2.4-2.35 3.05v2.55h3.8c2.22-2.05 3.5-5.05 3.5-8.45 0-.8-.07-1.55-.2-2.25z" fill="#4285F4"/><path d="M12.15 22c2.7 0 4.95-.9 6.6-2.45l-3.8-2.55c-1.05.7-2.4 1.15-3.8 1.15-2.9 0-5.35-1.95-6.23-4.6H2.06v2.9C3.7 19.95 7.6 22 12.15 22z" fill="#34A853"/><path d="M5.92 13c-.2-.6-.33-1.25-.33-1.9s.12-1.3.33-1.9V6.3H2.06C1.35 7.55.9 9.15.9 10.1s.45 2.55 1.16 3.8l3.8-1.9z" fill="#FBBC05"/><path d="M12.15 4.6c1.47 0 2.8.5 3.85 1.45l2.9-2.9C16.95 1.45 14.7.6 12.15.6 7.6.6 3.7 2.65 2.06 5.95l3.86 2.9C6.8 6.55 9.25 4.6 12.15 4.6z" fill="#EA4335"/></svg>`;
      googleWrap.appendChild(gbtn);
      gbtn.addEventListener('click', async ()=>{
        const r = ensureAuthInitialized();
        if(!r.ok){ openSetupModal(r); return; }
        try{
          const provider = new firebase.auth.GoogleAuthProvider();
          const result = await auth.signInWithPopup(provider);
          const user = result && result.user ? result.user : auth.currentUser;
          modal.remove();
          
          // Check if this is a new user or existing user without profile
          if(user){
            if(!isProfileComplete(user.uid)){
              // Show profile form on index.html
              showAppArea({scroll:true});
            } else if(allowHomeRedirect()){
              // Profile complete, go to homepage
              window.location.href = 'anasayfa.html';
            }
          }
  }catch(e){ modal.querySelector('.auth-error').textContent = translateAuthError(e && e.code ? e.code : null, e && e.message ? e.message : 'Giriş sırasında hata oluştu.'); }
      });
    }

    
  }

  // Map Firebase auth error codes to Turkish messages
  function translateAuthError(code, fallback){
    const map = {
      'auth/invalid-email': 'Geçersiz e-posta adresi.',
      'auth/user-disabled': 'Bu kullanıcı devre dışı bırakılmış.',
      'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
      'auth/wrong-password': 'Parola yanlış.',
      'auth/email-already-in-use': 'Bu e-posta zaten kullanılıyor.',
      'auth/weak-password': 'Parola çok zayıf. En az 6 karakter girin.',
      'auth/operation-not-allowed': 'E-posta/parola ile kimlik doğrulama izinli değil.',
      'auth/popup-blocked': 'Popup engellendi. Tarayıcı ayarlarınıza bakın veya farklı bir tarayıcı deneyin.',
      'auth/popup-closed-by-user': 'Popup kullanıcı tarafından kapatıldı.',
      'auth/cancelled-popup-request': 'Popup isteği iptal edildi.',
      'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.'
    };
    return (code && map[code]) ? map[code] : (fallback || 'Kimlik doğrulama sırasında hata oluştu.');
  }

  // If Firebase isn't available, provide a simple setup modal for the header button
  function openSetupModal(details){
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-card">
        <button class="close">×</button>
        <h3>Firebase yapılandırması gerekli</h3>
        <p>Bu özelliği kullanabilmek için proje köküne <code>firebase-config.js</code> dosyasını oluşturup Firebase projenizin config değerlerini yapıştırmalısınız.</p>
        <p>Adımlar README.md içinde de açıklanmıştır.</p>
        <pre style="font-size:12px;background:rgba(0,0,0,0.04);padding:8px;border-radius:6px;overflow:auto;">${details ? JSON.stringify(details) : ''}</pre>
        <button id="openReadme" class="btn primary">README'i Aç</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close').addEventListener('click', ()=>modal.remove());
    modal.querySelector('#openReadme').addEventListener('click', ()=>{
      modal.remove();
      // Try to open README in a new tab — this will only work if served via a web server.
      window.open('README.md', '_blank');
    });
  }

  // Debug helper: force-render profile form for current user or a specific uid
  window.debugShowProfile = function(uid){
    try{
      const targetUid = uid || (window.firebase && window.firebase.auth && window.firebase.auth().currentUser && window.firebase.auth().currentUser.uid);
      if(!targetUid) return console.warn('No uid available. Sign in first or pass uid to debugShowProfile(uid)');
      // renderProfileForm is in closure scope, call it
      renderProfileForm(targetUid);
    }catch(e){ console.error('debugShowProfile error', e); }
  };

  // Wire buttons
  openSignup && openSignup.addEventListener('click', ()=>{
    const r = ensureAuthInitialized();
    if(!r.ok){ openSetupModal(r); return; }
    // If user is already signed in, go to the app area (which will render profile form if needed).
      if(firebaseInitialized && auth){
      if(auth.currentUser){
        // If user already signed-in, send to homepage (unless redirects disabled)
        if(isOnHomePage()){
          showAppArea({scroll:true});
        } else if(allowHomeRedirect()){
          window.location.href = 'anasayfa.html';
        }
      } else {
        // Sometimes auth.currentUser is not immediately available right after createUserWithEmailAndPassword.
        // Retry briefly (up to ~2s) before falling back to opening the signup modal.
        let attempts = 0;
        const maxAttempts = 20; // ~2 seconds
        const tryShow = () => {
          attempts++;
          if(auth.currentUser){
            if(isOnHomePage()){
              showAppArea({scroll:true});
            } else if(allowHomeRedirect()){
              window.location.href = 'anasayfa.html';
            }
          } else if(attempts < maxAttempts){
            setTimeout(tryShow, 100);
          } else {
            // Fallback: show signup modal so user can sign in manually
            openAuthModal('signup');
          }
        };
        tryShow();
      }
    } else {
      // Not initialized or not signed in yet -> open signup modal
      openAuthModal('signup');
    }
  });
  openSignin && openSignin.addEventListener('click', ()=>{
    const r = ensureAuthInitialized();
    if(r.ok) openAuthModal('signin'); else openSetupModal(r);
  });

  // Header sign-in button
  const headerSignupBtn = document.getElementById('headerSignupBtn');
  const headerSigninBtn = document.getElementById('headerSigninBtn');
  headerSignupBtn && headerSignupBtn.addEventListener('click', ()=>{
    const r = ensureAuthInitialized();
    if(r.ok) openAuthModal('signup'); else openSetupModal(r);
  });
  headerSigninBtn && headerSigninBtn.addEventListener('click', ()=>{
    const r = ensureAuthInitialized();
    if(r.ok) openAuthModal('signin'); else openSetupModal(r);
  });

  // (debug helpers removed) — no test clear UI or global console helpers remain

  // header Google button removed — Google sign-in now appears inside modal as a small icon

  // Auth state observer (only if auth available)
  // If Firebase is already present + config available, initialize right away.
  const early = ensureAuthInitialized();
  if(!early.ok){
    // show signed-out UI UI for now
    renderSignedOut();
  }

})();
