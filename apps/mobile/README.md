# mobile (Expo / React Native)

Feature-based structure under `src/features/*`. Cross-cutting clients in `src/lib`.
Shared scoring/types come from `@terra/core` — never reimplement scoring here.

## Structure

```
src/
  App.tsx              root providers (QueryClient, SafeArea, gesture handler)
  navigation/          RootNavigator (auth gate) + bottom Tabs
  state/authStore.ts   Zustand session store, hydrated from Supabase auth
  lib/                 supabase client, env, react-query client, edge-fn helper
  theme/               design tokens
  components/          Screen, Button
  features/
    auth/              phone (SMS) sign-in
    map/               Mapbox map colored by claim owner (friends-scoped)
    logbook/           personal trip history
    trips/             manual trip logging + transport picker + scoring call
    capture/           LIVE camera proof (no gallery) → verify-capture
    leaderboard/       friends (aggregate) + global (pseudonymous) boards
    friends/           add by exact handle, accept requests
    profile/           handle, global opt-in, GDPR export + hard delete
```

## Run

Needs a **dev build** (native modules: Mapbox, camera, location) — not Expo Go.

```bash
cp .env.example .env      # fill in EXPO_PUBLIC_* values
pnpm install              # from repo root
pnpm run start            # from apps/mobile (expo start --dev-client)
```
