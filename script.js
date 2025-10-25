// Theme toggling
(function(){
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if(stored) document.documentElement.setAttribute('data-theme', stored);

  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', ()=>{
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', current);
    localStorage.setItem('theme', current);
  });
})();

// Typed animation cycling through multiple languages
(() => {
  const el = document.getElementById('typed');
  const phrases = [
    {lang:'tr', text: "Af-Groove'a hoş geldiniz."},
    {lang:'en', text: "Welcome to Af-Groove."},
    {lang:'de', text: "Willkommen bei Af-Groove."},
    {lang:'es', text: "Bienvenido a Af-Groove."},
    {lang:'fr', text: "Bienvenue chez Af-Groove."},
    {lang:'ar', text: "مرحبا بكم في Af-Groove."}
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

// Global interests data (shared by slider and interest selection)
// If already defined, keep existing to allow overrides
window.APP_INTERESTS = window.APP_INTERESTS || [
  {
    id: 'baglama',
    label: 'Bağlama',
    desc: 'Türk halk müziğinin kalbi: tezene, düzen ve usûllerle temel ve ileri teknikler.',
    img: 'https://source.unsplash.com/1200x800/?saz,baglama,anatolian,music&sig=1'
  },
  {
    id: 'ney',
    label: 'Ney',
    desc: 'Tasavvuf müziğinin nefesi: doğru dudak ve başparmak tekniğiyle makam yolculuğu.',
    img: 'https://source.unsplash.com/1200x800/?ney,reed,flute,sufi&sig=2'
  },
  {
    id: 'resim',
    label: 'Resim',
    desc: 'Renk, ışık ve kompozisyonla ifade: karakalemden tuvale uzanan yaratıcı süreç.',
    img: 'https://source.unsplash.com/1200x800/?painting,art,canvas,studio&sig=3'
  },
  {
    id: 'halk',
    label: 'Halk Oyunları',
    desc: 'Anadolu’nun ritimleri: adım, duruş ve figürlerle bölgesel oyunların temelleri.',
    img: 'https://source.unsplash.com/1200x800/?folk,dance,traditional,turkey&sig=4'
  },
  {
    id: 'gitar',
    label: 'Gitar',
    desc: 'Akorlar, ritimler ve melodilerle eşlikten solo tekniğe bilinçli gelişim.',
    img: 'https://source.unsplash.com/1200x800/?guitar,strings,acoustic&sig=5'
  },
  {
    id: 'piyano',
    label: 'Piyano',
    desc: 'Temel nota okuma, eşlik ve armoniyle parçalara müzikal yaklaşım.',
    img: 'https://source.unsplash.com/1200x800/?piano,keys,studio&sig=6'
  }
];

// Homepage slider below navbar
(() => {
  const slidesWrap = document.getElementById('sliderSlides');
  const dotsWrap = document.getElementById('sliderDots');
  if(!slidesWrap || !dotsWrap) return;

  const interests = window.APP_INTERESTS;
  // Build slides
  interests.forEach((it, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (idx === 0 ? ' active' : '');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${idx+1} / ${interests.length}`);
    slide.innerHTML = `
      <img src="${it.img}" alt="${it.label} görseli" loading="lazy"/>
      <div class="caption">
        <div class="title">${it.label}</div>
        <p class="desc">${it.desc || ''}</p>
      </div>
    `;
    slidesWrap.appendChild(slide);

    const dot = document.createElement('button');
    dot.className = idx === 0 ? 'active' : '';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `${it.label} slaytına git`);
    dot.addEventListener('click', () => goTo(idx));
    dotsWrap.appendChild(dot);
  });

  const slides = Array.from(slidesWrap.querySelectorAll('.slide'));
  const dots = Array.from(dotsWrap.querySelectorAll('button'));
  let current = 0;
  let timer = null;

  function goTo(next){
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (next + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function start(){
    stop();
    timer = setInterval(()=> goTo(current+1), 5000);
  }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }

  // Pause on hover
  const container = document.querySelector('.slider-inner');
  container?.addEventListener('mouseenter', stop);
  container?.addEventListener('mouseleave', start);

  start();
})();
