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

// Typed animation for welcome text with punctuation transform
(() => {
  const el = document.getElementById('typed');
  const base = 'Af-Groove\'a hoş geldiniz.'; // We'll transform punctuation
  const punctSets = [
    {name:'turkish', map: {'.':'.', "'":'’'}},
    {name:'french', map: {'.':':', "'":'’'}},
    {name:'german', map: {'.':',', "'":'’'}},
  ];

  let setIdx = 0;

  function mapPunct(text, map){
    return text.split('').map(ch => map[ch] || ch).join('');
  }

  function typeText(text, cb){
    let i=0; el.textContent='';
    const t = setInterval(()=>{
      el.textContent += text[i++]||'';
      if(i>text.length){ clearInterval(t); setTimeout(cb, 900); }
    }, 45);
  }

  function cycle(){
    const set = punctSets[setIdx%punctSets.length];
    const mapped = mapPunct(base, set.map);
    typeText(mapped, ()=>{
      // simple fade-out
      el.style.transition = 'opacity 600ms ease';
      el.style.opacity = '0';
      setTimeout(()=>{
        el.style.opacity = '1';
        setIdx++;
        cycle();
      }, 600);
    });
  }

  cycle();
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
