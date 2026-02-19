# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start        # Start with dev client (requires physical device or dev build)
npm run web          # Start web version
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator

# Supabase local development
supabase start
supabase functions serve   # Serve Edge Functions locally
supabase db push           # Push schema changes

# Web deployment
firebase deploy
```

There is no lint script or test runner configured in package.json.

## Architecture

Zolver is a React Native + Expo marketplace app connecting clients with service professionals. It targets iOS, Android, and Web from a single codebase using Expo Router (file-based routing).

### Directory Layout

- `app/` — Expo Router routes, organized in role-based groups: `(auth)/`, `(client)/`, `(professional)/`, `(admin)/`, `(public)/`
- `appSRC/` — Feature modules (business logic), each containing:
  - `Service/` — Supabase/Firebase API calls, data fetching
  - `Hooks/` — Custom React hooks orchestrating business logic
  - `Type/` — TypeScript interfaces for the feature domain
  - `Screen/` — Feature-specific screen components
  - `Store/` — Zustand stores (auth, user data)
  - `Mapper/` — DTO ↔ domain model transforms (where needed)
- `appCOMP/` — Shared/reusable UI components
- `appASSETS/` — Global theme (`theme.tsx` exports `COLORS`, `SIZES`, `FONTS`)
- `supabase/functions/` — Edge Functions (TypeScript, Deno runtime)
- `APIconfig/` — External API client configuration

### Key Architectural Patterns

**Service → Hook → Screen layering:** Screens import hooks, hooks call services, services call Supabase/Firebase. Never call Supabase directly from a screen or component.

**Routing and auth guards:** `app/index.tsx` redirects immediately. `useAuthGuard` (for client/professional) and `useAdminAuthGuard` redirect users to the correct route group based on Firebase auth state and Supabase role.

**Server state:** TanStack React Query for all async data fetching. Zustand for global client state (auth user, notifications).

**Web vs. native differences:** Use `Platform.OS === "web"` for conditional logic. `GestureHandlerRootView` wraps native roots but is replaced with `View` on web.

### Backend

- **Supabase (PostgreSQL + Realtime + RLS):** Primary database. All tables use Row Level Security. Realtime subscriptions used for messaging and notifications.
- **Supabase Edge Functions:** Payment processing (Mercado Pago), Twilio SMS verification, push notifications, session sync, role assignment.
- **Firebase:** Authentication provider (Google, Apple, passwordless email). Firebase Auth state drives Supabase JWT token updates via `session-sync` Edge Function. Firebase Storage for document/image uploads.

### Styling

All styles use `StyleSheet.create()`. Import theme constants from `appASSETS/theme.tsx`:

```ts
import { COLORS, SIZES, FONTS } from "@/appASSETS/theme";
```

Never use inline styles or hardcoded color/font values.

### TypeScript

Strict mode is enabled. Path alias `@/*` maps to the project root. No `any` types.
