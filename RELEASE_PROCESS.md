# Release Process

Kadence ships as an Expo app (EAS Build → Google Play) plus the NestJS backend
at `https://kadence.barryph.com`. iOS has never been built and is not a release
target yet.

Legend: **[R]** every release · **[C]** only if that thing changed · **[1x]**
one-time setup.

## 1. Before the build

- [ ] **[R]** All changes merged to `main`, CI green for `back-end` and `front-end`.
- [ ] **[R]** Confirm production backend is up: `curl -sS https://kadence.barryph.com/` → `Hello World!`.
- [ ] **[C]** Backend changed: deploy it and confirm the revision is live. Do this **before** submitting the app.
- [ ] **[C]** New migration in `back-end/src/shared/knex/migrations/`: apply it. Migrations do not run at API startup.
      ```
      cd back-end
      pnpm exec knex migrate:latest --knexfile knexfile.ts
      pnpm exec knex migrate:list --knexfile knexfile.ts   # verify
      ```
- [ ] **[C]** Account-deletion site changed: redeploy `kadence-static` and re-check `CORS_ORIGINS`.
- [ ] **[R]** Clean working tree on the commit you intend to ship.

## 2. Version

- [ ] **[R]** Decide the marketing version (currently `"1.0.0"` in `front-end/app.json`). **[C]** Edit and commit only when users should see a new version.
- [ ] **[R]** Do **not** touch the Android build number. `eas.json` uses `appVersionSource: "remote"` + `autoIncrement: true`, so EAS increments `versionCode` itself. Check it with:
      ```
      cd front-end
      eas build:version:get --platform android --profile production
      ```
      Current production `versionCode` is 3, so the next build is 4. Never lower it.

## 3. Check

- [ ] **[R]** Frontend:
      ```
      cd front-end
      pnpm run typecheck && pnpm run lint && pnpm test && pnpm run test:timezones
      ```
- [ ] **[R]** Backend (Docker required for the last two):
      ```
      cd back-end
      pnpm run typecheck && pnpm run lint:check && pnpm run test:unit
      pnpm run test:integration && pnpm run test:e2e
      ```
- [ ] **[C]** Auth changed: verify Google Sign-In on a real device.
- [ ] **[C]** `app.config.ts` / `app.json` / `front-end/firebase/` changed: check the resolved config:
      ```
      cd front-end
      eas config --profile production --platform android
      ```
      Expect `package` = `com.codecompletelabs.kadence`, `googleServicesFile` = `./firebase/android/google-services.json`, `extra.appVariant` = `production`.

## 4. Build

- [ ] **[R]** Confirm the EAS production env still has its variables: `eas env:list --environment production` (must include `EXPO_PUBLIC_SERVER_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; `EXPO_PUBLIC_*` is inlined at build time and cannot be fixed later).
- [ ] **[R]** Build, then wait for `Status: finished` and download the `.aab`:
      ```
      cd front-end
      eas build --profile production --platform android
      ```

## 5. Submit and roll out

- [ ] **[R]** Play Console → **Kadence** → **Test and release** → **Production** → **Create new release**, upload the `.aab`, confirm the versionCode.
- [ ] **[R]** Read the pre-launch report; fix any crash or ANR before rolling out.
- [ ] **[C]** Data collection, permissions, or policy text changed: update Play **Data safety** and `PRIVACY_POLICY.md`.
- [ ] **[R]** Confirm the account-deletion URL on the Play listing still completes a deletion, and that in-app delete-account still works.
- [ ] **[C]** Listing assets changed: update screenshots and "What's new".
- [ ] **[R]** Roll out to **internal testing**, smoke register/login/logout/password reset/activity/timeline/profile/delete-account, then promote to a **staged production rollout** (10–20%).
- [ ] **[R]** Watch Play crashes/ANRs and Firebase Crashlytics. If clean, raise to 100%.

## 6. If the release fails

There is no OTA channel and no way to lower a `versionCode`, so recovery is
always a new higher build.

- [ ] **[R]** Halt the rolled-out release in Play Console.
- [ ] **[C]** Backend is the cause: roll the backend back to the previous revision.
- [ ] **[R]** Revert the bad commit on `main` via a PR.
- [ ] **[R]** Fix, re-run step 3, `eas build --profile production --platform android`, submit, and resume a staged rollout. Do not reuse the failed versionCode.

## Setup (do once)

- [ ] **[1x]** `eas login`, `eas-cli` ≥ 18.11.0.
- [ ] **[1x]** Play Console access to `com.codecompletelabs.kadence`; Play service-account JSON if you want `eas submit` instead of manual upload.
- [ ] **[1x]** Google Cloud OAuth clients for `com.codecompletelabs.kadence` and the EAS signing SHA-1 (`eas credentials`). `back-end/docs/oauth-sign-in.md` still says `com.barryph.kadence` — verify which the client actually uses.
- [ ] **[1x]** EAS production environment variables `EXPO_PUBLIC_SERVER_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (already set; `preview` too).
- [ ] **[1x]** Backend production env: `RESEND_API_KEY`, `GOOGLE_SERVER_CLIENT_IDS`, `CORS_ORIGINS`, `ACCOUNT_DELETION_SITE_URL` — see `back-end/.env.example`.
- [ ] **[1x]** Account-deletion site (`kadence-static`) deployed with `PUBLIC_API_BASE_URL` set.

See `back-end/docs/oauth-sign-in.md`, `transactional-email.md`, and
`external-account-deletion.md` for the configuration those pieces need.
