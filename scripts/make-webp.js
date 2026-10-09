#!/usr/bin/env node
/* ============================================================
   Write a WebP beside every screenshot PNG.
   ------------------------------------------------------------
   The site ships 208 screenshots — 8 designs x 13 screens x 2 languages —
   plus the two mode shots, all PNG, averaging ~180KB. Every gallery tab and
   every theme chip is a fresh network fetch of one of them.

   Quality is 0.92, chosen by looking rather than by reputation: the four
   qualities were rendered side by side at 2x over the densest text in the
   kanban cards, and 0.95 and 0.92 were indistinguishable from the source
   while 0.86 put faint ringing around the "UNPAID" pill. 0.92 is 92KB
   against the PNG's 197KB — 53% off, with nothing visible given up.

   The PNGs stay. <picture> serves WebP to everything that asks for it and
   falls back to PNG otherwise, which costs repository space and no bandwidth.

     node scripts/make-webp.js           # only files with no WebP yet
     node scripts/make-webp.js --force   # re-encode everything

   Narrower copies, for srcset. The hero and the gallery are 2160px captures,
   and a phone drew them at ~350 CSS px: it downloaded six times the pixels
   it could show, and the hero is the page's largest paint. So every
   screenshot outside themes/ also gets a WebP at each of WIDTHS that is
   narrower than itself, named screenshot-queue-640w.webp and so on, and the
   pages and app.js offer them with srcset + sizes. themes/ is left alone:
   the theme demo is dormant (see buildThemeChips in app.js) and its 182
   captures are never shown.

   The downscale is the canvas's own, at imageSmoothingQuality 'high'. The
   widths are listed again in app.js (SHOT_WIDTHS), which builds the gallery's
   srcset; check-site.js fails if the two lists differ, if a variant is
   missing, stale, or not the width its name says.

   Chrome is the encoder: canvas.toDataURL('image/webp', q). macOS ships no
   cwebp and sips cannot write the format, and adding a native dependency to
   a repository that is otherwise plain files is a worse trade than driving
   the browser that is already here for the OG card.
   ============================================================ */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const QUALITY = 0.92;
const FORCE = process.argv.includes('--force');
const WIDTHS = [640, 1080, 1600];

// Width of a PNG, from its IHDR chunk, without decoding it.
function pngWidth(rel) {
  return fs.readFileSync(path.join(ROOT, rel)).readUInt32BE(16);
}

// Every file to write for one PNG: its full-size WebP, then the narrower
// copies. A variant is never wider than its source — upscaling ships bytes
// with no detail in them.
function outputsFor(rel) {
  const base = rel.replace(/\.png$/, '');
  const out = [{ file: base + '.webp', width: 0 }];
  if (rel.split(path.sep)[1] !== 'themes') {
    const w = pngWidth(rel);
    for (const v of WIDTHS) if (v < w) out.push({ file: base + '-' + v + 'w.webp', width: v });
  }
  return out;
}

/* ---------- what to convert ---------- */

function pngsUnder(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pngsUnder(rel));
    else if (entry.name.endsWith('.png')) out.push(rel);
  }
  return out;
}

// Re-encode a WebP when its PNG is newer, so a re-captured screenshot cannot
// leave a stale WebP being served in its place. Only the files that need it:
// adding a width must not rewrite every full-size WebP already committed.
function staleOutputs(rel) {
  if (FORCE) return outputsFor(rel);
  const png = fs.statSync(path.join(ROOT, rel)).mtimeMs;
  return outputsFor(rel).filter(o => {
    const webp = path.join(ROOT, o.file);
    return !fs.existsSync(webp) || png > fs.statSync(webp).mtimeMs;
  });
}

const targets = pngsUnder('screenshots').filter(rel => staleOutputs(rel).length);

if (!targets.length) {
  console.log('Every screenshot already has an up-to-date WebP.');
  process.exit(0);
}

/* ---------- Chrome ---------- */

const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].filter(Boolean);
const chrome = CANDIDATES.find(p => { try { fs.accessSync(p); return true; } catch (e) { return false; } });
if (!chrome) {
  console.error('make-webp: no Chrome found. Set CHROME=/path/to/chrome.');
  process.exit(1);
}

// The canvas has to be same-origin with the images or reading it back throws,
// so the files are served over HTTP rather than opened as file:// URLs.
const http = require('http');
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('no');
    return;
  }
  res.writeHead(200, { 'Content-Type': rel.endsWith('.png') ? 'image/png' : 'text/html' });
  fs.createReadStream(file).pipe(res);
});

const PORT = 8730 + (process.pid % 200);
const DEVTOOLS = 9500 + (process.pid % 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'khayt-webp-'));
let proc;

function cleanup() {
  try { proc && proc.kill(); } catch (e) {}
  try { server.close(); } catch (e) {}
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));

  proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--remote-debugging-port=' + DEVTOOLS, '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore' });

  let ok = false;
  for (let i = 0; i < 60 && !ok; i++) {
    try { ok = (await fetch(`http://127.0.0.1:${DEVTOOLS}/json/version`)).ok; } catch (e) { await sleep(250); }
  }
  if (!ok) throw new Error('Chrome did not open a DevTools port');

  const tab = await (await fetch(`http://127.0.0.1:${DEVTOOLS}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) => {
    const id = ++msgId;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise(r => pending.set(id, r));
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await sleep(1500);

  let written = 0, files = 0, pngBytes = 0, webpBytes = 0;
  const failures = [];

  for (const rel of targets) {
    const outputs = staleOutputs(rel);
    const res = await send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        const img = new Image();
        img.src = ${JSON.stringify('/' + rel.split(path.sep).join('/'))};
        await img.decode();
        // 0 means the source's own width.
        return ${JSON.stringify(outputs.map(o => o.width))}.map(w => {
          const c = document.createElement('canvas');
          c.width = w || img.naturalWidth;
          c.height = Math.round(img.naturalHeight * c.width / img.naturalWidth);
          const g = c.getContext('2d');
          g.imageSmoothingEnabled = true;
          g.imageSmoothingQuality = 'high';
          g.drawImage(img, 0, 0, c.width, c.height);
          const url = c.toDataURL('image/webp', ${QUALITY});
          if (!url.startsWith('data:image/webp')) throw new Error('this Chrome did not encode WebP');
          return url.slice(url.indexOf(',') + 1);
        });
      })()`
    });

    const value = res.result && res.result.result && res.result.result.value;
    if (res.exceptionDetails || !Array.isArray(value) || value.length !== outputs.length) {
      const why = (res.exceptionDetails && res.exceptionDetails.exception && res.exceptionDetails.exception.description) || 'no data returned';
      failures.push(rel + ' — ' + String(why).split('\n')[0]);
      continue;
    }

    outputs.forEach((o, i) => {
      const buf = Buffer.from(value[i], 'base64');
      // A WebP file starts "RIFF....WEBP". Checked rather than assumed, because
      // a silently truncated base64 string still writes a plausible-looking file.
      if (buf.length < 64 || buf.slice(0, 4).toString() !== 'RIFF' || buf.slice(8, 12).toString() !== 'WEBP') {
        failures.push(o.file + ' — output is not a WebP file');
        return;
      }
      fs.writeFileSync(path.join(ROOT, o.file), buf);
      files++;
      if (!o.width) {
        pngBytes += fs.statSync(path.join(ROOT, rel)).size;
        webpBytes += buf.length;
      }
    });
    written++;
    if (written % 25 === 0) process.stdout.write(`  ${written}/${targets.length}\n`);
  }

  ws.close();
  cleanup();

  const mb = n => (n / 1048576).toFixed(1) + 'MB';
  console.log(`${written} screenshot(s), ${files} WebP file(s) written at q=${QUALITY}` + (pngBytes
    ? ` — full size, ${mb(pngBytes)} of PNG became ${mb(webpBytes)} (${Math.round(100 - webpBytes / pngBytes * 100)}% smaller)`
    : ''));
  if (failures.length) {
    console.error(`\n${failures.length} failed:`);
    failures.forEach(f => console.error('  ' + f));
    process.exit(1);
  }
})().catch(e => {
  console.error('make-webp failed:', e.message);
  cleanup();
  process.exit(1);
});
