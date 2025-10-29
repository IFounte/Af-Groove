// Minimal Firebase Auth integration using compat SDKs already included in index.html
// Exposes UI behaviors for sign up / sign in / sign out using email/password.

(function(){
  // We'll attempt to initialize Firebase when the user tries to authenticate so
  // that late-loaded scripts or slight ordering issues won't prevent auth from working.
  let auth = null;
  let firebaseInitialized = false;
  let firstInitHandled = false;

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
            // on first init, auto-show app area only for users who already completed profile
            if(!firstInitHandled){
              firstInitHandled = true;
              try{
                if(isProfileComplete(user.uid)){
                  showAppArea();
                } else {
                  // ensure hero is visible so they can click Start
                  if(heroSection) heroSection.style.display = '';
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

  function showAppArea(){
    if(heroSection) heroSection.style.display = 'none';
    if(appArea) appArea.style.display = 'block';
    // scroll to app area
    appArea && appArea.scrollIntoView({behavior:'smooth'});
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

    // Define all possible slides
    const allSlides = [
      {id:'baglama', title:'Bağlama Eğitimi', img: encodeURI('assets/Bağlama_yatay.png'), desc:'Bağlama çalmayı öğrenin: akorlar, ritimler ve repertuar.'},
      {id:'ney', title:'Ney ve Üflemeli Çalgılar', img: encodeURI('assets/Ney_yatay.png'), desc:'Ney teknikleri ve nefes çalışmaları ile müzikal yolculuğunuzu başlatın.'},
      {id:'gorsel', title:'Görsel Sanatlar', img: encodeURI('assets/Görsel Sanatlar.png'), desc:'Görsel sanatlar: resim, kompozisyon ve farklı tekniklerle yaratıcılığınızı keşfedin.'},
      {id:'halk', title:'Halk Oyunları', img: encodeURI('assets/Halk Oyunları Yatay.png'), desc:'Yerel dans stilleri ve koreografilerle kültürel mirası yaşayın.'}
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
    sliderSlides.forEach((s, idx)=>{
      const slide = document.createElement('div'); slide.className='slide';
      slide.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="slide-caption"><h3>${s.title}</h3><p>${s.desc}</p></div>`;
      slidesEl.appendChild(slide);
      const dot = document.createElement('div'); dot.className='dot'; dot.dataset.idx = idx; dotsEl.appendChild(dot);
      dot.addEventListener('click', ()=>{ goToSlide(idx); resetAuto(); });
    });

  // Render picked cards (compact) BELOW the slider
  const cardsRow = document.getElementById('cardsRow');
    if(pickedSlides.length === 0){
      // No picks: show all slides in a different deterministic order (rotate by 1)
      const rotated = allSlides.slice(1).concat(allSlides.slice(0,1));
      rotated.forEach(s=>{
        const c = document.createElement('div'); c.className='mini-card';
        c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`;
        cardsRow.appendChild(c);
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
            if(s){ const c = document.createElement('div'); c.className='mini-card'; c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`; cardsRow.appendChild(c); }
          });
        } else {
          pickedSlides.forEach(s=>{
            const c = document.createElement('div'); c.className='mini-card';
            c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`;
            cardsRow.appendChild(c);
          });
        }
      }catch(e){
        pickedSlides.forEach(s=>{
          const c = document.createElement('div'); c.className='mini-card';
          c.innerHTML = `<img src="${s.img}" alt="${s.title}" loading="lazy" decoding="async"/><div class="m-title">${s.title}</div><div class="m-desc">${s.desc}</div>`;
          cardsRow.appendChild(c);
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
        });
      }
    }catch(e){console.warn('Could not populate allInterestsRow', e);} 

    let current = 0;
    const total = sliderSlides.length;
    const update = ()=>{
      slidesEl.style.transform = `translateX(-${current*100}%)`;
      Array.from(dotsEl.children).forEach((d,i)=> d.classList.toggle('active', i===current));
      // reset any parallax transforms
      Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
    };
    function goToSlide(i){ current = (i+total)%total; update(); }
    function next(){ current = (current+1)%total; update(); }

    // Auto-advance every 10s
    let auto = setInterval(next, 10000);
    function resetAuto(){ clearInterval(auto); auto = setInterval(next, 10000); }

    // Pause on hover
    const slider = document.getElementById('mainSlider');
    // Named handlers for cleanup
    const onMouseEnter = ()=> clearInterval(auto);
    const onMouseLeave = ()=> { resetAuto(); };
    slider.addEventListener('mouseenter', onMouseEnter);
    slider.addEventListener('mouseleave', onMouseLeave);

    // Improved drag/swipe support with live dragging, parallax, and 10% threshold
    let isDragging = false;
    let startX = 0;
    let prevTranslate = 0;
    function pxTranslate(x){ slidesEl.style.transform = `translateX(${x}px)`; }
    function slideWidth(){ return slider.clientWidth; }
    const thresholdRatio = 0.10; // 10%

    // Pointer handlers (named so they can be removed)
    const onPointerDown = (e)=>{
      isDragging = true;
      slider.classList.add('dragging');
      startX = e.clientX;
      prevTranslate = -current * slideWidth();
      slidesEl.style.transition = 'none';
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
      slider.classList.remove('dragging');
      slidesEl.style.transition = '';
      const dx = e.clientX - startX;
      const movedRatio = Math.abs(dx) / slideWidth();
      if(movedRatio >= thresholdRatio){
        if(dx < 0) goToSlide(current+1); else goToSlide(current-1);
      } else {
        goToSlide(current);
      }
      Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
      try{ slidesEl.releasePointerCapture(e.pointerId); }catch(_){/* ignore */}
      resetAuto();
    };
    const onPointerCancel = ()=>{
      if(!isDragging) return;
      isDragging = false;
      slider.classList.remove('dragging');
      slidesEl.style.transition = '';
      goToSlide(current);
      Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)');
      resetAuto();
    };

    slidesEl.addEventListener('pointerdown', onPointerDown);
    slidesEl.addEventListener('pointermove', onPointerMove);
    slidesEl.addEventListener('pointerup', onPointerUp);
    slidesEl.addEventListener('pointercancel', onPointerCancel);

    // Expose a cleanup function so signing out can stop intervals and remove listeners
    window.__ag_cleanup_slider = function(){
      try{ clearInterval(auto); }catch(_){/* ignore */}
      try{ slider.removeEventListener('mouseenter', onMouseEnter); slider.removeEventListener('mouseleave', onMouseLeave); }catch(_){ }
      try{ slidesEl.removeEventListener('pointerdown', onPointerDown); slidesEl.removeEventListener('pointermove', onPointerMove); slidesEl.removeEventListener('pointerup', onPointerUp); slidesEl.removeEventListener('pointercancel', onPointerCancel); }catch(_){ }
      try{ Array.from(slidesEl.querySelectorAll('img')).forEach(img=> img.style.transform = 'translateX(0px)'); }catch(_){ }
    };

    // initial state
    update();
  }

  function renderProfileForm(uid){
    if(!appArea) return;
    // interest options using local assets (use your assets/*.png files)
    const interests = [
      {id:'baglama', label:'Bağlama', img: encodeURI('assets/Bağlama_yatay.png')},
      {id:'ney', label:'Ney', img: encodeURI('assets/Ney_yatay.png')},
      {id:'gorsel', label:'Görsel Sanatlar', img: encodeURI('assets/Görsel Sanatlar.png')},
      {id:'halk', label:'Halk Oyunları', img: encodeURI('assets/Halk Oyunları Yatay.png')}
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
      renderMainForUser();
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
        <div class="user-bubble" id="userBubble">${initials}</div>
        <div class="menu-dropdown" id="menuDropdown">
          <div class="menu-item" id="manageAccount">Hesabı Yönet</div>
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
        try{ await auth.signOut(); }catch(e){ console.error(e); }
        c.remove();
      });
    });

    document.getElementById('manageAccount').addEventListener('click', ()=>{
      // For now open a simple modal showing email and a placeholder
      const m = document.createElement('div'); m.className='auth-modal';
      m.innerHTML = `
        <div class="auth-card">
          <button class="close">×</button>
          <h3>Hesap Bilgileri</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p>Profil yönetimi için daha fazla özellik eklenebilir.</p>
        </div>`;
      document.body.appendChild(m);
      m.querySelector('.close').addEventListener('click', ()=>m.remove());
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
        // profile complete -> send to app area
        showAppArea();
      }
    }catch(e){}
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
          // If this was a fresh signup, immediately send them to the app area (survey)
          if(mode === 'signup'){
            modal.remove(); showAppArea();
          } else {
            if(isProfileComplete(user.uid)){
              modal.remove(); showAppArea();
            } else {
              modal.remove();
              // show hero so user can click Start and fill initial info
              if(heroSection) heroSection.style.display = '';
              const openSign = document.getElementById('openSignin'); if(openSign) openSign.style.display = 'none';
            }
          }
        } else modal.remove();
      }catch(e){
        // Translate common Firebase errors to Turkish
        const code = e && e.code ? e.code : null;
        errEl.textContent = translateAuthError(code, e && e.message ? e.message : 'Giriş sırasında hata oluştu.');
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
          await auth.signInWithPopup(provider);
          modal.remove();
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
        showAppArea();
      } else {
        // Sometimes auth.currentUser is not immediately available right after createUserWithEmailAndPassword.
        // Retry briefly (up to ~2s) before falling back to opening the signup modal.
        let attempts = 0;
        const maxAttempts = 20; // ~2 seconds
        const tryShow = () => {
          attempts++;
          if(auth.currentUser){
            showAppArea();
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
