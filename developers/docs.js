// Developer docs (/developers/): the "On this page" list and the copy buttons.
// Layout designed in Figma first (khaytapp.com library, "Developers (hidden)").
const ar = document.documentElement.lang === 'ar';

// ---- "On this page": pinned open beside the text when there is room ----
const toc = document.querySelector('.docs-toc');
if (toc) {
  const summary = toc.querySelector('summary');
  const wide = matchMedia('(min-width: 1000px)');
  const pin = () => {
    if (wide.matches) { toc.open = true; toc.dataset.pinned = ''; summary.tabIndex = -1; }
    else { delete toc.dataset.pinned; summary.removeAttribute('tabindex'); }
  };
  pin();
  wide.addEventListener('change', pin);
  summary.addEventListener('click', e => { if (toc.hasAttribute('data-pinned')) e.preventDefault(); });
  // On a phone, choosing a section closes the list behind it.
  toc.addEventListener('click', e => { if (e.target.closest('a') && !toc.hasAttribute('data-pinned')) toc.open = false; });

  // The section in view. CSS marks it with :target-current where the browser
  // has scroll-target-group; aria-current says the same to a screen reader.
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const mark = cur => links.forEach(a => {
    a.classList.toggle('target-current', a === cur);
    a.setAttribute('aria-current', a === cur ? 'true' : 'false');
  });
  if (CSS.supports('scroll-target-group: auto')) {
    const sync = () => mark(toc.querySelector('a:target-current'));
    sync();
    document.addEventListener('scrollend', sync);
  } else {
    const byId = new Map(links.map(a => [decodeURIComponent(a.hash.slice(1)), a]));
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) mark(byId.get(e.target.id));
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    for (const id of byId.keys()) { const h = document.getElementById(id); if (h) io.observe(h); }
  }
}

// ---- Copy buttons: <button command="--copy" commandfor="code-N"> ----
const timers = new WeakMap();
function report(button, ok) {
  const tip = button.nextElementSibling; // the role="status" bubble
  clearTimeout(timers.get(button));
  button.removeAttribute('data-copied');
  button.removeAttribute('data-failed');
  tip.textContent = '';
  void button.offsetWidth;
  button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
  const msg = ok ? (ar ? 'نُسخ' : 'Copied') : (ar ? 'تعذّر النسخ' : 'Copy failed');
  requestAnimationFrame(() => { tip.textContent = msg; });
  timers.set(button, setTimeout(() => {
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');
    tip.textContent = '';
  }, 2000));
}
async function copy(button, target) {
  const text = target.innerText.trim();
  if (!text) return;
  try { await navigator.clipboard.writeText(text); report(button, true); }
  catch { report(button, false); }
}
if ('CommandEvent' in window) {
  // command events do not bubble: listen in the capture phase.
  document.addEventListener('command', e => { if (e.command === '--copy') copy(e.source, e.target); }, true);
} else {
  document.addEventListener('click', e => {
    const button = e.target.closest('button[command="--copy"]');
    if (!button) return;
    const target = document.getElementById(button.getAttribute('commandfor'));
    if (target) copy(button, target);
  });
}
