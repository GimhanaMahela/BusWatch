# TransitX mobile app

The passenger app for Android and iOS: Expo SDK 58, React Native, TypeScript, Expo Router and
TanStack Query. It talks to the same API as the website (`api/`).

It is its own npm project (own `package.json` and lockfile), because React Native can't share the
root `node_modules` with Next.js. It still reuses two folders from the repo through Metro:

- `ui/messages/*.json`: all English, Sinhala and Tamil text, formatted with `intl-messageformat`
  (the same ICU syntax as next-intl). App-only strings live in `src/messages/` under `app.*`.
- `api/src/config/constants.ts`: statuses, categories, report types and upload limits.
- `api/src/utils/phone.ts`: the phone-number check the server uses.

Shared files must not import anything: their imports would resolve outside the app.

## Run it

```bash
cd mobile
npm install
cp .env.example .env   # point EXPO_PUBLIC_API_URL at your API
npm start              # then press "a" for an Android emulator, or scan the QR code with Expo Go
```

Run the API from the repo root with `npm run dev:api`. On a phone, `localhost` is the phone: use
your computer's LAN address, or `10.0.2.2` from the Android emulator.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run doctor   # expo-doctor: SDK version and config problems
```

CI runs all four in the `mobile` job of `.github/workflows/ci.yml`.

## Adding a dependency

Install with `npx expo install <package>` (it picks the version that matches the SDK), then run
`npm run relock`. On Linux, `npm install` drops macOS-only optional packages such as `fsevents`
from the lockfile, and `npm ci` on CI then fails with "Missing: fsevents from lock file".
`relock` rebuilds the lockfile from the registry; run `npm ci` afterwards.

## Layout

```
src/
├── app/            # Screens (Expo Router): (tabs)/ Home, Track, My reports, Settings;
│                   #   track/[receiptId]; report (?type=commendation|lost_item, ?bus=&src=qr),
│                   #   report-sent, outbox, scan (bus QR sticker), fare, impact,
│                   #   bus/[busNumber], route/[routeNumber], safety, chat (helper)
├── api/            # HTTP calls: client.ts (axios + ApiError), reports.ts
├── components/     # Themed building blocks (ui, form), PhotoPicker, Turnstile (CAPTCHA WebView)
├── i18n/           # Language provider and translator
├── lib/            # Report form model and checks, offline outbox (SQLite), location, dates
├── messages/       # App-only text in en / si / ta
└── theme/          # TransitX palette, light and dark
```

## Look and feel

- **Type:** the website's Plus Jakarta Sans, with Noto Sans Sinhala and Noto Sans Tamil for those
  languages (`theme/typography.ts`). Use `Text` and `TextInput` from `components/Text.tsx`, never
  React Native's: they turn `fontWeight` into the right font file for the current language.
- **Motion** (`components/motion.tsx`): `PressableScale` (spring and haptic on every tap), `Rise`
  (staggered entrances), `Skeleton`, `useCountUp`, `Float`. All of it honours the phone's reduce
  motion setting.
- **Signature pieces:** the floating tab bar with the raised Report button
  (`FloatingTabBar.tsx`), the first-launch welcome tour (`app/welcome.tsx`), the four-step report
  wizard with category tiles (`CategoryGrid.tsx`), and the confetti receipt (`Celebration.tsx`).
- **Icon and splash** come from the website's logo (`ui/public/logo512.png`).

## Offline reports

A report sent without a connection (or whose upload drops mid-way) is saved in the outbox: a
SQLite database plus copies of its photos in the app's documents folder. It goes out on its own
when the connection returns or the app is opened again, using the same rules as the website's
outbox: invalid reports are dropped with the server's reason, anything else stays queued. With
Turnstile on, every send needs a fresh token, so saved reports are sent from the "Waiting to send"
screen instead. Receipt IDs of reports sent from the phone are listed on the Track tab.

## Push notifications

Passengers turn on "Get notified on this device" on a report (receipt and tracking screens). The
API stores the phone's Expo push token and sends status changes, team messages and operator
replies through Expo's push service, beside the website's browser push.

Setup, once: run `npx eas-cli@latest init` in `mobile/`. It creates the EAS project and writes its
`projectId` into `app.json`; without it the app says notifications aren't available. Android also
needs Firebase credentials uploaded to EAS (`npx eas-cli@latest credentials`). Expo Go can't
receive push on Android, so test with a development build
(`npx eas-cli@latest build --profile development --platform android`).

## Deep links

The app's scheme is `transitx://`, and every screen is reachable by its path, e.g.
`transitx://track/BW-2026-XXXXXX`. Scanning a bus sticker (`https://<site>/r/NB-1234`) in the app
opens the report form for that bus. Opening `https://` website links in the app (Android App Links,
iOS Universal Links) needs the production domain and signing certificates, so it comes with the
store release.

## End-to-end tests (Maestro)

`.maestro/` holds flows for the main journeys: the report form's checks, the commendation form,
tracking an unknown receipt and the language switch. Maestro drives a real build, so install a
development or preview build on an emulator or phone, start the API, then run `npm run e2e`
(install Maestro first: https://maestro.dev). They are not in CI yet: that needs an Android
emulator on the runner or Maestro Cloud.

## Releasing

| When                                      | What happens                                                      | Workflow             |
| ----------------------------------------- | ----------------------------------------------------------------- | -------------------- |
| A change to the app lands on `dev`        | Over-the-air update to the `preview` channel (testers)            | `mobile-preview.yml` |
| Run `mobile-preview` by hand with "build" | New preview APK for testers                                       | `mobile-preview.yml` |
| Tag a commit on `main` as `mobile-v1.0.0` | Production builds, sent to Play internal testing / TestFlight     | `mobile-release.yml` |
| Run `mobile-release` by hand, "update"    | Over-the-air update to the `production` channel (JavaScript only) | `mobile-release.yml` |

One-time setup, in `mobile/`:

1. `npx eas-cli@latest init`, then `npx eas-cli@latest update:configure`: creates the EAS project
   and writes its ID and update URL into `app.json` (commit that).
2. Add an Expo access token as the `EXPO_TOKEN` repository secret (expo.dev, Account settings,
   Access tokens). Until then the preview workflow skips itself.
3. Store credentials, kept in EAS, never in the repo: `npx eas-cli@latest credentials` for the
   Android keystore and a Google Play service account key (for `--auto-submit`), and, for iOS,
   an App Store Connect API key (Apple Developer Program, USD 99 a year).
4. Create the app once in the Play Console (USD 25 once) with package `com.transitx.app`.

Bump `version` in `app.json` for every store release; `runtimeVersion` follows it, so an update is
only offered to builds of the same version.

## Builds

`eas.json` has three profiles: `development` (dev client), `preview` (internal APK, `preview`
update channel) and `production` (store builds, `production` channel). The app ID is
`com.transitx.app`. Run EAS as `npx eas-cli@latest build --profile preview --platform android`.
