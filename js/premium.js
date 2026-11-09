/* premium.js – gemeinsame Premium-Schicht: kurzes, überspringbares Intro + Kapitel-Anzeige + Scroll-Fortschritt.
   Respektiert prefers-reduced-motion; ohne JS bleibt alles sichtbar (Intro ist nur mit html.intro-on aktiv). */
(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ---------- Intro ----------
  var intro = d.querySelector('[data-intro]');
  function endIntro() {
    if (!intro || intro.dataset.done) return;
    intro.dataset.done = '1';
    root.classList.add('intro-out');
    try { sessionStorage.setItem('demo-intro', '1'); } catch (e) {}
    setTimeout(function () { root.classList.remove('intro-on', 'intro-out'); if (intro.parentNode) intro.parentNode.removeChild(intro); }, reduce ? 0 : 700);
    d.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); endIntro(); } }
  if (intro) {
    if (!root.classList.contains('intro-on')) { intro.parentNode.removeChild(intro); intro = null; }
    else {
      var ms = parseInt(intro.getAttribute('data-intro') || '1500', 10);
      intro.addEventListener('click', endIntro);
      d.addEventListener('keydown', onKey);
      window.addEventListener('wheel', endIntro, { passive: true, once: true });
      window.addEventListener('touchmove', endIntro, { passive: true, once: true });
      setTimeout(endIntro, ms);
      var skip = intro.querySelector('.intro-skip'); if (skip) skip.focus({ preventScroll: true });
    }
  }
  // ---------- Kapitel-Anzeige ----------
  var ind = d.querySelector('[data-chapter-ind]');
  var secs = [].slice.call(d.querySelectorAll('[data-chapter]'));
  if (ind && secs.length && 'IntersectionObserver' in window) {
    var lab = ind.querySelector('[data-ch-label]'), no = ind.querySelector('[data-ch-no]');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var s = e.target, i = secs.indexOf(s);
        if (lab) lab.textContent = s.getAttribute('data-chapter');
        if (no) no.textContent = s.getAttribute('data-ch-no') || String(i + 1);
        ind.setAttribute('data-i', i);
        ind.classList.add('show');
        root.style.setProperty('--ch', i / Math.max(1, secs.length - 1));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { io.observe(s); });
    var hero = d.querySelector('[data-hero]');
    if (hero) new IntersectionObserver(function (es) { ind.classList.toggle('over-hero', es[0].isIntersecting); }, { threshold: .35 }).observe(hero);
    var foot = d.querySelector('footer');
    if (foot) new IntersectionObserver(function (es) { ind.classList.toggle('over-foot', es[0].isIntersecting); }, { threshold: 0 }).observe(foot);
  }
  // ---------- Scroll-Fortschritt (CSS-Variable --sp 0..1) ----------
  var tick = false;
  function sp() { tick = false; var h = root.scrollHeight - innerHeight; root.style.setProperty('--sp', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0); }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(sp); } }, { passive: true });
  sp();
})();
