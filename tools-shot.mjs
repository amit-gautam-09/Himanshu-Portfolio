/**
 * Zero-dependency Chrome screenshot / probe harness over CDP.
 *
 * node shot.mjs --url http://localhost:4321/ --w 1440 --h 900 --out a.png \
 *   [--scroll 540] [--eval "expr"] [--wait 1500] [--reduced] [--mobile]
 *   [--hover ".selector"] [--click ".sel[@dx,dy]"]
 *   [--press Enter|Escape|Space|ArrowDown|Tab] [--wheel ".sel@deltaY"]
 *
 * --eval prints the JSON result of an expression evaluated in the page
 *        (awaited if it is a promise) before the screenshot is taken.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith('--')) continue;
  const k = a.slice(2);
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) { args[k] = next; i++; } else args[k] = true;
}

const url = args.url || 'http://localhost:4321/';
const width = +(args.w || 1440);
const height = +(args.h || 900);
const dpr = +(args.dpr || 1);
const port = +(args.port || 9333);
const waitMs = +(args.wait || 2500);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  // Headless throttles rAF hard. These help, but do NOT fully fix it: with
  // no compositor you still get ~6 frames a second, so a tween's TIMELINE
  // cannot be measured here — only its start and end values. Measure timing
  // in a real window if it ever matters.
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--force-device-scale-factor=1',
  `--window-size=${width},${height}`,
  'about:blank'
], { stdio: 'ignore' });

let ws;
const pending = new Map();
let msgId = 0;

function send(method, params = {}, sessionId) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
}

const events = [];
function waitFor(method, timeout = 15000) {
  const seen = events.findIndex((e) => e.method === method);
  if (seen >= 0) { events.splice(seen, 1); return Promise.resolve(); }
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout ' + method)), timeout);
    const h = (e) => {
      if (e.method !== method) return;
      clearTimeout(t); listeners.delete(h); res();
    };
    listeners.add(h);
  });
}
const listeners = new Set();

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      const j = await r.json();
      return j.webSocketDebuggerUrl;
    } catch { await sleep(250); }
  }
  throw new Error('chrome never came up');
}

const wsUrl = await connect();
ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
    return;
  }
  events.push(m);
  for (const h of [...listeners]) h(m);
};

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: dpr, mobile: !!args.mobile
}, sessionId);
if (args.reduced) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  }, sessionId);
}

await send('Page.navigate', { url }, sessionId);
await waitFor('Page.loadEventFired').catch(() => {});
await sleep(waitMs);

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true
  }, sessionId);
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
  return r.result.value;
}

if (args.scroll !== undefined && args.scroll !== true) {
  await evaluate(`scrollTo(0, ${+args.scroll}); 1`);
  await sleep(600);
}
// Real pointer/key input, so CSS :hover and keydown handlers actually fire —
// synthetic DOM events do not trigger :hover.
if (args.hover) {
  const box = await evaluate(
    `(() => { const e = document.querySelector(${JSON.stringify(args.hover)});
      if (!e) return null; const r = e.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2]; })()`
  );
  if (!box) throw new Error('no element for --hover ' + args.hover);
  await send('Input.dispatchMouseEvent',
    { type: 'mouseMoved', x: box[0], y: box[1], button: 'none', buttons: 0 }, sessionId);
  await sleep(700);
}

// --click takes "selector" or "selector@dx,dy" — the offset is from the
// element's centre, which is how you test an extended ::after hit area.
if (args.click) {
  const [sel, off] = String(args.click).split('@');
  const [dx, dy] = (off || '0,0').split(',').map(Number);
  const box = await evaluate(
    `(() => { const e = document.querySelector(${JSON.stringify(sel)});
      if (!e) return null; const r = e.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2]; })()`
  );
  if (!box) throw new Error('no element for --click ' + sel);
  const at = { x: box[0] + dx, y: box[1] + dy, button: 'left', clickCount: 1 };
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...at, buttons: 0 }, sessionId);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...at, buttons: 1 }, sessionId);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...at, buttons: 0 }, sessionId);
  await sleep(600);
}

// --drag "selector@dx,dy" presses at the element centre, moves in steps and
// releases — a real pointer drag, which is what OrbitControls listens for.
if (args.drag) {
  const [sel, off] = String(args.drag).split('@');
  const [dx, dy] = (off || '80,0').split(',').map(Number);
  const box = await evaluate(
    `(() => { const e = document.querySelector(${JSON.stringify(sel)});
      if (!e) return null; const r = e.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2]; })()`
  );
  if (!box) throw new Error('no element for --drag ' + sel);
  const [x0, y0] = box;
  const common = { button: 'left', pointerType: 'mouse' };
  await send('Input.dispatchMouseEvent',
    { type: 'mousePressed', x: x0, y: y0, buttons: 1, clickCount: 1, ...common }, sessionId);
  for (let i = 1; i <= 8; i++) {
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: x0 + (dx * i) / 8, y: y0 + (dy * i) / 8,
      buttons: 1, ...common
    }, sessionId);
    await sleep(25);
  }
  await send('Input.dispatchMouseEvent',
    { type: 'mouseReleased', x: x0 + dx, y: y0 + dy, buttons: 0, clickCount: 1, ...common }, sessionId);
  await sleep(500);
}

// --wheel "selector@deltaY" sends a real wheel event over that element, the
// only way to test whether the page scrolls or a canvas swallows it.
if (args.wheel) {
  const [sel, d] = String(args.wheel).split('@');
  const deltaY = Number(d || 200);
  const box = await evaluate(
    `(() => { const e = document.querySelector(${JSON.stringify(sel)});
      if (!e) return null; const r = e.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2]; })()`
  );
  if (!box) throw new Error('no element for --wheel ' + sel);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: box[0], y: box[1],
    deltaX: 0, deltaY, pointerType: 'mouse'
  }, sessionId);
  await sleep(700);
}

if (args.press) {
  const key = args.press;
  const codes = { Enter: 13, Escape: 27, Space: 32, ArrowDown: 40, Tab: 9 };
  const common = { key, code: key === 'Space' ? 'Space' : key,
                   windowsVirtualKeyCode: codes[key] || 0, nativeVirtualKeyCode: codes[key] || 0 };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...common }, sessionId);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...common }, sessionId);
  await sleep(600);
}

if (args.eval) {
  const v = await evaluate(`(async () => (${args.eval}))()`);
  console.log(JSON.stringify(v, null, 2));
}

if (args.out) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
  writeFileSync(args.out, Buffer.from(data, 'base64'));
  console.log('wrote ' + args.out);
}

ws.close();
chrome.kill();
process.exit(0);
