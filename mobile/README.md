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
├── app/            # Screens (Expo Router): (tabs)/ Home, Track, Settings; track/[receiptId];
│                   #   report (the complaint form), report-sent (the receipt), outbox
├── api/            # HTTP calls: client.ts (axios + ApiError), reports.ts
├── components/     # Themed building blocks (ui, form), PhotoPicker, Turnstile (CAPTCHA WebView)
├── i18n/           # Language provider and translator
├── lib/            # Report form model and checks, offline outbox (SQLite), location, dates
├── messages/       # App-only text in en / si / ta
└── theme/          # TransitX palette, light and dark
```

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

## Builds

`eas.json` has three profiles: `development` (dev client), `preview` (internal APK, `preview`
update channel) and `production` (store builds, `production` channel). The app ID is
`com.transitx.app`. Run EAS as `npx eas-cli@latest build --profile preview --platform android`.
