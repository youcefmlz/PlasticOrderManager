# PlasticOrderManager

PlasticOrderManager is a bilingual English and Arabic Expo app for managing
plastic product orders. It supports wholesalers and administrators on iOS,
Android, and the web.

## Features

Customers can browse and search the product catalog, add products to a cart,
place delivery orders, follow order status, and update their profile.

Administrators can review orders, change order status, manage products, manage
customer accounts, and review notifications. The interface supports English,
Arabic, right-to-left layouts, and light or dark mode.

## Technology

- Expo, React Native, React, and TypeScript
- React Navigation and AsyncStorage
- Node.js and Express
- PostgreSQL
- JWT authentication and bcrypt password hashing

## Requirements

- Node.js 18 or newer
- npm
- A PostgreSQL database and the backend in `server/`

## Frontend setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app uses `http://localhost:3001/api` in development when
`EXPO_PUBLIC_API_URL` is not set. Set that variable to a backend address that
your phone or computer can reach.
Do not commit `.env` files.

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
npm run check:format
npx tsc --noEmit
```

## Backend

See [`server/README.md`](server/README.md) for database and backend setup.
Start the backend before signing in to the app.

The backend requires `DATABASE_URL` and a `SESSION_SECRET` of at least 32
characters. Browser access is controlled with `CORS_ALLOWED_ORIGINS`. The
administrator seed command also requires `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
See [`.env.example`](.env.example) for all configuration names.

## Builds

The project uses Expo Application Services (EAS). Run `eas init` to link your
own Expo project, then provide `EXPO_PUBLIC_API_URL` through your local
environment or EAS environment variables before building. Store signing and
submission credentials in EAS or your local environment, not in this
repository.
