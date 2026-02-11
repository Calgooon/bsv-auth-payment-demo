# BSV Auth + Payment Demo

Live demo of BRC-31 mutual authentication and BRC-29 micropayments against a Rust Cloudflare Worker backend.

**Live:** https://poc-client.pages.dev

## What this demonstrates

- **BRC-31 (Authrite)** mutual authentication — cryptographic identity handshake between browser wallet and server
- **BRC-29 (Direct Payment)** micropayments — 10 sat payments with three transport modes:
  - **Header** — payment JSON in `x-bsv-payment` header (classic, backward compatible)
  - **Body** — payment JSON in request body for large transactions (avoids proxy header size limits)
  - **Auto** — header for small payments, body for >6KB

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Vite
- **Auth/Payment:** [@bsv/sdk](https://github.com/bsv-blockchain/ts-sdk) `AuthFetch` client
- **Backend:** Rust Cloudflare Worker using [bsv-auth-cloudflare](https://github.com/Calgooon/rust-middleware) middleware
- **Wallet:** Any BRC-100 compatible wallet (e.g. [MetaNet Client](https://getmetanet.com))

## Run locally

```bash
npm install
npm run dev
```

The app auto-detects environment — in dev mode it targets `http://localhost:8787` (run the backend with `wrangler dev`), in production it targets the deployed worker.

## Related

- [TS SDK PR #480](https://github.com/bsv-blockchain/ts-sdk/pull/480) — body-based payment transport feature
- Backend: Rust Cloudflare Worker with BRC-31 auth + BRC-29 payment middleware
