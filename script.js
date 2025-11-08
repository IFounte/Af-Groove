// Theme toggling
(function(){
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if(stored) document.documentElement.setAttribute('data-theme', stored);

  const btn = document.getElementById('themeToggle');
  if(btn){
    // initialize aria state
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    // reflect initial visual state on the button
    btn.classList.toggle('is-light', isLight);
    // toggle handler respects prefers-reduced-motion
    btn.addEventListener('click', ()=>{
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', current);
      localStorage.setItem('theme', current);
      btn.setAttribute('aria-pressed', current === 'light' ? 'true' : 'false');
      btn.classList.toggle('is-light', current === 'light');
      if(!reduce){
        // small tactile animation (scale) handled by CSS :active; briefly add a class to emphasize toggle
        btn.classList.add('toggled');
        setTimeout(()=>btn.classList.remove('toggled'), 240);
      }
    });
  }
})();

// Typed animation cycling through multiple languages
(() => {
  const el = document.getElementById('typed');
  if(!el) return;
  const phrases = [
    {lang:'tr', text: "Af-Groove'a hoş geldiniz."},
    {lang:'en', text: "Welcome to Af-Groove."},
    {lang:'de', text: "Willkommen bei Af-Groove."},
    {lang:'es', text: "Bienvenido a Af-Groove."},
    {lang:'fr', text: "Bienvenue chez Af-Groove."},
    {lang:'it', text: "Benvenuto ad Af-Groove."}
  ];

  let idx = 0;

  function setDirection(lang){
    if(lang === 'ar'){
      el.style.direction = 'rtl';
      el.style.textAlign = 'right';
    } else {
      el.style.direction = 'ltr';
      el.style.textAlign = 'left';
    }
  }

  async function typeAndDelete(phrase){
    return new Promise(resolve=>{
      setDirection(phrase.lang);
      const text = phrase.text;
      el.textContent = '';
      el.style.opacity = '1';
      let i = 0;
      const typer = setInterval(()=>{
        el.textContent += text[i++] || '';
        if(i > text.length){ clearInterval(typer);
          setTimeout(()=>{
            // delete
            let j = text.length;
            const deleter = setInterval(()=>{
              el.textContent = text.slice(0,j--);
              if(j < 0){ clearInterval(deleter); resolve(); }
            }, 35);
          }, 900);
        }
      }, 45);
    });
  }

  async function run(){
    while(true){
      const phrase = phrases[idx % phrases.length];
      await typeAndDelete(phrase);
      idx++;
      // small pause between phrases
      await new Promise(r=>setTimeout(r, 300));
    }
  }

  run();
})();

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Button small effects
document.querySelectorAll('.btn').forEach(b=>{
  b.addEventListener('mouseenter', ()=>{
    b.style.filter = 'saturate(1.08)';
  });
  b.addEventListener('mouseleave', ()=>{
    b.style.filter = '';
  });
});
