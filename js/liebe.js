/* liebe.js – „Handgemacht“-Schicht für die Demo-Websites (Runde 7).
   Konfiguration: <script type="application/json" id="liebe-cfg">{…}</script>
   Bausteine: Unterstreichungen (Kritzel), Randnotizen mit Pfeil, Bildrahmen-Details, Klick-Funken,
   kleine Überraschung (Easter Egg), liebevolle Fußzeile + „nach oben“, Hover-Momente.
   Alles ist Deko (aria-hidden) oder echte Bedienelemente mit Label; respektiert prefers-reduced-motion. */
(function () {
  var d = document, root = d.documentElement, el = d.getElementById('liebe-cfg');
  var C = {}; try { C = el ? JSON.parse(el.textContent) : {}; } catch (e) { C = {}; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function $$(s, r) { try { return [].slice.call((r || d).querySelectorAll(s)); } catch (e) { return []; } }
  function h(tag, cls, html) { var x = d.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function anchor(x) { if (getComputedStyle(x).position === 'static') x.classList.add('lv-anchor'); }
  root.classList.add('lv'); if (reduce) root.classList.add('lv-reduce');
  if (C.texture) root.classList.add('lv-tex-' + C.texture);

  /* ---------- Formen ---------- */
  var SH = {
    heart: '<path d="M12 20.5C5 15.6 2.6 11.4 4.4 8 6.1 4.9 10 5 12 8.3 14 5 17.9 4.9 19.6 8c1.8 3.4-.6 7.6-7.6 12.5z"/>',
    star: '<path d="M12 3.2l2.3 5.6 6 .5-4.6 3.9 1.5 5.9L12 15.9l-5.2 3.2 1.5-5.9L3.7 9.3l6-.5z"/>',
    sparkle: '<path d="M12 2.5c.6 4.9 2.2 7.6 7.5 9.5-5.3 1.9-6.9 4.6-7.5 9.5-.6-4.9-2.2-7.6-7.5-9.5 5.3-1.9 6.9-4.6 7.5-9.5z"/>',
    leaf: '<path d="M4.5 19.5C4 10.8 9.6 4.9 20 4.2c-.4 10.1-6.3 15.6-15.5 15.3z"/><path class="o" d="M5 19L15 9"/>',
    shaving: '<path class="o" d="M3.5 15c0-6 8.5-8.4 11.6-4.2 2.3 3.1-1.3 6.5-3.7 3.9-1.6-1.7.6-3.6 2.1-2.4"/>',
    flower: '<circle cx="12" cy="6.5" r="3.3"/><circle cx="17.3" cy="10.4" r="3.3"/><circle cx="15.3" cy="16.6" r="3.3"/><circle cx="8.7" cy="16.6" r="3.3"/><circle cx="6.7" cy="10.4" r="3.3"/><circle class="c" cx="12" cy="12" r="2.4"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path class="o" d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    snow: '<path class="o" d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
    drop: '<path d="M12 2.8C9 8 6.2 11.2 6.2 14.9a5.8 5.8 0 0 0 11.6 0C17.8 11.2 15 8 12 2.8z"/>',
    bolt: '<path d="M13.5 2.5 5.5 13.6h5.4L9.8 21.5l8.7-11.7h-5.6z"/>',
    cherry: '<circle cx="8" cy="16.5" r="4"/><circle cx="16.5" cy="15" r="4"/><path class="o" d="M8 12.5C9 7.5 12 4.5 17 3.5M16.5 11c-.5-3.5-.5-5.5.5-7.5"/>',
    sprinkle: '<rect x="9.5" y="3" width="5" height="18" rx="2.5" transform="rotate(35 12 12)"/>'
  };
  function shape(name, cls) { return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (SH[name] || SH.heart) + '</svg>'; }
  var ARROW = '<svg class="lv-arrow" viewBox="0 0 64 44" aria-hidden="true" focusable="false"><path pathLength="1" d="M58 5C44 3 26 9 12 32"/><path pathLength="1" class="lv-ah" d="M9.5 19.5 11.8 33l12.3-5.2"/></svg>';
  var UL = {
    wave: 'M3 10C40 3 70 15 110 8s80-5 127 1',
    scribble: 'M4 9c56-6 140-5 232-1M16 13.5c70-4 140-3 210-.5',
    brush: 'M5 10C70 4 160 5 235 7.5',
    measure: 'M6 8h228M6 2v12M234 2v12M6 8l9-4.5M6 8l9 4.5M234 8l-9-4.5M234 8l-9 4.5',
    chalk: 'M4 8c40-2 90 3 132 0s70-2 100 1M10 12.5c55-3 120 2 216-1',
    loop: 'M4 10c40-6 70 6 100 0 14-3 12-9 4-8s-6 9 6 10c40 3 80-6 122-3'
  };

  /* ---------- 1 · Kritzel-Unterstreichung unter Überschriften ---------- */
  var io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('lv-in'); io.unobserve(x.target); } });
  }, { threshold: .25, rootMargin: '0px 0px -8% 0px' }) : null;
  function watch(x) { if (io) io.observe(x); else x.classList.add('lv-in'); }
  (C.underline ? [].concat(C.underline) : []).forEach(function (u) {
    $$(u.sel).forEach(function (hd, i) {
      if (hd.querySelector('.lv-ul')) return;
      var s = d.createElement('span'); s.className = 'lv-ul lv-ul-' + (u.style || 'wave'); s.setAttribute('aria-hidden', 'true');
      var path = UL[u.style] || UL.wave;
      s.innerHTML = '<svg viewBox="0 0 240 16" preserveAspectRatio="none" focusable="false"><path pathLength="1" d="' + path + '"/></svg>';
      if (u.color) s.style.setProperty('--lv-ul', u.color);
      if (getComputedStyle(hd).textAlign === 'center') s.classList.add('lv-ul-c');
      if (i % 2) s.classList.add('lv-ul-alt');
      hd.appendChild(s); watch(hd);
    });
  });

  /* ---------- 2 · Randnotizen mit Pfeil ---------- */
  (C.notes || []).forEach(function (n) {
    var t = d.querySelector(n.at); if (!t || t.querySelector(':scope > .lv-note')) return;
    anchor(t);
    var s = h('span', 'lv-note lv-arrow-' + (n.arrow || 'none') + (n.m === 'inline' ? ' lv-note-m' : ' lv-note-dk') + (n.cls ? ' ' + n.cls : ''));
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = (n.arrow && n.arrowAfter ? '' : (n.arrow ? ARROW : '')) + '<span class="lv-note-t">' + n.text + '</span>' + (n.arrow && n.arrowAfter ? ARROW : '');
    var css = n.css || {}; for (var k in css) s.style[k] = css[k];
    s.style.setProperty('--lv-rot', (n.rot || -3) + 'deg');
    t.appendChild(s); watch(s);
  });

  /* ---------- 3 · Bildrahmen-Details (Fotoecken, Klebeband, Reißnagel) ---------- */
  (C.frames || []).forEach(function (f) {
    $$(f.sel).forEach(function (fig, i) {
      if (fig.classList.contains('lv-fr')) return;
      anchor(fig); fig.classList.add('lv-fr', 'lv-fr-' + f.kind);
      var deco = '';
      if (f.kind === 'corners') deco = '<i class="lv-c lv-c1"></i><i class="lv-c lv-c2"></i><i class="lv-c lv-c3"></i><i class="lv-c lv-c4"></i>';
      if (f.kind === 'tape') deco = '<i class="lv-tape' + (i % 2 ? ' lv-tape-r' : '') + '"></i>';
      if (f.kind === 'pin') deco = '<i class="lv-pin"></i>';
      if (f.kind === 'clip') deco = '<i class="lv-clip"></i>';
      if (deco) { var w = h('span', 'lv-deco', deco); w.setAttribute('aria-hidden', 'true'); fig.appendChild(w); }
      if (f.tilt) fig.style.setProperty('--lv-tilt', ((i % 3) - 1) * f.tilt + 'deg');
    });
  });

  /* ---------- 4 · Hover-/Klick-Momente ---------- */
  if (C.lift) $$(C.lift).forEach(function (x) { x.classList.add('lv-lift'); });
  if (C.squish) $$(C.squish).forEach(function (x) { x.classList.add('lv-squish'); });
  if (C.burst && !reduce && d.body.animate) {
    var B = C.burst;
    d.addEventListener('pointerdown', function (e) {
      var t = e.target.closest && e.target.closest(B.sel); if (!t) return;
      var n = B.n || 7, box = h('span', 'lv-burst'); box.setAttribute('aria-hidden', 'true');
      box.style.left = e.clientX + 'px'; box.style.top = e.clientY + 'px'; d.body.appendChild(box);
      for (var i = 0; i < n; i++) {
        var p = h('span', 'lv-bp', shape(B.shapes ? B.shapes[i % B.shapes.length] : (B.shape || 'heart')));
        p.style.color = (B.colors || ['currentColor'])[i % (B.colors || [1]).length];
        box.appendChild(p);
        var a = (-90 + (i - (n - 1) / 2) * (150 / n)) * Math.PI / 180 + (Math.random() - .5) * .35, r = 38 + Math.random() * 34, sc = .55 + Math.random() * .6;
        p.animate([{ transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'translate(calc(-50% + ' + Math.cos(a) * r + 'px), calc(-50% + ' + Math.sin(a) * r + 'px)) scale(' + sc + ') rotate(' + (Math.random() * 90 - 45) + 'deg)', opacity: 1, offset: .65 },
          { transform: 'translate(calc(-50% + ' + Math.cos(a) * r * 1.15 + 'px), calc(-50% + ' + (Math.sin(a) * r + 26) + 'px)) scale(' + sc * .8 + ')', opacity: 0 }],
          { duration: 820 + Math.random() * 260, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      }
      setTimeout(function () { box.remove(); }, 1200);
    }, { passive: true });
  }

  /* ---------- 5 · Kleine Überraschung ---------- */
  var E = C.egg;
  if (E) {
    var host = d.querySelector(E.at);
    if (host) {
      anchor(host);
      var wrap = h('span', 'lv-egg lv-egg-' + E.type);
      var btn = h('button', 'lv-egg-btn', E.svg || '');
      btn.type = 'button'; btn.setAttribute('aria-label', E.label || 'Kleine Überraschung'); btn.setAttribute('aria-expanded', 'false');
      if (E.hint) btn.title = E.hint;
      var msg = h('span', 'lv-egg-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
      wrap.appendChild(btn); wrap.appendChild(msg); host.appendChild(wrap);
      var css2 = E.css || {}; for (var k2 in css2) wrap.style[k2] = css2[k2];
      var on = false, timer;
      btn.addEventListener('click', function () {
        on = !on; wrap.classList.toggle('lv-egg-on', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        msg.innerHTML = on ? E.msg : '';
        if (on && E.type === 'rings' && E.from && E.to) {
          var num = h('b', 'lv-count', String(E.from)); msg.innerHTML = ''; msg.appendChild(num); msg.insertAdjacentHTML('beforeend', E.msg);
          var t0 = performance.now(), dur = reduce ? 0 : 1600;
          (function step(t) { var k = dur ? Math.min(1, (t - t0) / dur) : 1; k = 1 - Math.pow(1 - k, 3);
            num.textContent = Math.round(E.from + (E.to - E.from) * k); if (k < 1) requestAnimationFrame(step); })(t0);
        }
        if (on && E.type === 'shooting' && !reduce) {
          var st = h('span', 'lv-shoot'); st.setAttribute('aria-hidden', 'true'); host.appendChild(st);
          setTimeout(function () { st.remove(); }, 1600);
        }
        clearTimeout(timer); var ac = (E.autocloseM && window.matchMedia && matchMedia('(max-width:899px)').matches) ? E.autocloseM : E.autoclose; if (on && ac) timer = setTimeout(function () { if (on) btn.click(); }, ac);
      });
      if (E.type === 'level') {
        var bub = btn.querySelector('.lv-bubble');
        if (bub && fine && !reduce) d.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
          var dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 400));
          bub.style.transform = 'translateX(' + (dx * 16).toFixed(1) + 'px)';
          wrap.classList.toggle('lv-level-ok', Math.abs(dx) < .08);
        }, { passive: true });
      }
    }
  }

  /* ---------- 6 · Liebevolle Fußzeile + „nach oben“ ---------- */
  var F = C.foot;
  if (F) {
    var fh = d.querySelector(F.at);
    if (fh && !fh.querySelector('.lv-foot')) {
      var p = h('div', 'lv-foot');
      p.innerHTML = '<p class="lv-foot-t">' + shape(F.shape || 'heart', 'lv-foot-i') + '<span>' + F.text + '</span></p>' +
        '<button type="button" class="lv-top"><svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M8 32C10 18 18 10 30 8"/><path d="M21 6.5 30 8l-3.2 8.4"/></svg><span>' + (F.top || 'Nach oben') + '</span></button>';
      var aft = F.after && fh.querySelector(F.after);
      if (aft) aft.parentNode.insertBefore(p, aft.nextSibling); else if (F.before) fh.insertBefore(p, fh.firstChild); else fh.appendChild(p);
      // Mobil: solange der Abschied sichtbar ist, wird das Chat-FAB kompakt (nur Icon), damit „nach oben" frei klickbar bleibt
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
        root.classList.toggle('lv-foot-in', es[0].isIntersecting);
      }, { rootMargin: '0px 0px 40px 0px' }).observe(p);
      p.querySelector('.lv-top').addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        var first = d.querySelector('header a, a'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 700);
      });
    }
  }
})();
