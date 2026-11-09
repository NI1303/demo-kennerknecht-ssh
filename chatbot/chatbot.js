/*!
 * Demo-Assistent – wiederverwendbares, rein clientseitiges Chat-Widget
 * Keine API, kein externer Dienst. Antworten kommen ausschließlich aus der
 * Wissensdatei (kb.json) der jeweiligen Website.
 *
 * Einbindung:
 *   <link rel="stylesheet" href="chatbot/chatbot.css">
 *   <script src="chatbot/chatbot.js" data-kb="chatbot/kb.json" defer></script>
 * Optional (funktioniert auch per file://): Wissensbasis inline als
 *   <script type="application/json" id="chatbot-kb">{...}</script>
 */
(function () {
  'use strict';
  var script = document.currentScript;
  var KB_URL = script && script.getAttribute('data-kb');

  // ---------- Hilfsfunktionen ----------
  function norm(s) {
    return (' ' + String(s || '').toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[éèê]/g, 'e').replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9€ ]+/g, ' ').replace(/\s+/g, ' ') + ' ');
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // **fett** und Zeilenumbrüche, sonst nur Text
  function fmt(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---------- Öffnungsstatus ----------
  function openStatus(oh) {
    if (!oh || !oh.days) return '';
    try {
      var f = new Intl.DateTimeFormat('en-GB', { timeZone: oh.timeZone || 'Europe/Berlin', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
      var p = {}; f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var d = map[p.weekday], h = (+p.hour % 24) + (+p.minute) / 60;
      var slot = oh.days[String(d)];
      if (!slot) return oh.texts.closedDay;
      if (h >= slot[0] && h < slot[1]) return oh.texts.openNow;
      if (h < slot[0]) return oh.texts.laterToday;
      return oh.texts.closedNow;
    } catch (e) { return ''; }
  }

  // ---------- Engine ----------
  function Engine(kb) {
    this.kb = kb;
    var stop = {};
    (kb.stopwords || []).forEach(function (w) { stop[norm(w).trim()] = 1; });
    this.stop = stop;
    // Menü-Index
    this.items = [];
    var self = this;
    ((kb.menu && kb.menu.sections) || []).forEach(function (sec) {
      sec._kw = (sec.keywords || []).map(function (k) { return norm(k).trim(); });
      sec.items.forEach(function (it) {
        self.items.push({ sec: sec, it: it, n: norm(it.name + ' ' + (it.desc || '')) });
      });
    });
    (kb.intents || []).forEach(function (i) {
      i._kw = (i.keywords || []).map(function (k) { return norm(k).trim(); });
    });
  }
  Engine.prototype.fill = function (text) {
    var kb = this.kb;
    return String(text).replace(/\{\{status\}\}/g, openStatus(kb.openingHours));
  };
  Engine.prototype.formatItems = function (list) {
    return list.map(function (it) {
      return '• ' + it.name + (it.desc ? ' – ' + it.desc : '') + ' **' + it.price + '**';
    }).join('\n');
  };
  Engine.prototype.sectionAnswer = function (sec) {
    return { text: '**' + sec.title + '**\n' + this.formatItems(sec.items) + (sec.note ? '\n\n' + sec.note : ''), links: this.kb.menu.links, chips: this.kb.menu.followChips };
  };
  Engine.prototype.answer = function (q) {
    var kb = this.kb, n = norm(q), self = this;
    if (n.trim().length === 0) return null;

    // 0) Exakter Treffer auf einen Kartenbereich (z. B. per Chip)
    var exact = ((kb.menu && kb.menu.sections) || []).filter(function (s) { return norm(s.title) === n || norm(s.short) === n; })[0];
    if (exact) return this.sectionAnswer(exact);

    // 1) Intents nach Schlüsselwörtern bewerten
    var best = null, bestScore = 0;
    kb.intents.forEach(function (i) {
      var s = 0;
      i._kw.forEach(function (k) { if (k && n.indexOf(' ' + k) !== -1) s += (i.weight || 1) * (k.length > 6 ? 1.5 : 1); });
      if (s > bestScore) { bestScore = s; best = i; }
    });

    // 2) Menü-Abschnitte
    var bestSec = null, secScore = 0;
    ((kb.menu && kb.menu.sections) || []).forEach(function (sec) {
      var s = 0;
      sec._kw.forEach(function (k) { if (k && n.indexOf(' ' + k) !== -1) s += 2.5; });
      if (s > secScore) { secScore = s; bestSec = sec; }
    });

    // 3) Einzelne Gerichte/Weine (Wortsuche)
    var tokens = n.trim().split(' ').filter(function (t) { return t.length >= 4 && !self.stop[t]; });
    var hits = [];
    if (tokens.length) {
      this.items.forEach(function (x) {
        var s = 0;
        tokens.forEach(function (t) { if (x.n.indexOf(t) !== -1) s += t.length >= 6 ? 3 : 1; });
        if (s > 0) hits.push({ x: x, s: s });
      });
      hits.sort(function (a, b) { return b.s - a.s; });
    }
    var hitScore = hits.length ? hits[0].s : 0;

    if (hitScore >= 2 && hitScore >= secScore && hitScore >= bestScore) {
      var top = hits.filter(function (h) { return h.s === hitScore; }).slice(0, 6);
      var text = (kb.menu.foundPrefix || 'Das habe ich auf der Karte gefunden:') + '\n' +
        top.map(function (h) { var it = h.x.it; return '• ' + it.name + (it.desc ? ' – ' + it.desc : '') + ' **' + it.price + '** (' + h.x.sec.title + ')'; }).join('\n');
      return { text: text, links: kb.menu.links, chips: kb.menu.followChips };
    }
    if (bestSec && secScore >= bestScore && secScore > 0) return this.sectionAnswer(bestSec);
    if (best && bestScore > 0) {
      var a = { text: this.fill(best.answer), links: best.links, chips: best.chips };
      if (best.showSections && kb.menu) {
        a.chips = kb.menu.sections.map(function (s) { return { label: s.short || s.title, ask: s.title }; });
      }
      return a;
    }
    return { text: this.fill(kb.fallback.text), links: kb.fallback.links, chips: kb.chips, fallback: true };
  };

  // ---------- UI ----------
  function UI(kb) {
    var engine = new Engine(kb);
    var root = el('div', 'cb-root'); root.setAttribute('data-demo-assistent', '');
    if (kb.theme) Object.keys(kb.theme).forEach(function (k) { root.style.setProperty('--cb-' + k, kb.theme[k]); });

    var btn = el('button', 'cb-launcher', '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4.6 3.5A.9.9 0 0 1 3 20.8V6a2 2 0 0 1 1-2Zm3 6.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm5 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm5 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"/></svg><span class="cb-launcher-label">' + esc(kb.launcherLabel || 'Fragen?') + '</span>');
    btn.type = 'button';
    btn.setAttribute('aria-label', (kb.launcherLabel || 'Fragen?') + ' – ' + (kb.assistantName || 'Demo-Assistent') + ' öffnen');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'cb-panel');

    var panel = el('div', 'cb-panel');
    panel.id = 'cb-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', kb.assistantName || 'Demo-Assistent');
    panel.hidden = true;
    panel.innerHTML =
      '<header class="cb-head">' +
        (kb.avatar ? '<img class="cb-avatar" src="' + esc(kb.avatar) + '" alt="">' : '') +
        '<div class="cb-head-text"><strong>' + esc(kb.title || '') + '</strong><span>' + esc(kb.assistantName || 'Demo-Assistent') + ' <em class="cb-badge">DEMO</em></span></div>' +
        '<button class="cb-close" type="button" aria-label="Chat schließen">×</button>' +
      '</header>' +
      '<div class="cb-log" role="log" aria-live="polite"></div>' +
      '<div class="cb-chips"></div>' +
      (kb.handoff && (kb.handoff.tel || kb.handoff.mail) ? '<p class="cb-handoff"><span>' + esc(kb.handoff.text || 'Lieber persönlich?') + '</span>' +
        (kb.handoff.tel ? '<a class="cb-hand" href="tel:' + esc(kb.handoff.tel) + '"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>' + esc(kb.handoff.telLabel || 'Anrufen') + '</a>' : '') +
        (kb.handoff.mail ? '<a class="cb-hand" href="mailto:' + esc(kb.handoff.mail) + '"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2L4.4 7H19.6zM4 8.6V17h16V8.6l-8 5.5z"/></svg>' + esc(kb.handoff.mailLabel || 'E-Mail') + '</a>' : '') +
        '</p>' : '') +
      '<form class="cb-form"><label class="cb-sr" for="cb-input">Ihre Frage</label>' +
        '<input id="cb-input" class="cb-input" type="text" autocomplete="off" maxlength="200" placeholder="' + esc(kb.placeholder || 'Ihre Frage …') + '">' +
        '<button class="cb-send" type="submit" aria-label="Senden"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2z"/></svg></button></form>' +
      '<p class="cb-foot">' + esc(kb.demoNote || 'Demo-Assistent – Antworten nur aus den Inhalten dieser Website.') + '</p>';

    root.appendChild(panel); root.appendChild(btn);
    document.body.appendChild(root);

    var log = panel.querySelector('.cb-log'), chipsBox = panel.querySelector('.cb-chips');
    var form = panel.querySelector('.cb-form'), input = panel.querySelector('.cb-input');
    var started = false;

    function scroll() { log.scrollTop = log.scrollHeight; }
    function setChips(chips) {
      chipsBox.innerHTML = '';
      (chips || kb.chips || []).forEach(function (c) {
        var b = el('button', 'cb-chip', esc(c.label)); b.type = 'button';
        b.addEventListener('click', function () { ask(c.ask || c.label, c.label); });
        chipsBox.appendChild(b);
      });
    }
    function bot(a) {
      var m = el('div', 'cb-msg cb-bot', '<div class="cb-bubble">' + fmt(a.text) + '</div>');
      if (a.links && a.links.length) {
        var l = el('div', 'cb-links');
        a.links.forEach(function (k) {
          var x = el('a', 'cb-link', esc(k.label)); x.href = k.href;
          if (/^https?:/.test(k.href)) { x.target = '_blank'; x.rel = 'noopener'; }
          else if (k.href.charAt(0) === '#') x.addEventListener('click', function () { if (window.matchMedia('(max-width: 600px)').matches) close(); });
          l.appendChild(x);
        });
        m.appendChild(l);
      }
      log.appendChild(m); setChips(a.chips); scroll();
    }
    function user(t) { log.appendChild(el('div', 'cb-msg cb-user', '<div class="cb-bubble">' + esc(t) + '</div>')); scroll(); }
    function ask(q, shown) {
      user(shown || q);
      var typing = el('div', 'cb-msg cb-bot cb-typing', '<div class="cb-bubble"><i></i><i></i><i></i></div>');
      log.appendChild(typing); scroll();
      setTimeout(function () { typing.remove(); bot(engine.answer(q)); }, 380);
    }
    function open() {
      panel.hidden = false; root.classList.add('cb-open'); btn.setAttribute('aria-expanded', 'true');
      if (!started) { started = true; bot({ text: engine.fill(kb.greeting), chips: kb.chips }); }
      setTimeout(function () { if (!window.matchMedia('(pointer: coarse)').matches) input.focus(); }, 50);
    }
    function close() { panel.hidden = true; root.classList.remove('cb-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    btn.addEventListener('click', function () { panel.hidden ? open() : close(); });
    panel.querySelector('.cb-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = ''; ask(q);
    });
    window.DemoChatbot = { open: open, close: close, ask: ask, answer: function (q) { return engine.answer(q); } };
  }

  function start(kb) { if (kb) UI(kb); }
  function boot() {
    var inline = document.getElementById('chatbot-kb');
    if (inline) { try { return start(JSON.parse(inline.textContent)); } catch (e) { console.error('chatbot-kb ungültig', e); } }
    if (!KB_URL) return console.error('Demo-Assistent: keine Wissensdatei (data-kb) angegeben');
    fetch(KB_URL).then(function (r) { return r.json(); }).then(start)
      .catch(function (e) { console.error('Demo-Assistent: Wissensdatei konnte nicht geladen werden', e); });
  }
  // Runde 8: erst nach dem Laden der Seite starten (Wissensdatei blockiert so nie den ersten Eindruck)
  function later() { if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 2000 }); else setTimeout(boot, 800); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
