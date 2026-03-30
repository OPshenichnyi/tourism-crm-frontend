# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server on http://localhost:3001
npm run build     # Production build
npm run lint      # ESLint
npm run test:e2e  # Playwright E2E tests
```

Single E2E test:
```bash
npx playwright test e2e/<test-file>.spec.ts
```

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Axios, React Hook Form

### Route Groups

```
src/app/
├── (auth)/              # Unauthenticated: login, register via token
├── (protected)/         # Auth-guarded, role-based sub-routes
│   ├── admin/
│   ├── manager/
│   └── agent/
└── orders/[id]/         # Shared order detail (role-agnostic route)
```

- `(auth)/layout.tsx` redirects already-logged-in users to their role dashboard
- `(protected)/layout.tsx` + `DashboardLayout.tsx` enforce token presence and role matching before rendering

### Auth & Session

- JWT stored in `localStorage` (key: `token`, user object: `user`)
- `AuthContext` (`src/app/contexts/AuthContext.tsx`) provides `useAuth()` hook
- No refresh token logic — expired tokens redirect to login
- Role-based routing: `admin` → `/admin`, `manager` → `/manager`, `agent` → `/agent`

### API Layer

All API calls go through `src/app/services/apiService.ts`:
- Base URL: `NEXT_PUBLIC_API_URL` env var, fallback `http://travel-agentonline.com:3000/api`
- Bearer token injected via Axios request interceptor
- Methods namespaced: `apiService.auth.*`, `apiService.orders.*`, `apiService.agents.*`, `apiService.invitations.*`, `apiService.profile.*`, `apiService.bankAccounts.*`
- Request/response logging via interceptors (console)

### User Roles

| Role | Access |
|------|--------|
| `admin` | Users, agents, invitations, profile |
| `manager` | Agents, orders, bank accounts, invitations, profile |
| `agent` | Own orders, clients, profile |

### Key Patterns

- **Forms:** React Hook Form throughout; `CountrySelect` component for ISO country dropdowns
- **Reservation number:** Auto-generated as `{CountryCode}{DDMMYYYY}N{PropertyNumber}`
- **Order payments:** Split into deposit + balance, each with own payment_methods array
- **PDF vouchers:** Generated server-side, triggered via `apiService.orders.generateVoucher(orderId)`
- **CSV export:** Manager-only via `apiService.orders.exportManagerCSV(params)`

### Path Alias

`@/*` → `./src/*` (configured in `tsconfig.json`)

## Environment

```env
NEXT_PUBLIC_API_URL=http://travel-agentonline.com:3000/api
```

## Language conventions

- All UI labels, buttons, placeholders, and messages: **English only**
- All code comments: **English only**

## Deployment

- Docker: multi-stage build, Next.js `standalone` output, port 3001
- `next.config.ts` has `ignoreBuildErrors: true` for both ESLint and TypeScript — build will succeed even with type errors