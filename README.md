# Ember & Bun

Ember & Bun is a Next.js storefront with an Express/MongoDB order API and a protected staff order board.

## Requirements

- Node.js 22.13 or newer
- MongoDB (local or MongoDB Atlas)

## Local setup

Install dependencies:

```powershell
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set your MongoDB connection:

```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
MONGODB_DB=ember-bun
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
BACKEND_API_URL=http://127.0.0.1:4000
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
STAFF_SESSION_SECRET=<long-random-secret>
INTERNAL_API_SECRET=<different-long-random-secret>
```

`STAFF_SESSION_SECRET` signs the staff session cookie. `INTERNAL_API_SECRET` allows only the Next.js server to request staff orders from the Express API. These are security keys, not admin passwords. Never commit `.env` or share these values.

If the server reports a MongoDB TLS error such as `tlsv1 alert internal error`, verify that the Atlas connection string includes the correct username, password, cluster host, and database, then add the machine running the API to the Atlas project's Network Access IP allowlist. Restart the API after changing `.env`.

If the server reports `querySrv ECONNREFUSED`, Node cannot obtain the Atlas SRV record from the machine's configured DNS server. Set `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8` in `.env` (or use DNS servers allowed by your network), then restart the API.

## Create the admin login

Set or replace the admin password. The password is stored as a hash in MongoDB; the plaintext password is removed:

```powershell
npm run set-staff-password -- admin "Choose-A-Strong-Password"
```

Verify the user without printing the password:

```powershell
npm run check-staff-user -- admin
```

Expected result:

```json
{
  "username": "admin",
  "hasPasswordHash": true,
  "hasLegacyPlaintextPassword": false
}
```

## Run the app

Use two terminals.

Terminal 1 — backend:

```powershell
npm run server
```

Terminal 2 — Next.js:

```powershell
npm run dev
```

Open `http://127.0.0.1:3000`. The staff board is at `/orders`.

## Security notes

- The staff order API requires the internal secret and is not intended to be public.
- Use HTTPS in production.
- Use different, randomly generated secrets for every deployment.
- Restrict MongoDB Atlas network access to trusted server IPs; do not use `0.0.0.0/0` in production.
- Never commit `.env`, MongoDB credentials, admin passwords, or production secrets. `.env*` is ignored by Git.
- If secrets were ever exposed, rotate them immediately and restart both services.

## Validation

```powershell
npm run build
npx tsc --noEmit
npm run lint
```
