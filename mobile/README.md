# TransitX mobile app

The passenger app for Android and iOS: Expo SDK 58, React Native, TypeScript, Expo Router and
TanStack Query. It talks to the same API as the website (`api/`).

It is its own npm project (own `package.json` and lockfile), because React Native can't share the
root `node_modules` with Next.js. It still reuses two folders from the repo through Metro:

- `ui/messages/*.json`: all English, Sinhala and Tamil text, formatted with `intl-messageformat`
  (the same ICU syntax as next-intl). App-only strings live in `src/messages/` under `app.*`.
- `api/src/config/constants.ts`: statuses, categories and report types.

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

## Layout

```
src/
├── app/            # Screens (Expo Router): (tabs)/ Home, Track, Settings; track/[receiptId]
├── api/            # HTTP calls: client.ts (axios + ApiError), reports.ts
├── components/     # Themed building blocks (ui.tsx)
├── i18n/           # Language provider and translator
├── lib/            # Small pure helpers (receipt IDs, dates)
├── messages/       # App-only text in en / si / ta
└── theme/          # TransitX palette, light and dark
```

## Builds

`eas.json` has three profiles: `development` (dev client), `preview` (internal APK, `preview`
update channel) and `production` (store builds, `production` channel). The app ID is
`com.transitx.app`. Run EAS as `npx eas-cli@latest build --profile preview --platform android`.
