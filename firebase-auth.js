// Minimal Firebase Auth integration using compat SDKs already included in index.html
// Exposes UI behaviors for sign up / sign in / sign out using email/password.

(function(){
  // We'll attempt to initialize Firebase when the user tries to authenticate so
  // that late-loaded scripts or slight ordering issues won't prevent auth from working.
  let auth = null;
  let firebaseInitialized = false;

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
          if(user) renderSignedIn(user);
          else renderSignedOut();
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

  function renderSignedOut(){
    // Keep userArea minimal when signed-out; use header buttons for auth actions.
    userArea.innerHTML = '';
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

    const bubble = document.getElementById('userBubble');
    const dropdown = document.getElementById('menuDropdown');
    bubble.addEventListener('click', (ev)=>{
      ev.stopPropagation(); dropdown.classList.toggle('show');
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
  }

  // Basic modal UI (DOM creation)
  function openAuthModal(mode='signin'){
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-card">
        <button class="close">×</button>
        <h3>${mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}</h3>
        <button id="googleModalBtn" class="btn google">Google ile</button>
        <input id="authEmail" type="email" placeholder="E-posta" />
        <input id="authPass" type="password" placeholder="Parola" />
        <button id="authSubmit" class="btn primary">${mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}</button>
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
      if(!firebaseAvailable){
        errEl.textContent = 'Firebase yapılandırması eksik. Lütfen proje kökünde firebase-config.js oluşturun.';
        return;
      }
      try{
        if(mode === 'signup'){
          await auth.createUserWithEmailAndPassword(email, pass);
        } else {
          await auth.signInWithEmailAndPassword(email, pass);
        }
        modal.remove();
      }catch(e){
        errEl.textContent = e.message;
      }
    });

    modal.querySelector('#toSignup')?.addEventListener('click',(ev)=>{ev.preventDefault(); modal.remove(); openAuthModal('signup');});
    modal.querySelector('#toSignin')?.addEventListener('click',(ev)=>{ev.preventDefault(); modal.remove(); openAuthModal('signin');});

    // Google sign-in inside modal
    modal.querySelector('#googleModalBtn')?.addEventListener('click', async ()=>{
      const r = ensureAuthInitialized();
      if(!r.ok){ openSetupModal(r); return; }
      try{
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        modal.remove();
      }catch(e){
        modal.querySelector('.auth-error').textContent = e.message;
      }
    });
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
    if(r.ok) openAuthModal('signup'); else openSetupModal(r);
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

  // Header Google button
  const headerGoogleBtn = document.getElementById('headerGoogleBtn');
  headerGoogleBtn && headerGoogleBtn.addEventListener('click', async ()=>{
    const r = ensureAuthInitialized();
    if(!r.ok){ openSetupModal(r); return; }
    try{
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    }catch(e){ console.error(e); alert('Google ile giriş başarısız: '+e.message); }
  });

  // Auth state observer (only if auth available)
  // If Firebase is already present + config available, initialize right away.
  const early = ensureAuthInitialized();
  if(!early.ok){
    // show signed-out UI UI for now
    renderSignedOut();
  }

})();
