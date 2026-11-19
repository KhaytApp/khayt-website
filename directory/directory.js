// Directory (/directory/): filter the list, check a downloaded file against
// its signed SHA-256, and send a report. Layout designed in Figma first
// (khaytapp.com library, "Plugin directory (draft)" and "Trust blocks").
// Every part works on its own; without this script the list shows every item
// and the support address is on every page.
const ar = document.documentElement.lang === 'ar';

// ---- Buttons that open and close the report dialog --------------------------
// <button command="show-modal" commandfor="report"> is native where Invoker
// Commands are supported; elsewhere these few lines do the same. No polyfill
// is loaded: the site's policy allows scripts from this site only.
if (!('commandForElement' in HTMLButtonElement.prototype)) {
  document.addEventListener('click', e => {
    const b = e.target.closest('button[commandfor]');
    const d = b && document.getElementById(b.getAttribute('commandfor'));
    if (!d || !(d instanceof HTMLDialogElement)) return;
    const c = b.getAttribute('command');
    if (c === 'show-modal' && !d.open) d.showModal();
    else if (c === 'close') d.close();
  });
}
// closedby="any" (click outside to close) where it is missing. Esc already works.
for (const d of document.querySelectorAll('dialog[closedby="any"]')) {
  if ('closedBy' in d) continue;
  d.addEventListener('click', e => {
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) d.close();
  });
}

// ---- Filter the list ------------------------------------------------------------
const grid = document.getElementById('dirGrid');
if (grid) {
  const search = document.getElementById('dirSearch');
  const count = document.getElementById('dirCount');
  const chips = [...document.querySelectorAll('.dir-chip')];
  const cards = [...grid.children];
  let kind = '';
  const apply = () => {
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const c of cards) {
      const ok = (!kind || c.dataset.kind === kind) && words.every(w => c.dataset.text.includes(w));
      c.hidden = !ok;
      if (ok) shown++;
    }
    const filtered = kind || words.length;
    count.textContent = !filtered ? '' : shown === 0
      ? (ar ? 'لا شيء يطابق.' : 'Nothing matches.')
      : (ar ? `يظهر ${shown} من ${cards.length}.` : `Showing ${shown} of ${cards.length}.`);
  };
  search.addEventListener('input', apply);
  for (const b of chips) {
    b.addEventListener('click', () => {
      kind = b.dataset.kind;
      for (const x of chips) x.setAttribute('aria-pressed', String(x === b));
      apply();
    });
  }
}

// ---- Check a downloaded file ----------------------------------------------------
// The file is read and hashed here, on this computer. It is never uploaded.
for (const box of document.querySelectorAll('.dir-check')) {
  if (!(globalThis.crypto && crypto.subtle)) continue;   // stays hidden
  const files = JSON.parse(box.dataset.files);
  const out = box.querySelector('.dir-result');
  const input = box.querySelector('.dir-file-in');
  const show = cls => { out.replaceChildren(box.querySelector('template.' + cls).content.cloneNode(true)); };
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  async function check(file) {
    if (!file) return;
    out.textContent = ar ? 'جارٍ الحساب…' : 'Working it out…';
    try {
      const h = hex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
      show(files.some(f => f.sha256 === h) ? 'dir-r-ok' : 'dir-r-bad');
    } catch (_) {
      show('dir-r-err');
    }
  }
  input.addEventListener('change', () => check(input.files[0]));
  box.addEventListener('dragover', e => { e.preventDefault(); box.classList.add('over'); });
  box.addEventListener('dragleave', () => box.classList.remove('over'));
  box.addEventListener('drop', e => { e.preventDefault(); box.classList.remove('over'); check(e.dataTransfer.files[0]); });
  box.hidden = false;
}

// ---- Report -----------------------------------------------------------------------
// With data-endpoint (khayt-cloud's /v1/directory/reports, once switched on)
// the report is posted there; otherwise, or if that fails, it opens the
// visitor's email app with the report filled in. The page keeps nothing.
const dialog = document.getElementById('report');
if (dialog) {
  const form = dialog.querySelector('form');
  const sent = document.getElementById('reportSent');
  const what = form.elements.what;
  const max = Number(what.dataset.maxBytes);
  // The limit is in bytes, as the server counts it: Arabic takes two per letter.
  what.addEventListener('input', () => {
    what.setCustomValidity(new TextEncoder().encode(what.value).length > max ? sent.dataset.long : '');
  });
  const say = msg => { sent.textContent = msg; sent.hidden = false; };
  form.addEventListener('submit', async e => {
    if (e.submitter && e.submitter.value !== 'send') return;
    const data = new FormData(form);
    const { to, item, version, endpoint } = dialog.dataset;
    const report = { itemId: item, version, reason: data.get('reason'), detail: data.get('what') };
    form.reset();
    if (endpoint) {
      try {
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report), credentials: 'omit' });
        if (r.ok) { say(sent.dataset.sent); return; }
      } catch (_) { /* fall back to email below */ }
    }
    const subject = `Report: ${item} ${version} (${report.reason})`;
    const body = `Item: ${item}\nVersion: ${version}\nReason: ${report.reason}\nPage: ${location.href}\n\n${report.detail}\n`;
    location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    say(sent.dataset.mail);
  });
}
