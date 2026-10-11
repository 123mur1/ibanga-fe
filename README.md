# iBanga

iBanga is a freight marketplace for importers, truck owners, and marketplace administrators. The frontend reads and updates marketplace data through the iBanga API. Wallet operations use the backend's simulated payment flow and do not transfer real funds.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Getting started

There are no preloaded demo accounts or frontend marketplace records. Register
an importer or truck-owner account to begin using the marketplace. Administrator
access is not preconfigured.

## API integration

Run the backend separately and make sure it is reachable from the frontend.
Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend origin (the local
configuration uses `http://localhost:3001`). The frontend is served at
`http://localhost:3000` by default.

Authentication tokens are stored in the browser; marketplace records are
loaded from the API. Account preferences remain browser-local.

## Marketplace capabilities

- Importers can search trucks, request bookings, follow trip progress, raise disputes, and manage their wallet.
- Truck owners can list and manage vehicles, respond to requests, track trips, and manage payouts.
- Administrator tools are available to administrator accounts; no demo administrator account is included.
- Wallet activity is recorded by the API's simulated payment flow; no external charge or payout is made.

## Checks

```bash
npx eslint src
npm run build
```
