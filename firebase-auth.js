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
    appArea.innerHTML = `<h2>Af-Groove Ana Sayfa</h2><p>Buraya eğitim içerikleri gelecek.</p>`;
  }

  function renderProfileForm(uid){
    if(!appArea) return;
    appArea.innerHTML = `
      <div class="profile-form">
        <h2>Başlangıç Bilgileri</h2>
        <label>İlgi Alanların (virgülle ayır):</label>
        <input id="pf_interests" type="text" placeholder="Ör: kodlama, müzik, sanat" />
        <label>Yaşın:</label>
        <input id="pf_age" type="number" min="8" max="120" />
        <div class="profile-actions">
          <button id="pfSkip" class="btn secondary">Atla</button>
          <button id="pfSave" class="btn primary">Kaydet ve İlerle</button>
        </div>
      </div>
    `;
    document.getElementById('pfSave').addEventListener('click', ()=>{
      const interests = document.getElementById('pf_interests').value.trim();
      const age = document.getElementById('pf_age').value.trim();
      const payload = {interests, age};
      try{ localStorage.setItem(`ag_profile_${uid}`, JSON.stringify(payload)); setProfileComplete(uid, true); }catch(e){}
      renderMainForUser();
    });
    document.getElementById('pfSkip').addEventListener('click', ()=>{
      // still mark as complete to avoid repeat prompts
      setProfileComplete(uid, true); renderMainForUser();
    });
  }

  function hideAppArea(){
    if(appArea) appArea.style.display = 'none';
    if(heroSection) heroSection.style.display = '';
  }

  function renderSignedOut(){
    // Keep userArea minimal when signed-out; use header buttons for auth actions.
    userArea.innerHTML = '';
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
        if(mode === 'signup'){
          await auth.createUserWithEmailAndPassword(email, pass);
        } else {
          await auth.signInWithEmailAndPassword(email, pass);
        }
        // after successful auth, route based on profile completion
        const user = auth.currentUser;
        if(user){
          if(isProfileComplete(user.uid)){
            modal.remove(); showAppArea();
          } else {
            modal.remove();
            // show hero so user can click Start and fill initial info
            if(heroSection) heroSection.style.display = '';
            const openSign = document.getElementById('openSignin'); if(openSign) openSign.style.display = 'none';
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
