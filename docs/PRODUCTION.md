# Production deployment — Vercel (frontend) + Render (backend)

This guide gets GenValue Academy live without CORS, auth, or cold-start surprises.

**Repo:** https://github.com/PuttaSathvik16/Genvalue

| Piece | Host | Notes |
| --- | --- | --- |
| Next.js app | [Vercel](https://vercel.com) | Root of repo |
| Express API | [Render](https://render.com) | `backend/` Docker (`render.yaml`) |
| Database | CockroachDB Cloud / managed Postgres | `DATABASE_URL` on Render |

Deploy **backend first**, then point the frontend at its public URL.

---

## 1. Render — backend API

### Option A — Blueprint (recommended)

1. Push this repo to GitHub (already linked as PuttaSathvik16/Genvalue).
2. Render Dashboard → **New** → **Blueprint**.
3. Select the repo. Root `render.yaml` defines `genvalue-academy-api`.
4. Fill secret env vars when prompted (see checklist below).
5. Deploy. Note the service URL, e.g. `https://genvalue-academy-api.onrender.com`.

### Option B — Manual Docker web service

1. **New** → **Web Service** → connect repo.
2. **Root Directory:** `backend`
3. **Runtime:** Docker  
   Dockerfile path: `./Dockerfile`
4. **Health Check Path:** `/health`
5. Set env vars (below), then deploy.

### After first deploy

```bash
# From your machine (with DATABASE_URL pointing at prod), once:
cd backend
DATABASE_URL="postgresql://..." bunx prisma migrate deploy
```

Or open a Render **Shell** on the service and run the same with the service env available.

Confirm:

```text
GET https://YOUR-API.onrender.com/health
→ { "success": true, "message": "Server is healthy", ... }
```

### Render env checklist

| Key | Example / notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (or leave to Render) |
| `DATABASE_URL` | Cockroach/Postgres connection string |
| `DATABASE_CA_CERT` | Cockroach Cloud CA PEM (recommended on Render). Download CA from Cockroach Cloud → connect, paste into Render env. |
| `DATABASE_SSL_INSECURE` | **Never** in production. Local-only escape hatch. |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` (must be **https**) |
| `CORS_ORIGINS` | Optional extras, comma-separated |
| `ADMIN_JWT_SECRET` | Long random string |
| `SUPER_ADMIN_EMAIL` | Your admin inbox |
| `FIREBASE_PROJECT_ID` | Firebase project id |
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON **or** base64(JSON) |
| `BREVO_SENDER_EMAIL` | Verified sender |
| `BREVO_SMTP_USER` / `BREVO_SMTP_KEY` | Prefer SMTP (`BREVO_EMAIL_MODE=smtp-only`) |
| `BREVO_TEAM_EMAIL` | Contact + alerts inbox |
| `CLOUDINARY_*` | Cloud name, API key, secret |

The API **refuses to start in production** if required vars are missing (`FRONTEND_URL` https, `DATABASE_URL`, `ADMIN_JWT_SECRET`, `FIREBASE_PROJECT_ID`, Brevo SMTP or API).

---

## 2. Vercel — frontend

1. [vercel.com/new](https://vercel.com/new) → import **PuttaSathvik16/Genvalue**.
2. Framework: **Next.js** (root). Leave Install/Build as in `vercel.json`.
3. Add environment variables (Production + Preview as needed):

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-APP.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://YOUR-API.onrender.com/api/v1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | … |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | … |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | … |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | … |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | … |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | … |
| `BREVO_SENDER_EMAIL` | same as backend |
| `BREVO_SENDER_NAME` | GenValue Academy |
| `BREVO_TEAM_EMAIL` | genvalue.academy@gmail.com |
| `BREVO_SMTP_HOST` | smtp-relay.brevo.com |
| `BREVO_SMTP_PORT` | 587 |
| `BREVO_SMTP_USER` | … |
| `BREVO_SMTP_KEY` | … |
| `NEXTAUTH_SECRET` | random (if NextAuth used) |
| `ADMIN_JWT_SECRET` | same as backend if Next OTP helpers need it |

4. Deploy. Copy the Vercel URL.
5. **Go back to Render** and set `FRONTEND_URL` to that exact Vercel URL (no trailing slash). Redeploy API if it was already running with the wrong origin.

---

## 3. Firebase (required for LMS login)

In [Firebase Console](https://console.firebase.google.com) → Authentication → Settings → **Authorized domains**, add:

- `localhost`
- `YOUR-APP.vercel.app`
- any custom domain later

Without this, Google / email link flows fail in production.

---

## 4. Smoke test checklist

- [ ] `GET /health` on Render returns 200  
- [ ] Vercel homepage loads  
- [ ] Browser Network: LMS call hits `https://…onrender.com/api/v1/...` (not localhost)  
- [ ] Student login works (Firebase)  
- [ ] Admin OTP email arrives  
- [ ] Contact form delivers to GenValue inbox  
- [ ] No CORS errors in DevTools (Origin matches `FRONTEND_URL`)  

---

## 5. Common issues

| Symptom | Fix |
| --- | --- |
| CORS error | `FRONTEND_URL` must exactly match the browser origin (`https://….vercel.app`) |
| API 502 / spin-up delay | Free Render sleeps; first request can take ~30–60s |
| Login fails | Add Vercel domain in Firebase Authorized domains |
| Contact email fails | Set Brevo SMTP on **Vercel** (contact route runs on Next) |
| Admin OTP fails | Set Brevo SMTP on **Render** |
| Empty DB / Prisma errors | Run `prisma migrate deploy` against production `DATABASE_URL` |
| Build fails missing bun.lock | Ensure `backend/bun.lock` is committed |
| SSL warning / admin portal timeouts | Strip local `sslrootcert=~/.postgresql/...` from Render `DATABASE_URL`; set `DATABASE_CA_CERT` from Cockroach Cloud CA PEM |
| `net::ERR_TIMED_OUT` on admin RSC | Usually API/DB hang on Render (cold start or bad SSL path). Fix SSL first, then check `/health` |

---

## 6. Local vs production URLs

| | Local | Production |
| --- | --- | --- |
| Frontend | http://localhost:3000 | https://YOUR-APP.vercel.app |
| API | http://localhost:5001/api/v1 | https://YOUR-API.onrender.com/api/v1 |
| `FRONTEND_URL` (backend) | http://localhost:3000 | https://YOUR-APP.vercel.app |

Never point a production Vercel build at `localhost` for `NEXT_PUBLIC_API_URL`.
