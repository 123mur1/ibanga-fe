# iBanga

iBanga is a freight marketplace for importers, truck owners, and marketplace administrators. The current application stores marketplace records in the browser and does not process external payments.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Administrator access

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@ibanga.com` | `admin123` |

All importer and truck-owner test accounts use `ibanga123`. Example logins:

| Role | Email | Password |
| --- | --- | --- |
| Importer | `maya@greenroute.rw` | `ibanga123` |
| Importer | `chantal@kivucollective.ibanga.test` | `ibanga123` |
| Truck owner | `patrick@pnt-logistics.rw` | `ibanga123` |
| Truck owner | `beatrice@akellofreight.ibanga.test` | `ibanga123` |

The preloaded test workspace contains 27 accounts, 162 trucks, 915 bookings, 61 disputes, and 324 wallet transactions. Use **Restore initial data** in the admin dashboard to reload the preloaded records after testing.

## Marketplace capabilities

- Importers can search trucks, request bookings, follow trip progress, raise disputes, and manage their wallet.
- Truck owners can list and manage vehicles, respond to requests, track trips, and manage payouts.
- Administrators can review marketplace activity, manage accounts and trucks, update booking statuses, resolve disputes, review wallet records, and export reports.
- Account records and preferences are stored in browser local storage. Wallet activity is recorded locally and does not charge or transfer real funds.

## Checks

```bash
npx eslint src
npm run build
```
