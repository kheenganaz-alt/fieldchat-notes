# FieldChat Notes

FieldChat Notes is a mobile-first React + Capacitor field recorder that looks like a modern messaging app while supporting professional timestamp logging, route work, offline autosave, reports, and discreet mode.

## Stack

- React, Vite, TypeScript, React Router
- TailwindCSS, Framer Motion, Lucide React
- Zustand state management
- IndexedDB offline cache with automatic online sync
- Supabase auth/database integration with local fallback
- Recharts analytics
- PDF, DOCX, TXT, and CSV exports
- Capacitor Android and PWA support

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Supabase is optional during development. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable cloud sync, then apply `database/schema.sql` in Supabase SQL editor. Every application table includes `userId`, RLS is enabled, and all policies filter to `auth.uid()`.

## Android APK

```bash
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

In Android Studio, build `app-debug.apk` or create a signed release. The app name is set to `Messages` for discreet use. Camera, microphone, and location access are requested only from the feature that needs the permission.

## Production Notes

- IndexedDB stores sessions, notes, timestamps, routes, stops, settings, photos, and exports for full offline use.
- The active session, draft text, timer, and scroll position are restored after app switching, lock screen, or reload.
- Exports throw a clear error instead of generating empty files.
- The route planner supports manual stop ordering, status tracking, and Google Maps launch.
