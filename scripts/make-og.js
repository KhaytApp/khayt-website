#!/usr/bin/env node
/* ============================================================
   Render scripts/og-card.html to og-image.png.
   ------------------------------------------------------------
   The share card is the highest-leverage image the site owns — for a product
   whose distribution is people posting links in maker subreddits and Discords
   it is often the only thing a stranger sees — and it was a flat PNG nobody
   could edit a word of. Now it is a page, and this renders it.

   Rendered at 2x and downsampled, because the type is what has to survive
   being shown as a 400px-wide thumbnail in a chat window.

     node scripts/make-og.js                       # uses a local Chrome
     CHROME=/path/to/chrome node scripts/make-og.js

   Needs a Chrome on the machine. It is deliberately NOT wired into CI: this
   writes a binary the repo tracks, and a workflow that rewrites images on
   every push is a workflow that will one day rewrite one nobody asked it to.
   Run it when the card's words change, and commit the PNG.
   ============================================================ */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const W = 1200, H = 630, SCALE = 2;

const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const chrome = CANDIDATES.find(p => { try { fs.accessSync(p); return true; } catch (e) { return false; } });
if (!chrome) {
  console.error('make-og: no Chrome found. Set CHROME=/path/to/chrome.');
  console.error('  looked in:\n    ' + CANDIDATES.join('\n    '));
  process.exit(1);
}

const PORT = 9411 + (process.pid % 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'khayt-og-'));
const out2x = path.join(os.tmpdir(), 'khayt-og-card@2x-' + process.pid + '.png');
const target = path.join(ROOT, 'og-image.png');

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + profile,
  '--allow-file-access-from-files',
  'about:blank'
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const send = (method, params = {}) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise(r => pending.set(id, r));
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForDevTools() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return;
    } catch (e) { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome did not open a DevTools port');
}

function cleanup() {
  try { proc.kill(); } catch (e) {}
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  try { fs.rmSync(out2x, { force: true }); } catch (e) {}
}

(async () => {
  await waitForDevTools();
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
  await send('Page.navigate', { url: 'file://' + path.join(__dirname, 'og-card.html') });
  // The card loads webfonts from Google; without them the type falls back to
  // system sans and the card ships looking like a different product.
  await sleep(3500);
  const fontsReady = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: '(async () => { await document.fonts.ready; return document.fonts.check("900 76px Archivo"); })()',
    awaitPromise: true
  });
  if (fontsReady.result && fontsReady.result.value === false) {
    throw new Error('Archivo did not load — the card would render in a fallback face. Check the network.');
  }

  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: SCALE } });
  fs.writeFileSync(out2x, Buffer.from(shot.data, 'base64'));
  ws.close();
  try { proc.kill(); } catch (e) {}

  const before = fs.existsSync(target) ? fs.readFileSync(target) : null;

  // Down to exactly 1200x630. Scrapers cache aggressively and several refuse
  // anything that does not match the og:image:width/height the page declares.
  execFileSync('sips', ['-z', String(H), String(W), out2x, '--out', target], { stdio: 'pipe' });

  // sips exits 0 on inputs it could not read, so its exit code proves nothing.
  // Check the file itself: it has to exist, be the declared size, and not be
  // byte-identical to what was there before.
  const after = fs.readFileSync(target);
  const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', target]).toString();
  const w = +(/pixelWidth: (\d+)/.exec(dims) || [])[1];
  const h = +(/pixelHeight: (\d+)/.exec(dims) || [])[1];
  if (w !== W || h !== H) throw new Error(`wrote ${w}x${h}, expected ${W}x${H}`);
  if (before && before.equals(after)) throw new Error('og-image.png is unchanged — sips did not write it');

  cleanup();
  console.log(`og-image.png written — ${w}x${h}, ${Math.round(after.length / 1024)}KB`);
})().catch(e => {
  console.error('make-og failed:', e.message);
  cleanup();
  process.exit(1);
});
