# Sayso Mobile

Expo React Native app for the Sayso mobile client.

## What is implemented

- Expo Router tab navigation: Home, Search, Saved, Notifications, Profile
- Supabase auth session handling with SecureStore-backed persistence
- Email/password and Google OAuth sign-in
- Authenticated API helper (`Authorization: Bearer <token>`)
- Push token registration to backend
- Realtime notifications unread count refresh

## Current product scope

- Mobile is currently focused on end-user flows.
- Business-owner and admin flows are intentionally web-only in this version (`/role-unsupported` screen).
- Home, Search, and Saved tabs are scaffolded placeholders for API integration.

## Tech stack

- Expo 52
- React Native 0.76
- React 18
- Expo Router
- Supabase JS v2
- TanStack Query

## Prerequisites

- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+
- Expo Go or iOS/Android simulator
- A Supabase project (URL + anon key)
- Sayso backend API base URL

## Environment variables

Copy `.env.example` to `.env` and set values:

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Base URL for backend API requests (for example `https://sayso.vercel.app`). |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key. |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Recommended | Used for Expo push token registration. |

If Supabase env values are missing, the app logs a warning at startup.

## Setup

From this folder (`sayso-mobile/`):

```bash
npm install
```

Create local env file:

```bash
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

Run the Expo dev server:

```bash
npm run start
```

## Scripts

- `npm run start`: start Expo
- `npm run android`: run Android native build
- `npm run ios`: run iOS native build
- `npm run web`: run Expo for web
- `npm run type-check`: TypeScript check without emit

## Auth and OAuth setup notes

- App scheme is `sayso` (`app.json`), and OAuth callback is built from `/auth/callback`.
- For Google OAuth via Supabase, add a redirect URL compatible with this scheme (for example `sayso://auth/callback`) in Supabase Auth settings.
- Ensure Google provider is enabled in your Supabase project.

## Backend endpoints expected by mobile app

- `POST /api/user/push-tokens`
- `GET /api/notifications/user`
- Planned integrations referenced in UI:
  - `GET /api/user/saved`
  - `GET /api/businesses/search`

## Project structure

```txt
app/
  (tabs)/
  _layout.tsx
  login.tsx
  role-unsupported.tsx
src/
  hooks/
  lib/
  providers/
```
