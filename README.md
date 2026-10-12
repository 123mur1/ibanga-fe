# iBanga

iBanga is a freight marketplace for importers, truck owners, and marketplace administrators. Marketplace accounts, trucks, bookings, disputes, and wallet records are loaded from the backend API and stored in its database. Authentication tokens remain in browser storage. Wallet payment operations are simulated by the backend and do not move real funds.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend API

Run the backend separately and make sure it is reachable from the frontend.
The development default is `http://localhost:3001`. Set `NEXT_PUBLIC_API_URL`
in `.env.local` or the deployment environment to override the backend origin.
Register an account through the app or sign in with an account already stored
in the backend database.

## Marketplace capabilities

- Importers can search trucks, request bookings, follow trip progress, raise disputes, and manage their wallet.
- Truck owners can list and manage vehicles, respond to requests, track trips, and manage payouts.
- Administrators can review marketplace activity, manage accounts and trucks, update booking statuses, resolve disputes, review wallet records, and export reports.
- Account and marketplace records are stored in the backend database. Notification preferences remain on this device.
- Wallet operations use the backend's simulation mode; they do not charge or transfer real funds.

## Checks

```bash
npx eslint src
npm run build
```
