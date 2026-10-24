// Floating chalk math symbols, sticky nav, scroll reveal, and the PDF viewer.
document.documentElement.classList.add('js');

/* ---------- Chalk symbols in the hero ---------- */
(function chalk() {
  const canvas = document.getElementById('chalk');
  const ctx = canvas.getContext('2d');
  const symbols = ['π', '∑', '∫', '√x', 'Δ', 'x²', 'θ', '∞', 'f(x)', 'a²+b²=c²', 'y=mx+b', '÷', '≈', '%', '∠', '½', 'sin θ', 'n!'];
  const colors = ['238,241,232', '246,214,107', '243,155,176', '143,208,240', '166,227,161'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, items = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.offsetWidth; h = canvas.offsetHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(34, w / 38));
    items = Array.from({ length: count }, () => ({
      text: symbols[Math.floor(Math.random() * symbols.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * w,
      y: Math.random() * h,
      size: 18 + Math.random() * 38,
      alpha: 0.08 + Math.random() * 0.18,
      vy: -(0.1 + Math.random() * 0.35),
      vx: (Math.random() - 0.5) * 0.2,
      rot: (Math.random() - 0.5) * 0.6,
      vr: (Math.random() - 0.5) * 0.002,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const s of items) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.font = `700 ${s.size}px Caveat, "Segoe Print", cursive`;
      ctx.fillStyle = `rgba(${s.color},${s.alpha})`;
      ctx.fillText(s.text, 0, 0);
      ctx.restore();
      if (!reduce) {
        s.x += s.vx; s.y += s.vy; s.rot += s.vr;
        if (s.y < -60) { s.y = h + 40; s.x = Math.random() * w; }
      }
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', () => { resize(); if (reduce) draw(); });
  document.fonts && document.fonts.ready.then(() => reduce && draw());
})();

/* ---------- Nav background on scroll ---------- */
const topbar = document.querySelector('.topbar');
const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Scroll reveal ---------- */
const revealTargets = document.querySelectorAll('.title, .intro-text, .intro-side, .polaroid, .chapter, .slate, .principle, .table-wrap, .steps li, .lessons, .map-keys li, .rep-chain, .phases, .quote-card, .fs-conclusion, .reflection-inner > *');
revealTargets.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
revealTargets.forEach(el => io.observe(el));

/* ---------- PDF viewer ---------- */
const viewer = document.getElementById('viewer');
const frame = document.getElementById('viewer-frame');
const vTitle = document.getElementById('viewer-title');
const vOpen = document.getElementById('viewer-open');

function openViewer(src, title) {
  frame.src = src;
  vTitle.textContent = title;
  vOpen.href = src;
  viewer.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('viewer-close').focus();
}
function closeViewer() {
  viewer.hidden = true;
  frame.src = 'about:blank';
  document.body.style.overflow = '';
}

document.querySelectorAll('.preview').forEach(btn =>
  btn.addEventListener('click', () => openViewer(btn.dataset.src, btn.dataset.title)));

document.querySelectorAll('a[data-view]').forEach(a =>
  a.addEventListener('click', e => {
    e.preventDefault();
    openViewer(a.getAttribute('href'), a.querySelector('span').firstChild.textContent.trim());
  }));

document.querySelectorAll('a[data-view-btn]').forEach(a =>
  a.addEventListener('click', e => {
    e.preventDefault();
    openViewer(a.getAttribute('href'), 'Reflection');
  }));

document.getElementById('viewer-close').addEventListener('click', closeViewer);
viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !viewer.hidden) closeViewer(); });
