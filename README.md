# GenValue Academy

Practical AI education platform for **GenValue Academy** — marketing site, student LMS, and admin portal in one codebase.

> **Choosing the Right AI Tool for Every Task**

**Flagship program:** [AI Tools Mastery](https://genvalue.academy) — 12 weeks · 40+ tools · 11 categories · 1 capstone  

**Repository:** [github.com/PuttaSathvik16/Genvalue](https://github.com/PuttaSathvik16/Genvalue)

---

## What’s included

| Surface | Path | Purpose |
| --- | --- | --- |
| **Marketing site** | `/`, `/courses`, `/syllabus`, `/about`, `/team`, `/instructors`, `/blog`, `/contact` | SEO landing, syllabus, team, contact, blog |
| **Student LMS** | `/auth/*`, `/dashboard/*` | Firebase login, lessons, quizzes, assignments, discussions, certificates, planner |
| **Instructor** | `/instructor/*` | Courses, assignment review, notifications |
| **Admin portal** | `/admin/*` | OTP login, students, curriculum editor, grading, announcements, security, bug reports |
| **API** | Express on `:5001` | Canonical `/api/v1/*` (legacy `/api/*` alias) |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Motion / UI | Framer Motion, Headless UI, react-icons |
| Forms | react-hook-form + Zod |
| Student auth | Firebase Authentication |
| Admin auth | Brevo OTP + HMAC-signed session (`ADMIN_JWT_SECRET`) |
| Backend | Express (Bun), Prisma 7, PostgreSQL / CockroachDB |
| Email | Brevo (SMTP for contact form; SMTP/API for admin OTP & alerts) |
| Media | Cloudinary (profile / blog images) |
| Hosting | Vercel (frontend) + separate host for Express (e.g. Railway / Fly) |

---

## Prerequisites

- **Bun** (recommended for backend + fullstack scripts) or Node.js 20+
- **PostgreSQL** or **CockroachDB** connection string
- Firebase project (client + service account for Admin SDK)
- Brevo account (transactional / SMTP)
- Cloudinary account (uploads)

---

## Quick start

```bash
git clone git@github.com:PuttaSathvik16/Genvalue.git
cd Genvalue

# Install frontend deps
bun install          # or: npm install

# Env files (never commit real secrets)
cp .env.example .env.local
cp .env.example backend/.env   # then fill backend-only keys (DATABASE_URL, PORT, etc.)

# Backend: generate client, migrate, seed (from backend/)
cd backend
# set PORT=5001 to match NEXT_PUBLIC_API_URL
bun run prisma:generate
bun run prisma:migrate:dev
bun run seed                 # optional
cd ..

# Run both apps
bun run dev:full
```

| App | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |
| Health check Route | http://localhost:5001/health |

### Useful scripts

**Root**

| Command | Description |
| --- | --- |
| `bun run dev` | Next.js frontend only |
| `bun run dev:backend` | Express API only |
| `bun run dev:full` | Frontend + backend together |
| `bun run build` / `start` | Production build / serve |
| `bun run lint` | ESLint |

**Backend** (`cd backend`)

| Command | Description |
| --- | --- |
| `bun run dev` | Prisma generate + watch server |
| `bun run start` | Production server |
| `bun run seed` | Seed database |
| `bun run prisma:studio` | Prisma Studio |
| `bun run firebase:verify` | Verify Firebase Admin credentials |

> Set `PORT=5001` in `backend/.env`. The server defaults to `5000` if unset, while the frontend example API URL expects **5001**.

---

## Environment variables

Copy [`.env.example`](./.env.example) → `.env.local` (frontend) and `backend/.env` (API).  
**Do not commit** `.env`, `.env.local`, or `backend/.env`.

### Shared / frontend

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin (no trailing slash). Falls back to `https://genvalue.academy` |
| `NEXT_PUBLIC_API_URL` | Backend base, e.g. `http://localhost:5001/api/v1` |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`) |
| `NEXTAUTH_SECRET` | NextAuth secret (legacy path if used) |
| `BREVO_*` | API / SMTP keys, sender & team inbox (contact form + alerts) |
| `SUPER_ADMIN_EMAIL` | Primary super-admin for seeding / OTP |
| `ADMIN_JWT_SECRET` | Signs admin portal sessions |

### Backend-only

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres / CockroachDB connection string |
| `PORT` | Prefer `5001` locally |
| `FRONTEND_URL` | CORS origin, e.g. `http://localhost:3000` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin JSON (or path per your setup) |
| `CLOUDINARY_*` | Cloud upload credentials (see `SETUP_GUIDE.md` / backend config) |

Contact form email uses **Brevo SMTP** (`BREVO_SMTP_USER` + `BREVO_SMTP_KEY`) so local sends work without REST API IP whitelisting. Team inbox defaults to `BREVO_TEAM_EMAIL` or the GenValue academy address.

---

## Features overview

### Marketing

- Hero + program narrative, tool categories, testimonials
- Syllabus page + PDF download
- About, team (founders / leadership), instructors
- Blog / Dispatch public feed
- Contact form → GenValue inbox via Brevo
- SEO: sitemap, robots, Open Graph

### Student LMS

- Email / Google sign-in (Firebase)
- Dashboard overview, enrollments, lesson player
- Quizzes, assignments (PDF URL submissions)
- Discussions, announcements, notifications
- Certificates, activity heatmap + planner
- Profile image upload (Cloudinary)
- In-app bug reporting

### Admin portal

- Secure OTP login (email via Brevo)
- Students, courses, week/module editor
- Assignments, submissions, quizzes
- Announcements, discussions moderation
- Dispatch / blog approval
- Authorized admins & portal roles
- Audit logs, security checks, bug reports

---

## Project structure

```text
Genvalue/
├── src/
│   ├── app/                 # App Router (marketing, LMS, admin, thin API routes)
│   ├── components/          # UI sections, layout, dashboard, blog, admin widgets
│   ├── data/                # Course copy, founders, static posts
│   ├── lib/                 # Auth helpers, API client, Brevo/contact, constants
│   ├── services/            # Frontend → backend API services
│   ├── types/               # Shared TypeScript types
│   └── proxy.ts             # Portal / session path protection
├── backend/
│   ├── prisma/              # Schema, migrations, seed
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/          # apiV1 + mounts
│   │   ├── services/        # email, Cloudinary, Firebase Admin
│   │   └── server.js
│   └── package.json
├── public/                  # Images, videos, syllabus PDF, favicons
├── docs/                    # Marketing / video scripts
├── .env.example
├── SETUP_GUIDE.md
├── SECURITY.md
└── vercel.json              # Next.js deploy on Vercel
```

---

## API conventions

- **Canonical base:** `{API_HOST}/api/v1`
- **Legacy alias:** `{API_HOST}/api` (same router)
- Student requests: `Authorization: Bearer <Firebase ID token>`
- Admin requests: signed session / admin token per portal middleware
- Frontend client: `src/lib/api.ts` (normalizes to `/api/v1`)

Thin Next.js routes (no Express):

- `POST /api/contact` — contact form email
- `POST /api/track-download` — syllabus download analytics
- `/api/auth/[...nextauth]` — NextAuth (if enabled)
- Admin OTP helpers under `/api/admin/*` (where used)

---

## Deployment

**Production target:** frontend on **Vercel**, API on **Render** (Docker).

Full step-by-step checklist (env vars, Firebase domains, smoke tests):

→ **[`docs/PRODUCTION.md`](./docs/PRODUCTION.md)**

### Short version

1. **Render** — Blueprint from repo root (`render.yaml`) or Docker web service with root `backend/`. Set secrets; confirm `GET /health`.
2. Run `prisma migrate deploy` against production `DATABASE_URL`.
3. **Vercel** — Import repo root as Next.js. Set `NEXT_PUBLIC_API_URL` to `https://YOUR-API.onrender.com/api/v1` and Firebase `NEXT_PUBLIC_*` keys. Set Brevo SMTP for the contact form.
4. Set Render `FRONTEND_URL` to your exact Vercel URL (`https://….vercel.app`).
5. Add that Vercel host under Firebase **Authorized domains**.

| Host | What | Config |
| --- | --- | --- |
| Vercel | Next.js | [`vercel.json`](./vercel.json) |
| Render | Express API | [`render.yaml`](./render.yaml) + [`backend/Dockerfile`](./backend/Dockerfile) |

---

## Security (summary)

- Student credentials via **Firebase Auth** — verify ID tokens on the server
- Admin via **OTP + signed session** — not student passwords
- Rate limits on auth / OTP routes
- Prisma parameterized queries; sanitize user input
- Profile images: JPEG/PNG/WebP/GIF ≤ 5 MB → Cloudinary
- Assignment PDFs: HTTPS URL only until a dedicated upload pipeline exists
- Secrets only in environment variables — never in source

See [`SECURITY.md`](./SECURITY.md) for the full checklist.

---

## Further docs

| Doc | Topic |
| --- | --- |
| [`docs/PRODUCTION.md`](./docs/PRODUCTION.md) | **Vercel + Render production deploy** |
| [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) | Running frontend + backend together locally |
| [`QUICK_START.md`](./QUICK_START.md) | Fast onboarding notes |
| [`SECURITY.md`](./SECURITY.md) | Auth, headers, threat notes |
| [`docs/`](./docs/) | Marketing video scripts |
| [`backend/.env.example`](./backend/.env.example) | Backend / Render env template |

---

## Brand

- **Academy:** GenValue Academy  
- **Contact:** genvalue.academy@gmail.com  
- **Tagline:** Choosing the Right AI Tool for Every Task  

---

## License

Private / all rights reserved unless otherwise specified by the project owner.
