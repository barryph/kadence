#!/usr/bin/env node
/**
 * Regenerates every Play Store image for Kadence, end to end.
 *
 *   node tools/generate.mjs
 *
 * The pipeline, in order:
 *
 *   1. checks Postgres, the API (:3000) and the editor (:3456), starting what is
 *      missing;
 *   2. seeds the demo account with a full training history, dated to the
 *      browser's local calendar date (the date the app itself sends);
 *   3. captures every app screen at the phone and both tablet viewports;
 *   4. exports the branded decks through the editor's own export path;
 *   5. unpacks the decks into exports/png/<deck>/.
 *
 * Safe to run at any time: each run rebuilds the account's data and overwrites
 * every generated image, on the app's current UI.
 *
 * Flags:
 *   --skip-seed        keep the account's existing history
 *   --only=<deck,...>  capture and export a subset of decks
 *   --keep-servers     leave any servers this run started running
 */
import { execFileSync, spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(ROOT, '..', '..');
const FRONT_END = join(REPO, 'front-end');
const BACK_END = join(REPO, 'back-end');

const API = 'http://localhost:3000';
const APP = 'http://localhost:8081';
const EDITOR = 'http://127.0.0.1:3456';

/**
 * One entry per Play listing deck.
 *
 * `view` is the CSS viewport the app is rendered at, and its aspect ratio is the
 * frame's *inner screen* - not the frame's outer size and not Play's screenshot
 * size. The three differ: the bezel adds height to the frame, and the app's own
 * header and tab bar add height to the capture. Rendering at the inner-screen
 * ratio is what makes the capture land in the bezel edge to edge, with no
 * letterbox above or below the app's dark tab bar.
 *
 * `size` and `outDir` are the Play-required output size, which the editor scales
 * to on export.
 */
const DECKS = [
  {
    id: 'android',
    folder: 'android/phone',
    size: '1080x1920',
    outDir: 'phone-1080x1920',
    view: { w: 412, h: 893, scale: 2 },
    tall: { w: 412, h: 893 },
  },
  {
    id: 'android-7',
    folder: 'tablet-7',
    size: '1200x1920',
    outDir: 'tablet-7-1200x1920',
    view: { w: 480, h: 791, scale: 2.5 },
    tall: { w: 480, h: 791 },
  },
  {
    id: 'android-10',
    folder: 'tablet-10',
    size: '1600x2560',
    outDir: 'tablet-10-1600x2560',
    view: { w: 576, h: 949, scale: 2.775 },
    tall: { w: 576, h: 949 },
  },
  {
    id: 'feature-graphic',
    folder: null,
    size: '1024x500',
    outDir: 'feature-graphic-1024x500',
    view: null,
  },
];

/** Activities put in the Queued section, by name. */
const QUEUED = ['Back Squat', 'Rowing Intervals'];
/** The activity whose goal page the adherence and cadence slides show. */
const GOAL_ACTIVITY = process.env.GOAL_ACTIVITY || 'Back Squat';

/** The app screens the deck is built from, in slide order. */
const SCREENS = [
  { file: '01-home-queue-top', route: '/', scrollBefore: 0, scrollAfter: 0 },
  { file: '02-home-queue-end', route: '/', scrollBefore: 0, scrollAfter: 1e6 },
  { file: '03-interval-form', route: '/activities/create', fillCreateForm: true },
  { file: '04-goals-list', route: '/goals' },
  { file: '05-goal-this-week', route: '/goals/{goal}', scrollAfter: 560 },
  { file: '06-goal-cadence', route: '/goals/{goal}' },
  { file: '07-insights', route: '/activities/insights', filterActivity: GOAL_ACTIVITY },
  { file: '08-timeline', route: '/timeline', waitMs: 10000 },
];

/** Demo account. Its password is deliberately not in the repo. */
const DEMO = {
  email: process.env.DEMO_EMAIL || 'kadence.demo@gmail.com',
  password: process.env.DEMO_PASSWORD || 'KadenceDemo2026!',
};

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const SKIP_SEED = flag('skip-seed');
const KEEP_SERVERS = flag('keep-servers');
const ONLY = value('only', '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const decks = ONLY.length ? DECKS.filter((d) => ONLY.includes(d.id)) : DECKS;
if (!decks.length) fail(`--only matched no decks (known: ${DECKS.map((d) => d.id).join(', ')})`);

const CHROME =
  process.env.CHROME_BIN ||
  '/home/barry/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const started = Date.now();
const children = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(step, message) {
  const elapsed = ((Date.now() - started) / 1000).toFixed(0).padStart(3);
  console.log(`[${elapsed}s] ${step.padEnd(7)} ${message}`);
}

function fail(message) {
  console.error(`\nFAILED: ${message}`);
  process.exit(1);
}

function run(command, commandArgs, { cwd, env } = {}) {
  return execFileSync(command, commandArgs, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
}

async function isUp(url, timeoutMs = 2000) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitFor(url, what, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isUp(url)) return;
    await sleep(1000);
  }
  fail(`${what} never came up at ${url}`);
}

function startServer(name, command, commandArgs, cwd, env = {}) {
  log('boot', `starting ${name}`);
  const child = spawn(command, commandArgs, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  const keep = [];
  const capture = (chunk) => {
    keep.push(chunk.toString());
    if (keep.length > 40) keep.shift();
    if (/error|EADDRINUSE/i.test(String(chunk))) process.stdout.write(`      ${chunk}`);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  child.on('exit', (code) => {
    if (!shuttingDown) fail(`${name} exited early with code ${code}\n${keep.join('')}`);
  });
  children.push({ name, child });
  return child;
}

let shuttingDown = false;
function stopServers() {
  if (KEEP_SERVERS || shuttingDown) return;
  for (const { name, child } of children) {
    log('boot', `stopping ${name}`);
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        /* already gone */
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Browser (Chrome DevTools Protocol)
// ---------------------------------------------------------------------------

/** Starts headless Chrome and returns a session that can drive one page. */
async function startBrowser() {
  const profile = mkdtempSync(join(tmpdir(), 'kadence-gen-'));
  const port = 9500;
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      '--font-render-hinting=none',
      '--disable-lcd-text',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1600,1400',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );


  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    await sleep(150);
  }

  return new Session(port, profile);
}

class Session {
  constructor(port, profile) {
    this.port = port;
    this.profile = profile;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.width = 412;
    this.height = 892;
  }

  async connect() {
    const targets = await (await fetch(`http://127.0.0.1:${this.port}/json/list`)).json();
    const page = targets.find((t) => t.type === 'page');
    if (!page) fail('no page target in Chrome');
    this.ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== undefined) {
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(JSON.stringify(msg.error)));
        else entry.resolve(msg.result);
        return;
      }
      this.handlers.get(msg.method)?.(msg.params);
    });
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    return this;
  }

  /** A timeout is mandatory: an unanswered CDP command would hang the run. */
  send(method, params = {}, timeoutMs = 60000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`cdp timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    this.handlers.set(method, handler);
  }

  async viewport(width, height, scale) {
    this.width = width;
    this.height = height;
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: scale,
      mobile: true,
      screenWidth: width,
      screenHeight: height,
    });
    await sleep(250);
  }

  async goto(url, waitMs = 6000) {
    await this.send('Page.navigate', { url });
    await sleep(waitMs);
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      const detail =
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text;
      throw new Error(`eval failed: ${detail}`);
    }
    return result.result.value;
  }

  /** Fires a pointer, mouse and click sequence at an element's centre. */
  async tap(selector, index = 0) {
    const box = await this.eval(`(() => {
      const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!box) throw new Error(`no element for ${selector}[${index}]`);
    await this.clickAt(box.x, box.y);
  }

  async clickAt(x, y) {
    const base = { x, y, button: 'left', clickCount: 1 };
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseMoved', buttons: 0 });
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed', buttons: 1 });
    await sleep(30);
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased', buttons: 0 });
    await sleep(350);
  }

  /** Waits until some element's text contains `needle`. */
  async waitForText(needle, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const found = await this.eval(`document.body.innerText.includes(${JSON.stringify(needle)})`);
      if (found) return true;
      await sleep(500);
    }
    fail(`"${needle}" never appeared on the page`);
  }

  /** Clicks an element whose text contains `needle` (toolbar buttons carry icons). */
  async clickContaining(needle) {
    const box = await this.eval(`(() => {
      const el = [...document.querySelectorAll('button,[role="button"]')].find(
        (c) => c.textContent.includes(${JSON.stringify(needle)}) && !c.disabled);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!box) fail(`no enabled control containing "${needle}"`);
    await this.clickAt(box.x, box.y);
  }

  /** Clicks the first element whose trimmed text equals `label`. */
  async clickText(label) {
    const box = await this.eval(`(() => {
      const els = [...document.querySelectorAll('div,button')].filter(
        (el) => el.textContent.trim() === ${JSON.stringify(label)} && el.children.length === 0);
      if (!els.length) return null;
      const r = els[els.length - 1].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!box) throw new Error(`no clickable element with text "${label}"`);
    await this.clickAt(box.x, box.y);
    return true;
  }

  async type(text) {
    for (const ch of text) {
      await this.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch });
      await this.send('Input.dispatchKeyEvent', { type: 'keyUp', text: ch });
    }
    await sleep(120);
  }

  /** Setter-based input assignment, so React sees the change. */
  async setInput(index, text) {
    await this.eval(`(() => {
      const el = document.querySelectorAll('input')[${index}];
      if (!el) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, ${JSON.stringify(text)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
  }

  /**
   * Freezes animations so a capture cannot land mid-transition.
   *
   * The deck is meant to be reproducible: a chart or list caught mid-animation
   * would produce slightly different pixels on every run. Navigation replaces
   * the document, so this is called again on each screen.
   */
  async freezeAnimations() {
    await this.eval(`(() => {
      if (document.getElementById('capture-freeze')) return true;
      const style = document.createElement('style');
      style.id = 'capture-freeze';
      style.textContent = '*, *::before, *::after {'
        + ' animation: none !important;'
        + ' transition: none !important;'
        + ' scroll-behavior: auto !important;'
        + ' caret-color: transparent !important; }'
        + ' ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }';
      document.head.appendChild(style);
      return true;
    })()`);
  }

  async screenshot(path, clip) {
    const { data } = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      fromSurface: true,
      clip: clip ? { scale: 1, ...clip } : { x: 0, y: 0, width: this.width, height: this.height, scale: 1 },
    });
    const buffer = Buffer.from(data, 'base64');
    if (path) writeFileSync(path, buffer);
    return buffer;
  }

  /**
   * Serves an origin from Node.
   *
   * Headless Chrome in the development sandbox can only open connections to a
   * couple of localhost ports, so the app's own fetches to the API and to the
   * editor are answered here instead. Interception happens inside the browser,
   * before the network.
   */
  async proxy(origin, { log = false } = {}) {
    this.proxyOrigin = origin;
    this.proxyLog = log;
    this.proxyCookies = '';
    this.on('Fetch.requestPaused', (params) => {
      this.#serve(params).catch((error) => log('proxy', `error: ${error.message}`));
    });
    await this.send('Fetch.enable', {
      patterns: [{ urlPattern: `${origin}/*`, requestStage: 'Request' }],
    });
  }

  /** Session cookies the page has received, for Node-side reads. */
  get cookies() {
    return this.proxyCookies;
  }

  async #serve({ requestId, request }) {
    const url = request.url;
    if (request.method.toUpperCase() === 'OPTIONS') {
      await this.send('Fetch.fulfillRequest', {
        requestId,
        responseCode: 204,
        responseHeaders: corsHeaders(),
      });
      return;
    }

    const headers = {};
    for (const [key, value] of Object.entries(request.headers)) {
      if (['host', 'origin', 'referer', 'content-length', 'connection'].includes(key.toLowerCase())) {
        continue;
      }
      headers[key] = value;
    }
    if (this.proxyCookies) headers.cookie = this.proxyCookies;

    let status = 200;
    let body = Buffer.alloc(0);
    const responseHeaders = {};
    try {
      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.postData ? Buffer.from(request.postData) : undefined,
        redirect: 'manual',
      });
      status = response.status;
      const setCookies = response.headers.getSetCookie?.() ?? [];
      if (setCookies.length) this.proxyCookies = mergeCookies(this.proxyCookies, setCookies);
      for (const [key, value] of response.headers) {
        const lower = key.toLowerCase();
        if (['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie'].includes(lower)) continue;
        if (lower.startsWith('access-control-')) continue;
        responseHeaders[key] = value;
      }
      body = Buffer.from(await response.arrayBuffer());
      if (this.proxyLog) log('proxy', `${request.method} ${url} -> ${status} ${body.length}b`);
    } catch (error) {
      status = 502;
      responseHeaders['content-type'] = 'application/json';
      body = Buffer.from(JSON.stringify({ error: { code: 'PROXY', message: String(error) } }));
      if (this.proxyLog) log('proxy', `FAILED ${request.method} ${url}: ${error.message}`);
    }

    await this.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: status,
      responseHeaders: [
        ...Object.entries(responseHeaders).map(([name, value]) => ({ name, value: String(value) })),
        ...corsHeaders(),
      ],
      body: body.toString('base64'),
    });
  }

  async close() {
    try {
      await this.send('Browser.close', {}, 5000);
    } catch {
      /* already gone */
    }
    try {
      this.ws?.close();
    } catch {
      /* already closed */
    }
  }
}

function corsHeaders() {
  return [
    { name: 'Access-Control-Allow-Origin', value: 'http://localhost:8081' },
    { name: 'Access-Control-Allow-Credentials', value: 'true' },
    { name: 'Access-Control-Allow-Methods', value: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS' },
    { name: 'Access-Control-Allow-Headers', value: 'content-type' },
    { name: 'Access-Control-Max-Age', value: '0' },
  ];
}

function mergeCookies(current, setCookies) {
  const jar = new Map();
  for (const pair of (current ?? '').split('; ').filter(Boolean)) jar.set(pair.split('=')[0], pair);
  for (const cookie of setCookies) {
    const pair = cookie.split(';')[0];
    jar.set(pair.split('=')[0], pair);
  }
  return [...jar.values()].join('; ');
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * Creates the demo account's history through the public API.
 *
 * Weeks run Monday to Sunday, matching how the API buckets a weekly goal. The
 * newest completion of each activity is older than its interval, so the home
 * screen shows a believable mix of queued, pending and completed work.
 */
const SEED = {
  categories: [
    { name: 'Strength', color: '#0072FF' },
    { name: 'Cardio', color: '#08D8FF' },
    { name: 'Mobility', color: '#00D4A8' },
    { name: 'Sport', color: '#A855F7' },
  ],
  activities: [
    { name: 'Back Squat', ticker: 'SQUT', category: 'Strength', interval: 3, goal: 2, days: [0, 2, 4], weeks: 8, skipWeeks: [3] },
    { name: 'Bench Press', ticker: 'BNCH', category: 'Strength', interval: 4, goal: 2, days: [1, 4], weeks: 8, skipWeeks: [1, 5] },
    { name: 'Deadlift', ticker: 'DEAD', category: 'Strength', interval: 7, goal: 1, days: [2], weeks: 8, skipWeeks: [2] },
    { name: '5K Run', ticker: 'RUN5', category: 'Cardio', interval: 2, goal: 3, days: [0, 2, 4, 5], weeks: 8, skipWeeks: [4] },
    { name: 'Rowing Intervals', ticker: 'ROW', category: 'Cardio', interval: 4, goal: 2, days: [1, 3], weeks: 8, skipWeeks: [0, 6] },
    { name: 'Jump Rope', ticker: 'JUMP', category: 'Cardio', interval: 3, goal: 3, days: [0, 3, 5], weeks: 8, skipWeeks: [6] },
    { name: 'Yoga Flow', ticker: 'YOGA', category: 'Mobility', interval: 2, goal: 4, days: [0, 1, 2, 3, 4, 5, 6], weeks: 8, skipWeeks: [2] },
    { name: 'Mobility Routine', ticker: 'MOBL', category: 'Mobility', interval: 1, goal: 4, days: [0, 1, 2, 3, 4, 5], weeks: 8, skipWeeks: [] },
    { name: 'Pickleball', ticker: 'PICK', category: 'Sport', interval: 7, goal: 1, days: [5], weeks: 8, skipWeeks: [1, 6] },
    { name: 'Climbing', ticker: 'CLMB', category: 'Sport', interval: 5, goal: 2, days: [2, 6], weeks: 8, skipWeeks: [3] },
  ],
};

const DAY_MS = 86_400_000;
const dayNumber = (date) =>
  Math.floor(
    Date.UTC(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
    ) / DAY_MS,
  );
const fromDayNumber = (n) => new Date(n * DAY_MS).toISOString().slice(0, 10);
const addDays = (date, days) => fromDayNumber(dayNumber(date) + days);
const weekdayIndex = (date) => (((dayNumber(date) - 4) % 7) + 7) % 7;

/** Deterministic pseudo-random, so repeated runs produce the same history. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function historyDates(activity, today) {
  const dates = [];
  const thisMonday = addDays(today, -weekdayIndex(today));
  for (let week = 0; week < activity.weeks; week++) {
    if (activity.skipWeeks.includes(week)) continue;
    const weekStart = addDays(thisMonday, -week * 7);
    for (const day of activity.days) {
      const date = addDays(weekStart, day);
      if (date > today) continue;
      if (hash(`${activity.name}:${date}`) < 0.12) continue;
      dates.push(date);
    }
  }
  return dates;
}

async function seed(today) {
  let cookies = '';
  const jar = (response) => {
    const set = response.headers.getSetCookie?.() ?? [];
    if (set.length) cookies = mergeCookies(cookies, set);
  };
  const api = async (method, path, body, { attempt = 0, allow = [] } = {}) => {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        origin: APP,
        ...(cookies ? { cookie: cookies } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    jar(response);
    const text = await response.text();
    // The API rate-limits at 200 req/min and the back-fill is request-hungry,
    // so wait out the window rather than failing the run.
    if (response.status === 429 && attempt < 8) {
      log('seed', 'rate limited, waiting 20s');
      await sleep(20000);
      return api(method, path, body, { attempt: attempt + 1, allow });
    }
    if (response.status >= 400) {
      const code = (() => {
        try {
          return JSON.parse(text).error?.code;
        } catch {
          return undefined;
        }
      })();
      if (allow.includes(code)) return undefined;
      fail(`${method} ${path} -> ${response.status} ${text.slice(0, 200)}`);
    }
    try {
      return text ? JSON.parse(text).data : undefined;
    } catch {
      return undefined;
    }
  };

  // Registration first: the account may not exist yet. An existing account is
  // reported as a 500 carrying EMAIL_TAKEN, so the failure is matched on the
  // body rather than the status.
  let userId;
  const registered = await api('POST', '/auth/register', {
    email: DEMO.email,
    password: DEMO.password,
    passwordConfirm: DEMO.password,
  }, { allow: ['EMAIL_TAKEN'] });
  if (registered?.user?.id) {
    userId = registered.user.id;
    log('seed', `registered ${DEMO.email} (id ${userId})`);
  } else {
    const session = await api('POST', '/auth/login', {
      email: DEMO.email,
      password: DEMO.password,
    });
    userId = session?.user?.id;
    log('seed', `reusing ${DEMO.email} (id ${userId})`);
  }
  if (!userId) fail('could not resolve the demo account');

  // Rebuild from scratch: existing activities cascade to their history.
  for (const activity of (await api('GET', `/activities?today=${today}`))?.activities ?? []) {
    await api('DELETE', `/activities/${activity.id}?today=${today}`);
  }
  for (const category of (await api('GET', '/categories/'))?.categories ?? []) {
    await api('DELETE', `/categories/${category.id}`);
  }

  const categoryIds = {};
  for (const category of SEED.categories) {
    categoryIds[category.name] = (await api('POST', '/categories', category)).category.id;
  }

  for (const spec of SEED.activities) {
    const dates = historyDates(spec, today).sort();
    const past = dates.filter((date) => date < today);
    const body = {
      name: spec.name,
      ticker: spec.ticker,
      interval: spec.interval,
      categoryId: categoryIds[spec.category],
      goalTargetPerWeek: spec.goal,
    };
    if (past.length) body.lastDone = past[past.length - 1];
    const { activity } = await api('POST', `/activities?today=${today}`, body);
    for (const date of past.slice(0, -1)) {
      await api('POST', `/activities/${activity.id}/complete?today=${today}`, { date });
    }
    log('seed', `${spec.name}: ${past.length} completions`);
  }

  return { userId, cookies };
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

async function signIn(page, today) {
  await page.viewport(412, 892, 2);
  await page.goto(`${APP}/`, 15000);
  await page.proxy(API);
  await page.goto(`${APP}/login`, 8000);
  await page.tap('input[placeholder="Email"]');
  await page.type(DEMO.email);
  await page.tap('input[placeholder="Password"]');
  await page.type(DEMO.password);
  await page.clickText('Enter');
  await sleep(7000);

  const read = async (path) => {
    const response = await fetch(`${API}${path}`, {
      headers: { cookie: page.cookies, origin: APP },
    });
    return (await response.json())?.data;
  };
  const activities = (await read(`/activities?today=${today}`))?.activities ?? [];
  if (!activities.length) fail('the demo account has no activities');
  const user = await read('/users/current');

  const queued = QUEUED.map((name) => activities.find((a) => a.name === name)?.id).filter(Boolean);
  const goal = activities.find((a) => a.name === GOAL_ACTIVITY) ?? activities[0];

  // Returning-user state: guide already seen, and a queue worth looking at.
  await page.eval(`(() => {
    localStorage.setItem('guide-completed:v1:home', JSON.stringify({ completedAt: Date.now() }));
    localStorage.setItem('activity-queue:v1:${user.user.id}', JSON.stringify(${JSON.stringify(queued)}));
    return true;
  })()`);
  log('capture', `user ${user.user.id}, queued [${queued}], goal ${goal.name} (${goal.id})`);

  return { activities, goalId: goal.id, userId: user.user.id };
}

/** Waits for a screen to finish loading, reloading once if it errored. */
async function settle(page, attempts = 2, timeoutMs = 25000) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const text = await page.eval('document.body.innerText');
      if (/Unable to load|Please try again/.test(text)) break;
      if (text.trim().length > 40) return;
      await sleep(500);
    }
    if (attempt < attempts - 1) {
      log('capture', 'screen did not load, retrying');
      await page.eval('location.reload()');
      await sleep(4000);
    }
  }
  fail('a screen never finished loading');
}

/** Scrolls the app's main scroll container, returns where it ended up. */
async function scrollApp(page, delta) {
  const result = await page.eval(`(() => {
    const candidates = [...document.querySelectorAll('div')].filter((el) => {
      const style = getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll')
        && el.scrollHeight > el.clientHeight + 2;
    });
    if (!candidates.length) return null;
    const el = candidates.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    el.scrollTop = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + ${delta}));
    return { top: Math.round(el.scrollTop), max: Math.round(el.scrollHeight - el.clientHeight) };
  })()`);
  await sleep(900);
  return result;
}

/**
 * Selects one activity's filter pill, so the insights chart plots a single
 * series instead of every activity the account has.
 */
async function selectActivity(page, name) {
  const clicked = await page.eval(`(() => {
    const pill = [...document.querySelectorAll('[role="button"][aria-label]')].find(
      (el) => el.getAttribute('aria-label') === ${JSON.stringify(name)});
    if (!pill) return false;
    const r = pill.getBoundingClientRect();
    window.__pillCentre = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    return true;
  })()`);
  if (!clicked) fail(`no filter pill for "${name}" on the insights screen`);
  const centre = await page.eval('window.__pillCentre');
  await page.clickAt(centre.x, centre.y);
  await sleep(1200);
}

/** Fills the New Activity form so the slide shows a real, complete example. */
async function fillCreateForm(page) {
  await page.tap('input[placeholder="Squat"]');
  await page.type('Goblet Squat');
  await page.tap('input[placeholder="TCKR"]');
  await page.type('GOBL');
  await page.setInput(2, '3');
  await page.clickText('Choose a Category');
  await sleep(700);
  await page.clickText('Strength');
  await sleep(500);
  await page.clickText('No goal');
  await sleep(700);
  await page.clickText('3 Times Per Week');
  await sleep(700);
  await scrollApp(page, -1e6);
}

async function captureScreens(page, deck, session, outDir) {
  mkdirSync(outDir, { recursive: true });
  await page.viewport(deck.view.w, deck.view.h, deck.view.scale);

  for (const screen of SCREENS) {
    if (screen.file === '06-goal-cadence') continue; // shot by captureCadence
    const route = screen.route.replace('{goal}', session.goalId);
    await page.goto(`${APP}${route}`, screen.waitMs ?? 7000);
    await page.freezeAnimations();
    await settle(page);
    if (screen.fillCreateForm) await fillCreateForm(page);
    if (screen.filterActivity) await selectActivity(page, screen.filterActivity);
    if (screen.scrollAfter) await scrollApp(page, screen.scrollAfter);

    const file = join(outDir, `${screen.file}.png`);
    await page.screenshot(file);
    log('capture', `${deck.id} ${screen.file}.png`);
  }
}

/**
 * The cadence slide: a window with the device frame's own aspect ratio, taken
 * from the top of the goal page once the cadence card has been brought up.
 *
 * At phone width that card falls below the fold, so the in-screen back row and
 * the performance chart are hidden inside this one capture. It is the only
 * place a screenshot differs from what the app renders unaided.
 */
async function captureCadence(page, deck, session, outDir) {
  await page.viewport(deck.tall.w, deck.tall.h, deck.view.scale);
  await page.goto(`${APP}/goals/${session.goalId}`, 7000);
  await page.freezeAnimations();
  await settle(page);

  // The window starts at the app's own header, so the capture keeps the nav bar
  // and the tab bar like every other screen. Trimming the back row and the
  // performance chart is what lifts the cadence card into that window.
  const clip = await page.eval(`(() => {
    const style = document.createElement('style');
    style.textContent = '[data-capture-hidden] { display: none !important; }';
    document.head.appendChild(style);
    const hide = (label) => {
      const el = [...document.querySelectorAll('div')].find(
        (d) => d.textContent.trim() === label && d.children.length === 0);
      el?.closest('div')?.parentElement?.setAttribute('data-capture-hidden', '1');
    };
    hide('Goal Insights');
    hide('Performance');

    const root = document.getElementById('root') || document.body;
    const region = root.getBoundingClientRect();
    // The frame's inner-screen ratio, taken from the viewport this deck is shot
    // at. Clamped to the page: a clip that runs past it comes back white.
    const ratio = ${(deck.tall.h / deck.tall.w).toFixed(6)};
    const height = Math.min(region.height, region.width * ratio);
    return {
      x: Math.round(region.left),
      y: Math.round(region.top),
      width: Math.round(region.width),
      height: Math.round(height),
    };
  })()`);
  if (!clip) fail('could not lay out the cadence capture');
  await sleep(600);

  await page.screenshot(join(outDir, '06-goal-cadence.png'), clip);
  log('capture', `${deck.id} 06-goal-cadence.png`);
}

// ---------------------------------------------------------------------------
// Export through the editor
// ---------------------------------------------------------------------------

async function exportDecks(page, deckList) {
  const exportsDir = join(ROOT, 'exports');
  mkdirSync(exportsDir, { recursive: true });
  await page.viewport(1600, 1200, 1);
  await page.goto(`${EDITOR}/`, 6000);
  await page.proxy(EDITOR);

  for (const deck of deckList) {
    await page.goto(`${EDITOR}/?device=${deck.id}&slide=0`, 12000);
    await sleep(3500);

    // The editor hands its bundle to an object URL; read it back out of the
    // page, since Chrome cannot download to a directory we choose.
    await page.eval(`(() => {
      window.__bundle = null;
      const create = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        const reader = new FileReader();
        reader.onload = () => { window.__bundle = reader.result; };
        reader.readAsDataURL(blob);
        return create(blob);
      };
      return true;
    })()`);
    await page.waitForText('Export bundle');
    await page.clickContaining('Export bundle');

    let bundle = null;
    for (let attempt = 0; attempt < 150 && !bundle; attempt++) {
      await sleep(2000);
      bundle = await page.eval('window.__bundle');
    }
    if (!bundle) fail(`the editor produced no bundle for ${deck.id}`);
    const base64 = String(bundle).replace(/^data:.*?;base64,/, '');
    writeFileSync(join(exportsDir, `kadence-${deck.id}.zip`), Buffer.from(base64, 'base64'));
    log('export', `kadence-${deck.id}.zip`);
  }
}

/** Writes the decks to exports/png/<deck>/ at their Play-required sizes. */
function unpackDeck(deck, exportsDir) {
  const work = mkdtempSync(join(tmpdir(), 'kadence-unzip-'));
  try {
    run('unzip', ['-q', '-o', join(exportsDir, `kadence-${deck.id}.zip`), '-d', work]);
    const source = join(work, 'android', deck.id, deck.size, 'en');
    const target = join(exportsDir, 'png', deck.outDir);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    for (const name of readdirNames(source)) {
      writeFileSync(join(target, name), readFileSync(join(source, name)));
    }
    log('export', `${deck.outDir}/ (${readdirNames(target).length} PNGs)`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function readdirNames(dir) {
  return execFileSync('ls', [dir]).toString().trim().split('\n').filter(Boolean);
}

/** Checks the finished PNGs are the sizes Play requires. */
function verify(exportsDir, deckList) {
  const expected = { android: '1080x1920', 'android-7': '1200x1920', 'android-10': '1600x2560' };
  let checked = 0;
  for (const deck of deckList) {
    if (!deck.folder) continue;
    const dir = join(exportsDir, 'png', deck.outDir);
    const files = readdirNames(dir);
    if (files.length !== 8) fail(`${deck.outDir} has ${files.length} PNGs, expected 8`);
    for (const name of files) {
      const buffer = readFileSync(join(dir, name));
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      const actual = `${width}x${height}`;
      if (actual !== expected[deck.id]) fail(`${name} is ${actual}, expected ${expected[deck.id]}`);
      checked += 1;
    }
  }
  const graphic = join(exportsDir, 'png', 'feature-graphic-1024x500', '01-feature-graphic.png');
  if (existsSync(graphic)) {
    const buffer = readFileSync(graphic);
    if (`${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}` !== '1024x500') {
      fail('the feature graphic is not 1024x500');
    }
    checked += 1;
  }
  log('verify', `${checked} PNGs at the required sizes`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

process.on('SIGINT', () => {
  shuttingDown = true;
  stopServers();
  process.exit(130);
});

log('boot', 'checking services');
if (!(await isUp(`${API}/`))) {
  startServer('api', 'pnpm', ['run', 'start:dev'], BACK_END);
}
if (!(await isUp(`${APP}/`))) {
  startServer('expo-web', 'npx', ['--no-install', 'expo', 'start', '--web', '--port', '8081'], FRONT_END);
}
if (!(await isUp(`${EDITOR}/`))) {
  startServer('editor', 'npx', ['--no-install', 'next', 'dev', '-p', '3456', '-H', '0.0.0.0'], ROOT);
}
await waitFor(`${API}/`, 'the API');
await waitFor(`${APP}/`, 'the Expo web server', 240000);
await waitFor(`${EDITOR}/`, 'the editor');

const browser = await startBrowser();
try {
  const page = await browser.connect();

  // A real page must be loaded before anything is evaluated: Chrome here answers
  // no `Runtime.evaluate` on about:blank, nor while the app is showing its
  // connection-error screen. The API is therefore proxied from the start.
  await page.goto(`${APP}/login`, 20000);
  await page.proxy(API);
  await page.goto(`${APP}/login`, 8000);

  // The app derives every date from the device's own calendar, so the seed must
  // use the browser's date rather than the host's or UTC's.
  const today = await page.eval(`new Date().toLocaleDateString('en-CA')`);
  log('boot', `browser date ${today}`);

  if (!SKIP_SEED) {
    await seed(today);
  } else {
    log('seed', 'skipped');
  }

  await page.goto(`${APP}/`, 12000);
  await page.proxy(API);
  const session = await signIn(page, today);

  const capturesDir = mkdtempSync(join(tmpdir(), 'kadence-captures-'));
  const screensDir = join(ROOT, 'public', 'screenshots');
  try {
    for (const deck of decks) {
      if (!deck.folder) continue;
      await captureScreens(page, deck, session, capturesDir);
      await captureCadence(page, deck, session, capturesDir);
      // Install straight into the deck the editor reads.
      const target = join(screensDir, deck.folder, 'en');
      rmSync(target, { recursive: true, force: true });
      mkdirSync(target, { recursive: true });
      for (const name of readdirNames(capturesDir)) {
        writeFileSync(join(target, name), readFileSync(join(capturesDir, name)));
      }
      // Keep every capture, including any the deck does not use.
      const raw = join(screensDir, 'raw', deck.id);
      rmSync(raw, { recursive: true, force: true });
      mkdirSync(raw, { recursive: true });
      for (const name of readdirNames(target)) {
        writeFileSync(join(raw, name), readFileSync(join(target, name)));
      }
    }
  } finally {
    rmSync(capturesDir, { recursive: true, force: true });
  }

  await exportDecks(page, decks);
} finally {
  await browser.close();
}

const exportsDir = join(ROOT, 'exports');
for (const deck of decks) unpackDeck(deck, exportsDir);
verify(exportsDir, decks);

stopServers();
log('done', `${decks.length} decks regenerated in ${((Date.now() - started) / 1000).toFixed(0)}s`);
process.exit(0);
