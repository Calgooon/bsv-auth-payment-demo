# BSV Auth + Payment Demo

Live demo of BRC-31 mutual authentication and BRC-29 micropayments against a Rust Cloudflare Worker backend.

**Live:** https://poc-client.pages.dev

## What this demonstrates

- **BRC-31 (Authrite)** mutual authentication — cryptographic identity handshake between browser wallet and server
- **BRC-29 (Direct Payment)** micropayments — 10 sat payments with three transport modes:
  - **Header** — payment JSON in `x-bsv-payment` header (classic, backward compatible)
  - **Body** — payment JSON in request body for large transactions (avoids proxy header size limits)
  - **Auto** — header for small payments, body for >6KB

> **Note:** The Body and Auto transport modes depend on [TS SDK PR #480](https://github.com/bsv-blockchain/ts-sdk/pull/480) which adds `paymentTransport` support to `AuthFetch`. Until that PR is merged and published, all three buttons will use header transport. The live deployment includes this feature via a local build of the SDK.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Vite
- **Auth/Payment:** [@bsv/sdk](https://github.com/bsv-blockchain/ts-sdk) `AuthFetch` client
- **Backend:** Rust Cloudflare Worker with BRC-31 auth + BRC-29 payment middleware
- **Wallet:** Any BRC-100 compatible wallet (e.g. [MetaNet Client](https://getmetanet.com))

## Run locally

```bash
npm install
npm run dev
```

By default the app points at the deployed backend (`https://poc-server.dev-a3e.workers.dev`), so you can run the frontend locally without setting up a backend.

## Related

- [TS SDK PR #480](https://github.com/bsv-blockchain/ts-sdk/pull/480) — body-based payment transport feature
