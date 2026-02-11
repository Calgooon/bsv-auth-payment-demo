# poc-client/src
> React frontend for testing BSV authentication and micropayment endpoints.

## Overview

This is the source directory for the proof-of-concept client application that demonstrates BRC-31 (Authrite) mutual authentication and BRC-29 (Direct Payment) micropayments against the `bsv-auth-cloudflare` Cloudflare Worker backend. It is a minimal React + TypeScript app built with Vite and styled with Tailwind CSS v4. The client uses `@bsv/sdk`'s `WalletClient` and `AuthFetch` to handle the full authentication handshake and payment protocol transparently.

## Files

| File | Purpose |
|------|---------|
| `main.tsx` | Application entry point — mounts `<App />` into the DOM via `createRoot` with `StrictMode` |
| `App.tsx` | Main UI component with endpoint buttons, payment mode selector, loading states, error display, and response feed |
| `wallet.ts` | BSV wallet initialization — creates `WalletClient` and exports `AuthFetch` instance |
| `App.css` | Tailwind CSS v4 import (`@import "tailwindcss"`) |
| `vite-env.d.ts` | Vite client type reference for TypeScript |

## Key Exports

### `wallet.ts`

| Export | Type | Description |
|--------|------|-------------|
| `authFetch` | `AuthFetch` | Pre-configured `AuthFetch` instance backed by a `WalletClient('auto')`. Handles BRC-31 authentication headers, session management, and BRC-29 payment negotiation transparently on every `fetch()` call. |

### `App.tsx`

| Export | Type | Description |
|--------|------|-------------|
| `default` (App) | React Component | The root application component. Not typically imported outside of `main.tsx`. |

## Components

### `App` (App.tsx:17)

The main application component. Uses a unified results feed instead of per-endpoint state.

**State:**
- `results` — `Array<{ id, title, result, accent }>` — chronological feed of all API responses (newest first)
- `loadingKey` — `string | null` — tracks which button is currently loading (e.g. `'free'`, `'paid-header'`, `'balance'`)
- `error` — shared error string from the most recent failed request (dismissible)

**Callbacks:**
- `addResult()` (App.tsx:22) — prepends a new response to the results feed with a timestamp-based ID
- `callEndpoint()` (App.tsx:26) — generic callback that invokes `authFetch.fetch()` with `POST` to the server. Accepts optional `fetchOptions` (including `paymentTransport`) and a `transportLabel` string for display. Used for `/free` and all three `/paid` transport modes.
- `fetchBalance()` (App.tsx:56) — dedicated callback that uses plain `fetch` (no auth) to `GET /balance`
- All callbacks track request duration via `performance.now()`

**UI Layout:**
- Utility row (2-column grid):
  - "Free Endpoint" (`POST /free`, auth only, emerald accent)
  - "Server Balance" (`GET /balance`, no auth, sky accent)
- Payment Modes section (3-column grid, each 10 sats):
  - "Header" — classic payment via HTTP header (`paymentTransport: 'header'`, amber accent)
  - "Body" — large-TX-safe payment via request body (`paymentTransport: 'body'`, violet accent)
  - "Auto" — size-based detection (`paymentTransport: 'auto'`, cyan accent)
- Error banner — dismissible, shows with red accent
- Results feed — newest-first list of `ResponseCard`s with a "Clear all" button

### `ActionButton` (App.tsx:239)

A reusable button component for triggering API calls.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Primary button text |
| `sublabel` | `string` | Secondary badge text (e.g. "POST /free", "Classic") |
| `detail` | `string` | Explanatory subtext below the label |
| `accent` | `Accent` | Color theme |
| `loading` | `boolean` | Shows a spinner overlay when true |
| `onClick` | `() => void` | Click handler |
| `icon` | `React.ReactNode` | Optional SVG icon displayed before the label |

**Renders:** A card-style button with accent-colored text, hover border glow, and a full-overlay spinner when loading. Uses `accentClasses` lookup (App.tsx:231) for per-accent styling.

### `ResponseCard` (App.tsx:280)

A presentational component that renders an API response in a card layout.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card header text |
| `result` | `ApiResponse` | The response data to display |
| `accent` | `Accent` | Color theme |

**Renders:**
- Header row with title, optional transport badge, HTTP status badge (green/red), and duration in ms
- Optional txid row — extracted from `result.data.payment.txid` if present, shown as a monospace truncated code block
- JSON body — pretty-printed response data

Uses `responseColors` lookup (App.tsx:272) for per-accent styling.

## Types

### `ApiResponse` (App.tsx:8)

```typescript
interface ApiResponse {
  data: unknown      // Parsed JSON response body
  status: number     // HTTP status code
  duration: number   // Round-trip time in milliseconds
  transport?: string // Payment transport used ('header' | 'body' | 'auto'), if applicable
}
```

### `Accent` (App.tsx:15)

```typescript
type Accent = 'emerald' | 'amber' | 'violet' | 'cyan' | 'sky'
```

Five accent colors used throughout: emerald (free), amber (paid-header), violet (paid-body), cyan (paid-auto), sky (balance).

## Configuration

### Server URL

The backend URL is environment-aware at `App.tsx:4`:
```typescript
const SERVER = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://poc-server.dev-a3e.workers.dev'
```

In development (`vite dev`), targets the local Cloudflare Workers dev server. In production builds, targets the deployed worker.

### Wallet

`wallet.ts` creates a `WalletClient` with `'auto'` mode, which automatically discovers and connects to an available BSV wallet (e.g., browser extension). The `AuthFetch` wrapper adds BRC-31/BRC-29 headers to every outgoing request and handles:
- Initial handshake at `/.well-known/auth`
- Session nonce exchange
- Request signing
- 402 Payment Required responses (automatic payment negotiation)

## Request Flow

### Authenticated endpoints (Free / Paid)

1. User clicks an endpoint button (Free, or one of the three Payment Mode buttons)
2. `callEndpoint()` invokes `authFetch.fetch()` with `POST` to the selected path
3. For paid endpoints, `fetchOptions.paymentTransport` controls how the payment is sent:
   - `'header'` — payment data in `x-bsv-payment` HTTP header (classic mode)
   - `'body'` — payment data in the request body (safe for large transactions)
   - `'auto'` — header if payload < 6KB, body otherwise
4. `AuthFetch` (from `@bsv/sdk`) transparently:
   - Establishes a BRC-31 session if none exists (handshake at `/.well-known/auth`)
   - Signs the request with session nonces
   - If server returns 402, constructs a payment transaction and retries
5. Response JSON is parsed, duration is calculated, and result is prepended to the feed
6. `ResponseCard` renders the result with status, timing, transport badge, and txid (if present)

### Balance endpoint (unauthenticated)

1. User clicks "Server Balance" button
2. `fetchBalance()` calls plain `fetch()` with `GET /balance` (no `AuthFetch`, no auth headers)
3. Response JSON is parsed, duration is calculated, and result is prepended to the feed
4. `ResponseCard` renders the result with a sky accent

## Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed
- Dark theme: `bg-zinc-950` background, `text-zinc-100` text
- Decorative background gradient orbs (violet, amber, emerald blurs) for depth
- Color coding per accent: emerald (free), amber (paid-header), violet (paid-body), cyan (paid-auto), sky (balance)
- Loading spinners use `animate-spin` on a border-based circle with accent-colored borders
- Error display uses `bg-red-950/30` with `border-red-900/30`, dismissible via close button
- Cards use `backdrop-blur-sm` and semi-transparent backgrounds for a glass effect

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@bsv/sdk` | ^1.1.29 | BSV wallet client, `AuthFetch` for BRC-31/29 protocol handling |
| `react` | ^19.0.0 | UI framework |
| `react-dom` | ^19.0.0 | DOM rendering |
| `tailwindcss` | ^4.0.0 | Utility-first CSS (dev) |
| `@tailwindcss/vite` | ^4.0.0 | Vite plugin for Tailwind v4 (dev) |
| `vite` | ^6.0.0 | Build tool and dev server (dev) |
| `typescript` | ~5.7.0 | Type checking (dev) |

## Development

```bash
cd poc-client
npm install
npm run dev      # Start Vite dev server (default: http://localhost:5173)
npm run build    # Type-check with tsc then build with Vite
npm run preview  # Preview production build
```

The client expects the `poc-server` (Cloudflare Worker) to be running at `http://localhost:8787` during development. Start it with `wrangler dev` in the server directory.

## Related

- `../../poc-server/` — The Cloudflare Worker backend this client calls
- `../../bsv-auth-cloudflare/src/CLAUDE.md` — Server-side middleware documentation (BRC-31 auth, BRC-29 payments)
- `../index.html` — HTML shell that loads `src/main.tsx`
- `../vite.config.ts` — Vite configuration with React and Tailwind plugins
- `../package.json` — Dependencies and scripts
