/* fx.js – kleine, abhängigkeitsfreie Effekte für die Demo-Websites.
   Alles respektiert prefers-reduced-motion; ohne JS bleibt der Inhalt sichtbar. */
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('fx');
  if (reduce) document.documentElement.classList.add('fx-reduce');

  /* 1 · Überschriften Zeile für Zeile: <h2 data-split> */
  const splitWords = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el);
    const words = $$('.wi', el);
    let top = null, line = -1;
    const tops = words.map(w => Math.round(w.parentNode.offsetTop)); /* erst alles lesen, dann schreiben: nur ein Layout */
    words.forEach((w, k) => { if (tops[k] !== top) { top = tops[k]; line++; } w.style.setProperty('--ln', line); });
  };
  const splits = $$('[data-split]');
  if (!reduce) {
    const doSplit = () => splits.forEach(el => { if (!el.dataset.done) { splitWords(el); el.dataset.done = 1; } });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(doSplit);
  }

  /* 2 · Einblenden, Bild-Enthüllung, Zeilen: Klasse .in setzen */
  const targets = $$('[data-reveal],[data-clip],[data-split],[data-draw],[data-stamp]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(x => {
      if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
    }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(t => io.observe(t));
  } else targets.forEach(t => t.classList.add('in'));

  /* 3 · Parallaxe: <div data-parallax=".12"><img></div> */
  const par = $$('[data-parallax]');
  /* 4 · Scroll-Fortschritt für gezeichnete Pfade: <svg data-scrolldraw><path pathLength="1"> */
  const draws = $$('[data-scrolldraw]');
  if (!reduce && (par.length || draws.length)) {
    let ticking = false;
    const vis = new Set();
    const io2 = new IntersectionObserver(es => es.forEach(x => x.isIntersecting ? vis.add(x.target) : vis.delete(x.target)), { rootMargin: '20% 0px' });
    [...par, ...draws].forEach(p => io2.observe(p));
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      vis.forEach(el => {
        const r = el.getBoundingClientRect();
        if (el.hasAttribute('data-parallax')) {
          const k = parseFloat(el.dataset.parallax) || .1;
          const c = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.setProperty('--py', (c * k * -100).toFixed(2) + 'px');
        } else {
          const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .3)));
          el.style.setProperty('--draw', p.toFixed(3));
        }
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }); requestAnimationFrame(update);
  }

  /* 5 · Magnetische Buttons (nur Maus) */
  if (fine && !reduce) $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* 6 · Bildvorschau beim Überfahren: Container [data-preview-zone], Zeilen [data-preview="bild.webp"] */
  if (fine) $$('[data-preview-zone]').forEach(zone => {
    const fig = document.createElement('figure'); fig.className = 'hover-preview'; fig.setAttribute('aria-hidden', 'true');
    fig.innerHTML = '<img alt=""><figcaption></figcaption>'; document.body.appendChild(fig);
    const img = fig.firstChild, cap = fig.lastChild;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => { x += (tx - x) * .18; y += (ty - y) * .18; fig.style.transform = `translate(${x}px, ${y}px) rotate(${(tx - x) * .02}deg)`; raf = requestAnimationFrame(loop); };
    $$('[data-preview]', zone).forEach(row => {
      row.addEventListener('pointerenter', () => { img.src = row.dataset.preview; cap.textContent = row.dataset.previewCap || ''; fig.classList.add('on'); if (!raf && !reduce) raf = requestAnimationFrame(loop); });
      row.addEventListener('pointerleave', () => fig.classList.remove('on'));
    });
    zone.addEventListener('pointermove', e => { tx = e.clientX + 24; ty = e.clientY - 120; if (reduce) fig.style.transform = `translate(${tx}px, ${ty}px)`; });
    zone.addEventListener('pointerleave', () => { fig.classList.remove('on'); cancelAnimationFrame(raf); raf = 0; });
  });

  /* 7 · Eigener Cursor (nur wo <body data-cursor>) */
  if (fine && document.body.hasAttribute('data-cursor')) {
    const c = document.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<span></span>';
    document.body.appendChild(c); document.documentElement.classList.add('has-cursor');
    let x = -100, y = -100, cx = -100, cy = -100;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    const tick = () => { cx += (x - cx) * (reduce ? 1 : .2); cy += (y - cy) * (reduce ? 1 : .2); c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(tick); };
    tick();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor-label],a,button,input,select,textarea,label');
      c.classList.toggle('big', !!(t && t.dataset.cursorLabel));
      c.classList.toggle('link', !!t && !t.dataset.cursorLabel);
      c.firstChild.textContent = t && t.dataset.cursorLabel ? t.dataset.cursorLabel : '';
    });
  }

  /* 8 · Partikel: <canvas data-particles="snow|steam"> */
  $$('canvas[data-particles]').forEach(cv => {
    if (reduce) return;
    const ctx = cv.getContext('2d'), kind = cv.dataset.particles;
    let w, h, ps = [], run = false, raf;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const make = () => kind === 'snow'
      ? { x: Math.random() * w, y: Math.random() * -h, r: .8 + Math.random() * 2.4, vy: .35 + Math.random() * .8, ph: Math.random() * 6.3 }
      : { x: w * (.3 + Math.random() * .4), y: h + Math.random() * 30, r: 10 + Math.random() * 22, vy: .25 + Math.random() * .35, ph: Math.random() * 6.3, life: 0 };
    const n = () => kind === 'snow' ? Math.round(Math.min(120, w / 9)) : 22;
    const frame = t => {
      ctx.clearRect(0, 0, w, h);
      ps.forEach((p, i) => {
        p.y += kind === 'snow' ? p.vy : -p.vy; p.ph += .012;
        const dx = Math.sin(p.ph) * (kind === 'snow' ? .5 : .35); p.x += dx;
        if (kind === 'snow') {
          ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
          if (p.y > h + 5) ps[i] = Object.assign(make(), { y: -5 });
        } else {
          p.life += .004; const a = Math.max(0, Math.sin(Math.min(1, p.life) * Math.PI)) * .16;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (1 + p.life));
          g.addColorStop(0, `rgba(255,250,240,${a})`); g.addColorStop(1, 'rgba(255,250,240,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.life), 0, 6.3); ctx.fill();
          if (p.life >= 1) ps[i] = make();
        }
      });
      if (run) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (run) return; size(); if (!ps.length) ps = Array.from({ length: n() }, make); run = true; raf = requestAnimationFrame(frame); };
    const stop = () => { run = false; cancelAnimationFrame(raf); };
    cv.fxStart = start; cv.fxStop = stop;
    new IntersectionObserver(es => es.forEach(x => (x.isIntersecting && !cv.hasAttribute('data-off')) ? start() : stop())).observe(cv);
    addEventListener('resize', () => { if (run) size(); });
  });

  /* 9 · Sticky-Erzählung: [data-story] mit [data-step] Texten und [data-scene] Bildern */
  $$('[data-story]').forEach(st => {
    const steps = $$('[data-step]', st), scenes = $$('[data-scene]', st);
    const set = k => { steps.forEach((s, i) => s.classList.toggle('active', i === k)); scenes.forEach((s, i) => s.classList.toggle('active', i === k)); };
    set(0);
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) set(steps.indexOf(x.target)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  });
})();
