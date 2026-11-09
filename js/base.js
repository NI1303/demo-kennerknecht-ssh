/* Basis-Skript der Demo-Websites: Navigation, Öffnungsstatus, Karte nach Zustimmung, Demo-Formulare, Bildbetrachter, Einblenden */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Mobile Navigation
  const toggle = $('.nav-toggle'), list = $('#nav-list');
  if (toggle && list) {
    toggle.addEventListener('click', () => { const o = list.classList.toggle('open'); toggle.setAttribute('aria-expanded', o); });
    $$('a', list).forEach(a => a.addEventListener('click', () => { list.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }));
  }

  // Öffnungsstatus: <p data-hours='{"2":[9,18],...}'> (1 = Mo … 6 = Sa, 0 = So), Zeitzone Europe/Berlin
  $$('[data-hours]').forEach(el => {
    try {
      const days = JSON.parse(el.dataset.hours);
      const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).forEach(x => p[x.type] = x.value);
      const d = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday], h = (+p.hour % 24) + (+p.minute) / 60;
      const fmt = v => { const hh = Math.floor(v), mm = Math.round((v - hh) * 60); return hh + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' Uhr'; };
      const s = days[String(d)];
      if (s && h >= s[0] && h < s[1]) el.textContent = '● Jetzt geöffnet – bis ' + fmt(s[1]);
      else if (s && h < s[0]) { el.textContent = '● Heute ab ' + fmt(s[0]) + ' geöffnet'; el.classList.add('closed'); }
      else { el.textContent = '● Gerade geschlossen'; el.classList.add('closed'); }
    } catch (e) {}
  });

  // Karte erst nach Klick laden (Datenschutz)
  $$('[data-map-load]').forEach(b => b.addEventListener('click', () => {
    const box = document.getElementById(b.dataset.mapLoad);
    const [lat, lon] = box.dataset.coords.split(',').map(Number), d = .004;
    box.innerHTML = '<iframe title="' + box.dataset.title + '" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=' +
      (lon - d) + '%2C' + (lat - d / 2) + '%2C' + (lon + d) + '%2C' + (lat + d / 2) + '&layer=mapnik&marker=' + lat + '%2C' + lon + '"></iframe>';
  }));

  // Demo-Formulare: prüfen nur, senden nichts
  $$('form[data-demo-form]').forEach(form => {
    const msg = $('.form-msg', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('input,select,textarea', form).forEach(f => { if (!f.willValidate) return; const bad = !f.checkValidity(); f.classList.toggle('invalid', bad); if (bad) ok = false; });
      const extra = form.demoCheck ? form.demoCheck() : '';
      if (!ok || extra) { msg.className = 'form-msg err'; msg.textContent = extra || 'Bitte füllen Sie alle Pflichtfelder aus.'; return; }
      msg.className = 'form-msg ok';
      msg.textContent = form.dataset.demoForm || 'Demo: Ihre Anfrage würde jetzt übermittelt. Es wurde nichts gesendet.';
      form.reset(); if (form.afterReset) form.afterReset();
    });
  });

  // Bildbetrachter für Galerien: <a data-lightbox="gruppe" href="bild.webp">
  const groups = {};
  $$('a[data-lightbox]').forEach(a => (groups[a.dataset.lightbox] ||= []).push(a));
  if (Object.keys(groups).length) {
    const dlg = document.createElement('dialog'); dlg.className = 'lightbox';
    dlg.innerHTML = '<button class="lb-close" aria-label="Schließen">×</button><button class="lb-prev" aria-label="Vorheriges Bild">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-next" aria-label="Nächstes Bild">›</button>';
    document.body.appendChild(dlg);
    let g = [], i = 0;
    const show = () => { const a = g[i], img = $('img', dlg); img.src = a.href; img.alt = $('img', a)?.alt || ''; $('figcaption', dlg).textContent = (a.dataset.caption || img.alt) + ' (' + (i + 1) + '/' + g.length + ')'; };
    Object.values(groups).forEach(list => list.forEach((a, k) => a.addEventListener('click', e => { e.preventDefault(); g = list; i = k; show(); dlg.showModal(); })));
    $('.lb-close', dlg).onclick = () => dlg.close();
    $('.lb-prev', dlg).onclick = () => { i = (i - 1 + g.length) % g.length; show(); };
    $('.lb-next', dlg).onclick = () => { i = (i + 1) % g.length; show(); };
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') $('.lb-prev', dlg).click(); if (e.key === 'ArrowRight') $('.lb-next', dlg).click(); });
  }

  // Sanftes Einblenden
  if ('IntersectionObserver' in window && !document.body.hasAttribute('data-fx')) {
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .1 });
    $$('section:not(.hero) .wrap > *').forEach(n => { n.classList.add('reveal'); io.observe(n); });
  }
})();
