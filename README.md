# React Frontend — example.com

React 18 + Vite single-page app. Hosted as static files by nginx on the **same EC2 instance as the API**
(`https://example.com`), calling the PHP API at `https://api.example.com/api` (backend repository).

```
Browser ──► https://example.com      nginx → /var/www/example.com/current   ← this repo's build
   └──────► https://api.example.com  nginx → PHP API in Docker              ← backend repo
```

## Structure

```
.
├── src/
│   ├── api.js                   # API client: timeouts, retries, idempotency keys, circuit breaker
│   ├── App.jsx                  # Navbar, hero, features, item manager, footer
│   ├── hooks/useConnection.js   # Reconnects automatically when the API comes back
│   └── components/
├── .env.production              # VITE_API_BASE_URL=https://api.example.com/api  (baked in at build)
├── .env.example                 # Local dev settings
├── deploy/
│   ├── deploy-server.ps1        # Build + upload to the EC2 server over SSH (PowerShell)  ← default
│   ├── deploy-server.sh         # Same, bash
│   ├── deploy-s3.ps1 / .sh      # Alternative: S3 + CloudFront hosting
└── infra/frontend-stack.yaml    # Alternative: CloudFormation for S3 + CloudFront hosting
```

## Deploying to the EC2 server

**Prerequisites:** the backend repo's `setup-nginx.sh` has been run on the server (it creates
`/var/www/example.com` and the nginx site), and you have the instance's SSH key.

1. Set the API URL in `.env.production`:
   ```
   VITE_API_BASE_URL=https://api.example.com/api
   ```
2. Deploy:
   ```powershell
   .\deploy\deploy-server.ps1 -Server ubuntu@<ELASTIC_IP> -Domain example.com -KeyFile C:\path\my-key.pem
   ```
   ```bash
   ./deploy/deploy-server.sh ubuntu@<ELASTIC_IP> example.com path/my-key.pem
   ```
   The script builds, uploads to `/var/www/example.com/releases/<timestamp>`, then switches the
   `current` symlink atomically. The last 5 releases are kept.
3. Open `https://example.com`. The badge should show **API online**.

**Rollback** (on the server): `ln -sfn /var/www/example.com/releases/<older> /var/www/example.com/current`

**If the badge says "API offline":** open the browser console (F12). A CORS error means the backend's
`CORS_ALLOWED_ORIGINS` doesn't contain `https://example.com` exactly.

## Alternative: S3 + CloudFront

If you later want a global CDN instead of the single server, deploy `infra/frontend-stack.yaml`
in `us-east-1` and use `deploy/deploy-s3.ps1 -StackName <stack>`.

## Local development

```bash
npm install
npm run dev          # http://localhost:5173 — /api is proxied to the backend at http://localhost:8081
```
Run the backend repo's `docker compose up -d --build` first.
