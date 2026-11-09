/* plus.js – Konversion & Verkaufsmoment für die Demo-Websites (Runde 8).
   Konfiguration: <script type="application/json" id="plus-cfg">. Ohne JS bleibt alles nutzbar.
   (Öffnungsstatus „jetzt geöffnet“ macht base.js über [data-hours] – nur mit echten Zeiten.)
   1 · Route mit Google Maps / Apple Karten neben vorhandenen OpenStreetMap-Links
   2 · Nur Demo: „Vorher / Nachher“-Vergleich im Demo-Banner (Dialog, Regler per Tastatur) */
(function () {
  'use strict';
  var d = document, cfgEl = d.getElementById('plus-cfg');
  if (!cfgEl) return;
  var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* 1 · Route: Google Maps & Apple Karten (öffnen auf dem Handy direkt die Navi-App) */
  if (cfg.address) {
    var q = encodeURIComponent(cfg.address);
    var html = '<span class="pl-route-lbl">Route mit</span> <a href="https://www.google.com/maps/dir/?api=1&amp;destination=' + q + '" target="_blank" rel="noopener">Google Maps</a>' +
      ' <span aria-hidden="true">·</span> <a href="https://maps.apple.com/?daddr=' + q + '" target="_blank" rel="noopener">Apple Karten</a>';
    var hosts = $$('a[href*="openstreetmap.org/?mlat"]').filter(function (a) { return !a.closest('.mobile-bar,.cb-root,footer'); });
    hosts.forEach(function (a) { var s = d.createElement('span'); s.className = 'pl-route'; s.innerHTML = html; a.insertAdjacentElement('afterend', s); });
    (cfg.routeAt || []).forEach(function (sel) { $$(sel).forEach(function (h) { var p = d.createElement('p'); p.className = 'pl-route pl-route-block'; p.innerHTML = html; h.appendChild(p); }); });
  }

  /* 2 · Vorher / Nachher (nur in der Demo, sitzt im Demo-Banner) */
  var v = cfg.vorher, banner = d.querySelector('.demo-banner');
  if (v && banner && 'HTMLDialogElement' in window) {
    var btn = banner.querySelector('.pl-vn-btn');
    if (!btn) { btn = d.createElement('button'); btn.type = 'button'; btn.className = 'pl-vn-btn';
      btn.innerHTML = '<span aria-hidden="true">◐</span> Vorher / Nachher';
      btn.setAttribute('aria-haspopup', 'dialog'); banner.appendChild(btn); }
    var dlg = null;
    var build = function () {
      var m = matchMedia('(max-width: 700px)').matches;
      var a = m ? v.m : v.d, b = m ? v.nm : v.nd, w = m ? 390 : 1200, h = m ? 844 : 750;
      dlg = d.createElement('dialog'); dlg.className = 'pl-vn'; dlg.setAttribute('aria-labelledby', 'pl-vn-h');
      dlg.innerHTML =
        '<form method="dialog" class="pl-vn-x"><button aria-label="Vergleich schließen">×</button></form>' +
        '<p class="pl-vn-kick">Nur in dieser Demo sichtbar</p>' +
        '<h2 id="pl-vn-h">' + esc(v.title || 'So sah Ihre Seite bisher aus') + '</h2>' +
        '<p class="pl-vn-txt">' + esc(v.text || ('Ihre Inhalte, Fotos und Ihr Ton sind die Grundlage dieses Entwurfs – wir haben sie nur neu in Szene gesetzt.' + (a ? ' Ziehen Sie den Regler, um bisher und neu zu vergleichen.' : ' Den direkten Vergleich mit Ihrer bisherigen Seite ergänzen wir hier.'))) + '</p>' +
        (a ? '<div class="pl-cmp" style="--pos:50%;aspect-ratio:' + w + '/' + h + '">' +
            '<img class="pl-cmp-neu" src="' + esc(b) + '" alt="Entwurf: Startseite der neuen Demo" width="' + w + '" height="' + h + '">' +
            '<div class="pl-cmp-alt"><img src="' + esc(a) + '" alt="Bisher: Startseite der aktuellen Website" width="' + w + '" height="' + h + '"></div>' +
            '<span class="pl-cmp-l" aria-hidden="true">Bisher</span><span class="pl-cmp-r" aria-hidden="true">Entwurf</span>' +
            '<span class="pl-cmp-line" aria-hidden="true"></span>' +
            '<input type="range" min="0" max="100" value="50" aria-label="Vergleich: links bisher, rechts Entwurf">' +
          '</div>'
          : '<div class="pl-cmp-ph"><span class="ph">' + esc(v.missing || 'Bildschirmfoto der bisherigen Seite wird ergänzt') + '</span></div>') +
        '<p class="pl-vn-src">' + esc(v.src || '') + '</p>';
      d.body.appendChild(dlg);
      var r = dlg.querySelector('input[type=range]'), c = dlg.querySelector('.pl-cmp');
      if (r) r.addEventListener('input', function () { c.style.setProperty('--pos', r.value + '%'); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', function () { btn.focus(); });
    };
    btn.addEventListener('click', function () { if (!dlg) build(); dlg.showModal(); });
  }
})();
