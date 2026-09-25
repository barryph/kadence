#!/usr/bin/env node
/**
 * Fills an account with a realistic routine and completion history so the app
 * can be shown with live data.
 *
 * Everything goes through the public API - the same endpoints the app calls -
 * so the account ends up looking exactly like one a user built by hand.
 *
 * The history is rebuilt relative to the local calendar date of the run, so
 * countdowns, this-week goal progress and the activity heatmap all land on
 * "today" whatever day the demo happens. Re-run it on the day of a demo to
 * refresh the data.
 *
 * If the account already exists (a run in the past), the script asks before
 * deleting it and creating it again. Pass `--yes` to answer that question up
 * front when running non-interactively.
 *
 * Usage:
 *   pnpm run db:seed:demo
 *   pnpm run db:seed:demo -- --yes
 *   API_BASE=http://localhost:3001 DEMO_EMAIL=me@example.com pnpm run db:seed:demo
 *
 * Env:
 *   API_BASE       API origin (default http://localhost:3000)
 *   DEMO_EMAIL     account email (default kadence.demo@gmail.com)
 *   DEMO_PASSWORD  account password (default KadenceDemo2026!)
 *   TODAY          override "today", YYYY-MM-DD (default: local calendar date)
 *   DEMO_RECREATE  set to 1/true/yes to delete and recreate without asking
 */
import process from 'node:process';

const BASE = (process.env.API_BASE || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const DEMO = {
  email: process.env.DEMO_EMAIL || 'kadence.demo@gmail.com',
  password: process.env.DEMO_PASSWORD || 'KadenceDemo2026!',
};

const USAGE = `Usage: pnpm run db:seed:demo [-- --yes]

  --yes, -y   delete an existing demo account without asking

Env: API_BASE, DEMO_EMAIL, DEMO_PASSWORD, TODAY, DEMO_RECREATE`;

const ASSUME_YES =
  process.argv.includes('--yes') ||
  process.argv.includes('-y') ||
  /^(1|true|yes)$/i.test(process.env.DEMO_RECREATE ?? '');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}

// --- HTTP ------------------------------------------------------------------
// A cookie jar, because the API authenticates with a session cookie and the
// whole flow (register, sign in, delete, re-register) rides on it.

const cookies = new Map();

function storeCookies(response) {
  for (const cookie of response.headers.getSetCookie?.() ?? []) {
    const [pair] = cookie.split(';');
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    // A cleared cookie arrives with an empty value and an expiry in the past.
    if (value === '') cookies.delete(name);
    else cookies.set(name, value);
  }
}

function cookieHeader() {
  return [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
}

class ApiError extends Error {
  constructor(method, path, status, body) {
    super(
      `${method} ${path} -> ${status} ${
        typeof body === 'string' ? body : JSON.stringify(body ?? '')
      }`.trim(),
    );
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.code = body?.error?.code;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The API rate-limits at 200 req/min per client; history is request-hungry. */
const RATE_LIMIT_RETRIES = 6;

async function api(method, path, body) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(cookies.size ? { cookie: cookieHeader() } : {}),
        origin: 'http://localhost:8081',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    storeCookies(response);
    const text = await response.text();
    let json;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }

    if (response.status === 429 && attempt < RATE_LIMIT_RETRIES) {
      // The throttle window is 60s; prefer the server's own Retry-After hint.
      const retryAfter = Number(response.headers.get('retry-after'));
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter, 60) * 1000 + 500
          : 20_000;
      console.log(
        `    rate limited, waiting ${Math.round(waitMs / 1000)}s for the window to pass`,
      );
      await sleep(waitMs);
      continue;
    }
    if (!response.ok) {
      throw new ApiError(method, path, response.status, json ?? text);
    }
    return json?.data;
  }
}

// --- Dates -----------------------------------------------------------------
// Calendar dates are opaque YYYY-MM-DD strings owned by the device, exactly as
// the API treats them. Day maths happens on UTC day numbers purely as an
// integer calendar; no timezone is ever applied to the value.

const DAY_MS = 86_400_000;

const toDayNumber = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
};

const fromDayNumber = (dayNumber) => {
  const date = new Date(dayNumber * DAY_MS);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
};

const addDays = (date, days) => fromDayNumber(toDayNumber(date) + days);

/** Monday = 0 ... Sunday = 6 */
const weekdayIndex = (date) =>
  (((toDayNumber(date) - 4) % 7) + 7) % 7;

/**
 * Today as this machine's local calendar date. `toISOString().slice(0, 10)`
 * would answer with the UTC day, which is the wrong day for part of every day
 * outside UTC - and the whole point is that the data matches the demo's day.
 */
function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const TODAY = process.env.TODAY || localToday();

if (!/^\d{4}-\d{2}-\d{2}$/.test(TODAY)) {
  console.error(`TODAY must be YYYY-MM-DD, got "${TODAY}"`);
  process.exit(1);
}

// --- Demo data -------------------------------------------------------------

const CATEGORIES = [
  { name: 'Strength', color: '#0072FF' },
  { name: 'Cardio', color: '#08D8FF' },
  { name: 'Mobility', color: '#00D4A8' },
  { name: 'Sport', color: '#A855F7' },
];

/**
 * The demo athlete's routine.
 *
 * `days` are the weekday indexes (Mon = 0) the activity is normally done on and
 * only shape the generated history. `goal` is the weekly target the app
 * advertises. `interval` is the repeat cadence in days. `dueInDays` is the
 * countdown the Activities screen should show, and it drives the most recent
 * completion: `lastDone = today + dueInDays - interval`. A positive value is
 * "due in N days", 0 is "due today", `interval` itself means "done today", and
 * a negative value is overdue (the API clamps the countdown at 0, so it reads
 * as due now).
 *
 * `skipWeeks` drops whole past weeks so adherence rings are realistic rather
 * than a perfect 100%. Week 0 is the current (partial) week.
 */
const ACTIVITIES = [
  { name: 'Back Squat', ticker: 'SQUT', category: 'Strength', interval: 3, goal: 2, days: [0, 2, 4], dueInDays: 1, weeks: 8, skipWeeks: [3] },
  { name: 'Bench Press', ticker: 'BNCH', category: 'Strength', interval: 4, goal: 2, days: [1, 4], dueInDays: 4, weeks: 8, skipWeeks: [1, 5] },
  { name: 'Deadlift', ticker: 'DEAD', category: 'Strength', interval: 7, goal: 1, days: [2], dueInDays: 3, weeks: 8, skipWeeks: [2] },
  { name: '5K Run', ticker: 'RUN5', category: 'Cardio', interval: 2, goal: 3, days: [0, 2, 4, 5], dueInDays: 0, weeks: 8, skipWeeks: [4] },
  { name: 'Rowing Intervals', ticker: 'ROW', category: 'Cardio', interval: 4, goal: 2, days: [1, 3], dueInDays: -1, weeks: 8, skipWeeks: [6] },
  { name: 'Jump Rope', ticker: 'JUMP', category: 'Cardio', interval: 3, goal: 3, days: [0, 3, 5], dueInDays: 2, weeks: 8, skipWeeks: [6] },
  { name: 'Yoga Flow', ticker: 'YOGA', category: 'Mobility', interval: 2, goal: 4, days: [0, 1, 2, 3, 5, 6], dueInDays: 2, weeks: 8, skipWeeks: [2] },
  { name: 'Mobility Routine', ticker: 'MOBL', category: 'Mobility', interval: 1, goal: 4, days: [0, 1, 2, 3, 4], dueInDays: 0, weeks: 8, skipWeeks: [] },
  { name: 'Pickleball', ticker: 'PICK', category: 'Sport', interval: 7, goal: 1, days: [5], dueInDays: 3, weeks: 8, skipWeeks: [1, 6] },
  { name: 'Climbing', ticker: 'CLMB', category: 'Sport', interval: 5, goal: 2, days: [2, 6], dueInDays: -2, weeks: 8, skipWeeks: [3] },
];

/**
 * Share of scheduled days dropped from the history. Small enough that most
 * goals are still met, large enough that the charts and adherence rings are not
 * suspiciously perfect.
 */
const DROPPED_DAY_CHANCE = 0.08;

/**
 * Deterministic pseudo-random in [0, 1) so repeated runs build the same
 * history. FNV-1a plus a murmur3 finalizer: without the avalanche step the raw
 * FNV value clusters near 0 and 1 for dates that share a prefix, which would
 * drop or keep whole runs of scheduled days instead of scattering them.
 */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Every date the activity was completed, ending on `lastDone`.
 *
 * Walks the routine's weekday schedule backwards over `weeks` weeks, skipping
 * dropped weeks and dropping the odd day (~8%) so charts are not a perfect
 * staircase, then guarantees `lastDone` is the most recent completion.
 */
function historyDates(activity, lastDone) {
  const dates = new Set();
  const thisMonday = addDays(TODAY, -weekdayIndex(TODAY));

  for (let week = 0; week < activity.weeks; week++) {
    if (activity.skipWeeks.includes(week)) continue;
    const weekStart = addDays(thisMonday, -week * 7);
    for (const dayIndex of activity.days) {
      const date = addDays(weekStart, dayIndex);
      if (date > lastDone) continue;
      if (hash(`${activity.name}:${date}`) < DROPPED_DAY_CHANCE) continue;
      dates.add(date);
    }
  }
  dates.add(lastDone);

  return [...dates].sort();
}

// --- Account ---------------------------------------------------------------

/**
 * Prompts for one line of input and resolves with whatever was entered.
 * Resolves with an empty string when stdin ends without an answer, so a
 * non-interactive run (no TTY, no piped input) can never hang waiting for one.
 */
function readLine(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    let buffer = '';

    const cleanup = () => {
      process.stdin.off('data', onData);
      process.stdin.off('end', onEnd);
      process.stdin.pause();
    };
    const onData = (chunk) => {
      buffer += chunk;
      const newline = buffer.indexOf('\n');
      if (newline === -1) return;
      cleanup();
      resolve(buffer.slice(0, newline));
    };
    const onEnd = () => {
      cleanup();
      resolve(buffer);
    };

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.resume();
  });
}

async function confirmRecreate() {
  const interactive = Boolean(process.stdin.isTTY);
  if (!interactive) {
    console.log(
      '    (stdin is not a terminal; pass --yes to skip this prompt)',
    );
  }
  const answer = await readLine(`Delete and recreate ${DEMO.email}? [y/N] `);
  // A piped answer is not echoed, so start the next line ourselves.
  if (!interactive) process.stdout.write('\n');
  const normalized = answer.trim().toLowerCase();
  return normalized === 'y' || normalized === 'yes';
}

async function register() {
  try {
    const registered = await api('POST', '/auth/register', {
      email: DEMO.email,
      password: DEMO.password,
      passwordConfirm: DEMO.password,
    });
    const userId = registered?.user?.id;
    if (!userId) throw new Error('registration returned no user id');
    return userId;
  } catch (error) {
    if (error instanceof ApiError && error.code === 'EMAIL_TAKEN') {
      throw new Error(
        `${DEMO.email} already exists but its password is not DEMO_PASSWORD, ` +
          'so this script cannot sign in to recreate it. Delete the account ' +
          'manually (or set DEMO_PASSWORD) and run again.',
      );
    }
    throw error;
  }
}

/** Returns the signed-in user id, or null when the credentials do not match. */
async function signIn() {
  try {
    const session = await api('POST', '/auth/login', {
      email: DEMO.email,
      password: DEMO.password,
    });
    return session?.user?.id ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/**
 * Resolves the account to seed, creating it when absent. When it already
 * exists the user decides whether to replace it; declining leaves it untouched
 * and returns null so nothing is written.
 */
async function resolveAccount() {
  const existingUserId = await signIn();

  if (!existingUserId) {
    const userId = await register();
    console.log(`created account ${DEMO.email} (${userId})`);
    return userId;
  }

  console.log(`account ${DEMO.email} already exists (${existingUserId})`);
  const confirmed = ASSUME_YES || (await confirmRecreate());
  if (!confirmed) {
    console.log('kept the existing account; nothing was changed.');
    return null;
  }

  await api('DELETE', '/account');
  cookies.clear();
  console.log('deleted the existing account');

  const userId = await register();
  console.log(`recreated account ${DEMO.email} (${userId})`);
  return userId;
}

// --- Seeding ---------------------------------------------------------------

async function seedCategories() {
  const ids = {};
  for (const category of CATEGORIES) {
    const created = await api('POST', '/categories', category);
    ids[category.name] = created.category.id;
  }
  console.log(`categories: ${CATEGORIES.map((c) => c.name).join(', ')}`);
  return ids;
}

/** Human wording for a countdown; negative means the activity is overdue. */
function describeDue(dueInDays) {
  if (dueInDays === 0) return 'due today';
  return dueInDays > 0 ? `due in ${dueInDays}d` : `overdue ${-dueInDays}d`;
}

async function seedActivities(categoryIds) {
  for (const activity of ACTIVITIES) {
    const lastDone = addDays(TODAY, activity.dueInDays - activity.interval);
    const dates = historyDates(activity, lastDone);

    const created = await api('POST', `/activities?today=${TODAY}`, {
      name: activity.name,
      ticker: activity.ticker,
      interval: activity.interval,
      categoryId: categoryIds[activity.category],
      goalTargetPerWeek: activity.goal,
      // `lastDone` records the newest completion; the rest are added below.
      lastDone,
    });
    const id = created.activity.id;

    for (const date of dates) {
      if (date === lastDone) continue;
      await api('POST', `/activities/${id}/complete?today=${TODAY}`, { date });
    }

    console.log(
      `  ${activity.name.padEnd(17)} ${describeDue(activity.dueInDays).padEnd(12)} ` +
        `last ${lastDone}  ${String(dates.length).padStart(2)} completions`,
    );
  }
}

// --- Verification ----------------------------------------------------------

async function verify() {
  const { activities } = await api('GET', `/activities?today=${TODAY}`);
  console.log('\nactivities as the app will show them:');
  for (const activity of activities) {
    const goal = activity.goal
      ? `${activity.goalProgress?.currentWeekCount ?? 0}/${activity.goal.targetPerWeek} this week`
      : 'no goal';
    console.log(
      `  ${activity.name.padEnd(17)} due in ${String(activity.daysUntil).padStart(2)}d  ${goal}`,
    );
  }

  const { goals } = await api('GET', `/goals?today=${TODAY}`);
  console.log('\nweekly goals:');
  for (const goal of goals) {
    console.log(
      `  ${goal.activityName.padEnd(17)} ${goal.currentWeekCount}/${goal.targetPerWeek}`,
    );
  }
}

// --- Entry point -----------------------------------------------------------

async function main() {
  console.log(`seeding demo data for ${TODAY} via ${BASE}`);
  const userId = await resolveAccount();
  if (!userId) return;

  const categoryIds = await seedCategories();
  await seedActivities(categoryIds);
  await verify();

  console.log(`\nready: sign in as ${DEMO.email} / ${DEMO.password}`);
}

try {
  await main();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`\nfailed: ${error.message}`);
  } else if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
    console.error(
      `\ncould not reach the API at ${BASE}. Start it first ` +
        '(cd back-end && pnpm run start:dev).',
    );
  } else {
    console.error(
      `\nfailed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  process.exitCode = 1;
}
