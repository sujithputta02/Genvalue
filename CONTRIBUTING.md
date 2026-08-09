# Contributing to GenValue

Thanks for helping improve GenValue Academy — the marketing site, student LMS, and admin portal.

Please also read our [Code of Conduct](./CODE_OF_CONDUCT.md) and [Security](./SECURITY.md) notes.

## How we work

1. Open an issue describing the bug or feature before large changes.
2. Branch from `main` (`feat/…`, `fix/…`, or `docs/…`).
3. Open a pull request using the PR template and link the issue (`Closes #123`).
4. Keep PRs focused — one concern per PR when possible.

## Development setup

See the [README](./README.md) for prerequisites and `bun run dev:full`.

```bash
git clone git@github.com:PuttaSathvik16/Genvalue.git
cd Genvalue
bun install
cp .env.example .env.local
cp .env.example backend/.env   # fill secrets locally — never commit them
bun run dev:full
```

| App | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |

## Project conventions

- **Stack:** Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion; Express/Bun API under `backend/`.
- **Types:** Prefer interfaces from `src/data/course.ts` and related data modules — avoid `any`.
- **Components:** Functional components with named exports; add `aria-label`s on interactive elements.
- **Site copy / contacts:** Import constants from `src/lib/constants.ts`; course data from `src/data/course.ts`.
- **API routes:** New HTTP APIs belong under `/api/v1/`; keep `/api/` only as a legacy alias.
- **Secrets:** Never commit API keys, tokens, or service-account JSON. Use env vars only.
- **Uploads:** Profile images via Cloudinary (JPEG/PNG/WebP/GIF, max 5 MB). Assignment PDFs stay URL-only until a dedicated upload pipeline exists.
- **Motion:** Use Framer Motion and respect `prefers-reduced-motion`.

## Pull request checklist

- [ ] Change matches an issue (or explains why it doesn’t need one)
- [ ] TypeScript builds; no unrelated refactors
- [ ] Loading / error states handled for new UI paths
- [ ] No secrets or local-only paths in the diff
- [ ] Docs updated when behavior or setup changes

## Reporting security issues

Do **not** open a public issue for vulnerabilities. Email
[genvalue.academy@gmail.com](mailto:genvalue.academy@gmail.com) with details so we can coordinate a fix.

## Questions

Open a GitHub Discussion/issue, or email [genvalue.academy@gmail.com](mailto:genvalue.academy@gmail.com).
