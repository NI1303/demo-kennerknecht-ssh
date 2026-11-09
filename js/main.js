/* Kennerknecht – Seitenfunktionen: Referenzen filtern, Anfrage vorbelegen (aus Station oder Hausschnitt) */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const btns = $$('.f-btn');
  btns.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.filter;
    btns.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    $$('.r-item').forEach(it => { it.classList.toggle('hide', k !== 'alle' && it.dataset.cat !== k); it.classList.add('in'); });
  }));
  // „Dach: Anfrage stellen“ → Bereich im Formular vorwählen
  $$('[data-pre]').forEach(a => a.addEventListener('click', () => {
    const r = $(`.a-form input[name=bereich][value="${a.dataset.pre}"]`);
    if (r) { r.checked = true; const fs = r.closest('.seg'); fs.classList.remove('flash'); void fs.offsetWidth; fs.classList.add('flash'); }
  }));
})();
