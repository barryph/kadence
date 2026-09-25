# Kadence - Google Play screenshots

The store listing deck for Kadence: eight phone screenshots, matching 7" and 10"
tablet decks, and a 1024x500 feature graphic. Android only.

## Regenerate everything

One command rebuilds the whole image set from the app as it is right now:

```bash
pnpm install     # first time only
pnpm run generate
```

It takes about seven minutes and needs nothing else running: the script checks
Postgres, the API (`:3000`) and the editor (`:3456`), starts whatever is missing,
seeds the demo account, captures every screen on all three viewports, exports the
branded decks, and unpacks them. Run it whenever the app's UI changes.

Outputs, all overwritten on each run:

| Path | What it is |
| --- | --- |
| `exports/png/` | The finished PNGs, ready to upload. Phone 1080x1920, 7" 1200x1920, 10" 1600x2560, feature graphic 1024x500. |
| `exports/*.zip` | The same decks exactly as the editor's **Export bundle** produces them, one zip per device. |
| `public/screenshots/<deck>/en/` | The app captures the deck is built from. |
| `public/screenshots/raw/<deck>/` | The same captures, kept separately so a deck can be re-pointed without re-shooting. |

Run it twice and the PNGs are byte-identical: animations and transitions are
frozen during capture, and the seed is deterministic.

Useful flags:

| Flag | Effect |
| --- | --- |
| `--skip-seed` | Keep the account's existing history (about 30s faster). |
| `--only=android,android-7` | Capture and export a subset of decks. |
| `--keep-servers` | Leave any server this run started running. |

`pnpm run generate` never writes to the app or its own deck definition, so it is
safe to run at any time, including on a dirty working tree.

## Edit the deck

```bash
pnpm dev         # http://localhost:3456
```

The editor auto-saves to `app-store-screenshots.json` (copy, layouts, per-element
placement, theme). Edit there, then press **Export bundle** - or re-run
`pnpm run generate`, which does not touch the copy you edited.

Deep links help while reviewing: `?device=android-10&slide=4` opens that deck and
screen directly. The `iphone` and `ipad` decks are intentionally empty; this
listing is Play only.

## The deck

| # | Layout | Label and headline | Screen shown |
| --- | --- | --- | --- |
| 1 | two devices | QUEUE WORKFLOW / Training that fits **real life.** | Activities Center: Queued, Pending, Completed |
| 2 | device bottom | INTERVAL SCHEDULING / Choose your **own rhythm.** | New Activity form: repeat frequency, weekly target |
| 3 | device top | WEEKLY GOALS / Set a weekly **target.** | Goals list with per-activity progress |
| 4 | device bottom | ADHERENCE / See what you **actually do.** | Goal Insights: performance over 8 weeks |
| 5 | device bottom | CADENCE / Watch the **pattern build.** | Adherence ring and weekly heatmap |
| 6 | hero | INSIGHTS / Your week, **one chart.** | Activity Insights: logged days per week |
| 7 | device top | CALENDAR / Every rep, **logged.** | Month grid, one row per activity |
| 8 | no device | BUILT FOR REAL LIFE / Your week, **your rules.** | Feature wall |

Theme `deep-space` (`src/lib/constants.ts`) mirrors the app's own tokens: a
near-black navy gradient with an electric blue to cyan bloom, film grain, and the
cyan accent on the last line of every headline.

## How generation works

`tools/generate.mjs` is the whole pipeline. It drives headless Chrome over the
DevTools Protocol, because Chrome in this development sandbox can only open
connections to a couple of localhost ports: the API and the editor are served to
the page from Node through CDP request interception instead. On a normal machine
that indirection is unnecessary.

- Each deck is captured at the CSS viewport whose aspect ratio equals its device
  frame's *inner screen* - not the frame's outer size, and not Play's screenshot
  size. Rendering at the inner-screen ratio is what puts the capture edge to edge
  inside the bezel, with no letterbox around the app's dark tab bar.
- Ids (account, activities, goal page) are resolved from the live API, so a
  reseed cannot stale them, and the run never writes to the account.
- Every screen waits to settle, and reloads once if it landed on an error or
  spinner, so a run cannot silently ship an error screen.
- The cadence slide is a focused slice of the goal page. At phone width its card
  sits below the fold, so the in-screen back row and the performance chart are
  hidden inside that one capture - the only place a screenshot differs from what
  the app renders unaided.
- The seed dates its history to the **browser's** local calendar date, which is
  the date the app itself sends; the host's date or UTC would disagree.
- The API rate-limits at 200 req/min, so the history back-fill backs off and
  retries rather than failing.

## Demo account

| | |
| --- | --- |
| Email | `kadence.demo@gmail.com` |
| Password | held outside the repo (see the handover notes) |
| Data | Strength / Cardio / Mobility / Sport categories, 10 activities with 1-7 day intervals and weekly targets, 8 weeks of completion history |

## Editor reference

- **Connected canvas** (`src/components/editor/`) - screens sit on one horizontal
  canvas, so elements can cross screen boundaries and export as split crops. The
  toolbar toggles Connected / Isolated.
- **Device frames** (`src/components/editor/device-frames.tsx`) - iPhone PNG
  mockup, iPad, Android phone, Android tablets, feature graphic. Frames use
  `objectFit: fill`, which is safe because captures are taken at the frame's own
  inner-screen ratio.
- **Custom theme** - `deep-space` in `src/lib/constants.ts`, plus the bloom and
  grain layers in `slide-canvas.tsx`.
- **Export** - `html-to-image` at every Play-required size; each bundle covers
  `locales x sizes x screens`.
- **`build_deck.py`** - regenerates `app-store-screenshots.json` from the slide
  list in the script. Optional: the editor is the source of truth once you have
  edited copy there.
- `/api/upload` hashes dropped files into `public/screenshots/uploaded/`. Commit
  that folder and `app-store-screenshots.json` together to keep a deck portable.
