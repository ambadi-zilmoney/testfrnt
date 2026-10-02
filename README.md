# React Frontend — example.com

React 18 + Vite single-page app, hosted as static files on **S3 + CloudFront** at `https://example.com`.
It calls the PHP API at `https://api.example.com/api` (separate repository).

```
Browser ──► https://example.com      CloudFront → S3 (private bucket)   ← this repo
   └──────► https://api.example.com  nginx → PHP API in Docker          ← backend repo
```

## Structure

```
.
├── src/
│   ├── api.js                   # API client: timeouts, retries, idempotency keys, circuit breaker
│   ├── App.jsx
│   ├── hooks/useConnection.js   # Reconnects automatically when the API comes back
│   └── components/
├── .env.production              # VITE_API_BASE_URL=https://api.example.com/api  (baked in at build)
├── .env.example                 # Local dev settings
├── vite.config.js
├── deploy/
│   ├── deploy.ps1               # Build + upload to S3 + invalidate CloudFront (PowerShell)
│   └── deploy.sh                # Same, for bash
└── infra/frontend-stack.yaml    # CloudFormation: S3, CloudFront, TLS certificate, Route 53 DNS, API health alarm
```

## Hosting (AWS)

**Before you start**
- AWS CLI v2 installed and logged in (`aws sts get-caller-identity` works).
- Your domain's DNS is managed by **Route 53** (a hosted zone for `example.com`). Note its **Hosted Zone ID**.
- The backend server's **public IP** (the template also creates the `api.example.com` DNS record).

**1. Set the API URL**

Edit `.env.production`:
```
VITE_API_BASE_URL=https://api.example.com/api
```

**2. Create the hosting (one time)**

Must be deployed in **us-east-1** — CloudFront requires its certificate there.
```bash
aws cloudformation deploy --region us-east-1 \
  --stack-name example-frontend \
  --template-file infra/frontend-stack.yaml \
  --parameter-overrides \
      DomainName=example.com \
      HostedZoneId=Z0123456789ABCDEFGHIJ \
      ApiServerIp=203.0.113.10 \
      AlertEmail=you@example.com
```
Creates: private S3 bucket, CloudFront distribution with HTTPS + security headers, certificate for
`example.com` + `www.example.com`, DNS records for `example.com`, `www` and `api.example.com`,
and a health check that emails you if the API goes down. Takes 5–15 minutes the first time.
Confirm the subscription email from AWS when it arrives.

**3. Deploy the app**
```powershell
.\deploy\deploy.ps1 -StackName example-frontend        # PowerShell
```
```bash
STACK_NAME=example-frontend ./deploy/deploy.sh         # bash
```
The script builds, uploads hashed assets with a 1-year cache, uploads `index.html` last with
`no-cache`, and invalidates CloudFront, so the new version is visible immediately.

**4. Verify**

Open `https://example.com`. The badge should say **API online** and the item list should load from the API.
If it says offline, check the browser console: a CORS error means `CORS_ALLOWED_ORIGINS` on the backend
does not include `https://example.com` exactly.

## Updating the frontend

Change code → commit → run the deploy script again (step 3).
Rollback: restore the previous `index.html` version in S3 (versioning is on) and invalidate `/index.html`.

## Local development

```bash
npm install
npm run dev          # http://localhost:5173 — /api is proxied to the backend at http://localhost:8081
```
Run the backend repo's `docker compose up -d --build` first.
