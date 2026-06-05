# RESEARCH: Tech Stack for BSC Doubles Squash Ranking Web App

**Date**: 2026-06-05  
**Source BR**: `docs/plans/BR-doubles-squash-ladder.md`  
**Context**: Replace the Google Sheets / Apps Script spec with a proper web application. Mobile-first responsive PWA, saveable as a home-screen bookmark on a phone. The ladder is publicly visible (no login). Only Admin and Scorer roles require Google Sign-In. Agent-built and agent-maintained.

---

## Decisions Captured During Grill

| Topic | Decision |
|---|---|
| Who submits sessions | Admin or Scorer — authenticated via Google Sign-In |
| Who views the ladder | **Public** — no login required (BR §2.3) |
| Scale | <20 players now; data must be permanent |
| Auth provider | Google OAuth only |
| Submission approval | Live immediately; admin or scorer-owner can delete/edit |
| Admin UI | Full in-app admin (players, sessions, settings, user/role management) |
| Recalculation strategy | Full recalc from scratch on every submit/edit/delete |
| Frontend preference | Agent-built — recommend the best fit for AI maintenance |
| Hosting budget | R50–R150/month (~€3–€8), growing to R150–R400 if multi-app |
| Database | PostgreSQL, self-hosted on VPS |
| Multi-app hosting | Start standalone, plan for consolidation later |
| App scope | Full replacement of Google Sheet — all features in BR |
| CI/CD | GitHub Actions preferred |
| Domain | squash.tomlinson.co.za (or similar sub-domain) |
| Google Cloud project | New project using atholl@tomlinson.co.za |
| First admin account | atholl@tomlinson.co.za |
| PWA display name | "Doubles Squash @ BSC" |
| Player identity | Name only (first name sufficient); players are NOT linked to Google accounts |
| Submitter identity | Separate `users` table for Google accounts with Admin/Scorer roles |

---

## Recommended Stack

### Summary

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Best AI-maintainability, explicit conventions, full-stack in one repo |
| **Language** | TypeScript (strict) | Catches errors early; agents produce better typed code |
| **Styling** | Tailwind CSS | Utility-first, no custom CSS files to maintain, mobile-first by default |
| **Database ORM** | Prisma | Strongly typed, excellent schema migration story, AI-friendly |
| **Database** | PostgreSQL 16 (self-hosted Docker) | Same server = zero latency, no managed DB cost, full control |
| **Auth** | Auth.js v5 (NextAuth) + Google OAuth | Native App Router support, JWT sessions, simple allowlist |
| **PWA** | Serwist (`@serwist/next`) | Actively maintained successor to `next-pwa` |
| **Reverse proxy** | Caddy 2 | Auto-SSL, zero-config, ideal for Docker Compose |
| **Hosting** | Hetzner Cloud CX22, Cape Town (ZA) | ~€4.90/mo, lowest ZA latency, Docker CE one-click |
| **CI/CD** | GitHub Actions → SSH deploy | Simple, fully automatable, agent-manageable |
| **Backups** | `pg_dump` cron → Hetzner Object Storage | ~€2/mo for 20GB, S3-compatible |

**Estimated total monthly cost: ~€7–€10/month (~R135–R190)**

---

## 1. Framework: Next.js 15 (App Router)

### Why Next.js for an agent-maintained codebase

- **File-based routing** — routes map 1:1 to the file system; no hidden config.
- **Collocated server + client code** — API routes live in `/app/api`; no separate backend repo to maintain.
- **Single language** — TypeScript throughout; agents don't context-switch.
- **Massive documentation surface** — agents trained on Next.js docs produce accurate code.
- **Server Components + Server Actions** — data mutations (submit session, delete session) can be written as simple server-side functions; less client-side state to manage.

### Trade-offs considered

| Option | Verdict |
|---|---|
| Remix | Good AI maintainability, but smaller ecosystem and docs surface than Next.js |
| SvelteKit | Svelte syntax is less common in training data; worse AI output quality |
| Express + React SPA | Separate backend/frontend = double the surface area to maintain |
| **Next.js 15** | **Recommended — best for agent-built, agent-maintained systems** |

### Relevant structure for this app

```
/app
  /                          ← Ladder — PUBLIC, no login
  /sessions                  ← Session history — PUBLIC
  /players/[id]              ← Player rating trend — PUBLIC
  /unauthorised              ← Shown when a Google account isn't in users table

  /submit                    ← Submit a session — Admin or Scorer
  /sessions/[id]/edit        ← Edit a session — Admin, or Scorer (own only)

  /admin
    /players                 ← Add / edit / remove players
    /sessions                ← View and delete any session
    /settings                ← Edit rating algorithm settings
    /users                   ← Manage Google accounts and roles (Admin only)

  /api/auth/[...nextauth]    ← Auth.js handler
```

Data mutations (submit, edit, delete, recalc) are implemented as **Next.js Server Actions**, not REST API routes. This keeps the surface area minimal and avoids a separate API layer.

---

## 2. Authentication: Auth.js v5 (NextAuth) + Google OAuth

### Approach

The ladder, session history, and player trend pages are **publicly accessible** — no login required.  
Only the Submit, Edit/Delete session, and Admin routes require a signed-in Google account.

Players on the ladder are **not linked to Google accounts**. Most players will never log in. They are identified by name only (first name is sufficient). The `players` table is purely a name roster used for session capture and rating calculation.

Authentication is for a separate, much smaller set of people: the Admin and Scorers who manage data.

### Data model separation

```
players        ← name roster (no Google account)
users          ← Google accounts with a role (admin | scorer)
```

The `users` table is seeded with `atholl@tomlinson.co.za` as the first Admin on first deploy. From then on, the Admin UI manages who has login access — no code changes or redeploys required.

### Auth.js v5 on self-hosted Next.js

- Session stored as **JWT in a secure HTTP-only cookie** — no database session table needed.
- `NEXTAUTH_URL` must equal the public domain (e.g. `https://squash.tomlinson.co.za`).
- `NEXTAUTH_SECRET` is a random 32-byte base64 string — store in `.env` and GitHub Secrets.

### Access control flow

```
User clicks "Sign In with Google"
  → Auth.js receives Google profile
  → signIn callback queries users table for matching email
  → if not found → deny (redirect to /unauthorised)
  → if found → allow; attach role to JWT
```

The `signIn` callback:
```typescript
async signIn({ user }) {
  const appUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!appUser) return "/unauthorised"; // deny
  return true;
}
```

The `jwt` callback adds the role to the token so middleware can gate admin routes without a database call per request:
```typescript
async jwt({ token, user }) {
  if (user) {
    const appUser = await prisma.user.findUnique({ where: { email: user.email } });
    token.role = appUser?.role ?? "scorer";
  }
  return token;
}
```

### Route protection (middleware)

```typescript
// middleware.ts
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const role = req.auth?.token?.role;

  // Public routes — no auth needed
  if (pathname === "/" || pathname.startsWith("/sessions") || pathname.startsWith("/players/")) {
    return NextResponse.next();
  }
  // All other routes require login
  if (!isAuthenticated) return Response.redirect(new URL("/api/auth/signin", req.url));
  // Admin-only routes
  if (pathname.startsWith("/admin") && role !== "admin") {
    return Response.redirect(new URL("/unauthorised", req.url));
  }
});
```

### Role model

| Role | Can do |
|---|---|
| `admin` | Everything: manage players, settings, users (roles), submit/edit/delete any session |
| `scorer` | Submit sessions; edit/delete own sessions; add players on-the-fly |

### Key environment variables

```bash
NEXTAUTH_URL=https://squash.tomlinson.co.za
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
DATABASE_URL=postgresql://postgres:<password>@postgres:5432/squash
```

### Seed on first deploy

```sql
INSERT INTO users (email, name, role)
VALUES ('atholl@tomlinson.co.za', 'Atholl', 'admin');
```

This is a Prisma seed file — runs once via `prisma db seed` in the CI/CD pipeline.

### Gotchas

1. `NEXTAUTH_URL` must be set in production or OAuth redirect silently fails.
2. Changing `NEXTAUTH_SECRET` invalidates all active sessions.
3. Google OAuth requires the exact redirect URI registered in Google Cloud Console:  
   `https://squash.tomlinson.co.za/api/auth/callback/google`
4. Google Cloud Console OAuth consent screen must list `tomlinson.co.za` as an authorised domain.

---

## 3. Database: PostgreSQL 16 (self-hosted in Docker)

### Why self-hosted beats managed for this app

| Factor | Self-hosted (Docker, Hetzner ZA) | Supabase free tier | Neon free tier |
|---|---|---|---|
| **Latency** | ~0ms (same server) | ~150–200ms (EU region) | ~180–250ms (no ZA) |
| **Cost** | Included in VPS | Free (with limits) | Free (with limits) |
| **Pausing** | Never | No (free tier always-on) | Auto-pauses after 5 min inactivity |
| **ZA region** | Yes (Hetzner Cape Town) | No | No |
| **Maintenance** | ~30 min/month | Zero | Zero |
| **Vendor lock-in** | None | Low (standard PG) | Low (standard PG) |

For a small ZA-hosted app, the latency difference of 150–250ms to a cloud-managed database is the killer issue. Self-hosted Postgres on the same Hetzner VPS has effectively zero latency between the Next.js container and Postgres.

### Docker image

```
postgres:16-alpine
```

Use a pinned minor version (e.g., `16.3-alpine`) in production — avoid `latest`.

### Backups

```bash
# Daily cron inside the VPS:
docker exec postgres pg_dump -U postgres squash | gzip \
  | aws s3 cp - s3://squash-backups/$(date +%Y-%m-%d).sql.gz \
  --endpoint-url https://fsn1.your-objectstorage.com
```

Hetzner Object Storage is S3-compatible, ~€0.0095/GB/month. 30 daily backups of this database = negligible cost (<€1/month).

### Schema overview (Prisma)

The spec maps cleanly to these tables:

```
players          ← Players tab
settings         ← Settings tab  
sessions         ← Sessions tab (one row per form submission)
session_players  ← Session_Players tab (one row per player per session)
ratings_log      ← Ratings_Log tab
```

`current_ratings` and `ladder` are **computed on demand** (full recalc), not stored tables. This matches the spec's "recalculate from scratch" requirement.

---

## 4. ORM: Prisma

### Why Prisma

- Schema is defined in a single `schema.prisma` file — agent can read/modify it unambiguously.
- `prisma migrate dev` manages schema migrations with version history.
- Generated TypeScript client is fully typed — agents catch type errors before runtime.
- Works natively with PostgreSQL 16.

### Alternatives considered

| Option | Verdict |
|---|---|
| Drizzle ORM | Growing fast, type-safe, but less agent training data |
| Kysely | Very explicit SQL, good for agents, but more verbose |
| Raw SQL (`pg`) | Maximum control, but no type safety or migrations |
| **Prisma** | **Recommended — best AI-maintainability and migration tooling** |

---

## 5. Styling: Tailwind CSS

- Mobile-first by default (`sm:`, `md:` breakpoints).
- No separate CSS files for agents to track.
- Widely used — high-quality agent output.
- Works well with shadcn/ui (pre-built accessible components).

**Recommended UI components:** shadcn/ui — copy-paste components, no dependency lock-in, TypeScript-native. Ideal for agent maintenance.

---

## 6. PWA: Serwist (`@serwist/next`)

### Background

The original `next-pwa` package (shadowwalker/next-pwa) has **123 open issues** and shows limited maintenance activity. **Serwist** is the actively maintained successor (1,700+ commits, 6 open issues as of 2025).

### What it provides

- `manifest.json` — enables "Add to Home Screen" on iOS/Android.
- Service worker — enables offline fallback page.
- HTTPS is required (Caddy handles this automatically).

### Minimal config

```typescript
// next.config.ts
import withSerwist from "@serwist/next";

const withSerwistConfig = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwistConfig({
  // standard next config
});
```

```json
// public/manifest.json
{
  "name": "BSC Squash Ladder",
  "short_name": "Squash",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a1a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 7. Hosting: Hetzner Cloud, Cape Town (ZA)

### Server tier recommendation

**Start with CX22** (~€4.90/month):
- 2 vCPU (shared), 4GB RAM, 40GB NVMe SSD
- Sufficient for Next.js + Postgres + Caddy for <100 concurrent users
- Upgrade to CX32 (~€7.90/month, 8GB RAM) when/if adding a second app

**OS:** Ubuntu 24.04 LTS (5-year support, Docker CE one-click app available in Hetzner console)

### Hetzner ZA notes

- Cape Town datacenter is confirmed operational.
- No managed database offered in ZA — self-hosted Postgres is the correct choice.
- Hetzner Object Storage (S3-compatible) available for backups.
- Hetzner Firewall (free) — allow only ports 80, 443, 22.

### Docker Compose layout

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: squash
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nextjs:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/squash
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  caddy_data:
```

```
# Caddyfile
squash.tomlinson.co.za {
  reverse_proxy nextjs:3000
}
```

Caddy auto-provisions a Let's Encrypt TLS certificate on first start. No manual certificate management.

### Next.js Dockerfile (production)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Requires `output: 'standalone'` in `next.config.ts`.

---

## 8. CI/CD: GitHub Actions → SSH Deploy

### Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          docker build -t ghcr.io/${{ github.repository }}:latest .
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}:latest

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/deploy/squash
            docker pull ghcr.io/${{ github.repository }}:latest
            docker compose up -d --no-deps nextjs
            docker exec squash-nextjs-1 npx prisma migrate deploy
```

### GitHub Secrets required

| Secret | Value |
|---|---|
| `VPS_HOST` | Hetzner VPS IP |
| `VPS_SSH_KEY` | SSH private key for `deploy` user |
| `DB_PASSWORD` | Postgres password (also in VPS `.env`) |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | `https://squash.tomlinson.co.za` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

### Deployment model notes

- Only the `nextjs` container is redeployed on each push; Postgres and Caddy are unaffected.
- `prisma migrate deploy` runs automatically after each deploy — schema changes are applied in CI.
- The `.env` file on the VPS holds the same secrets; Docker Compose reads them at runtime.
- This pattern is simple enough for an AI agent to maintain and extend.

---

## 9. Future-Proofing: Adding More Apps

When you're ready to add a second app to the same VPS:

1. Add a new service to `docker-compose.yml` (new Next.js container + its own Postgres service or shared Postgres with a new database).
2. Add a new block to the `Caddyfile` pointing at the new service's port.
3. Add a new GitHub Actions workflow for the new repo.
4. Upgrade from CX22 to CX32 if RAM becomes a constraint.

No architectural changes required — the Docker Compose + Caddy pattern scales to 4–6 small apps on a single CX32 without issue.

---

## 10. Confirmed Details

All open questions resolved:

| Item | Answer |
|---|---|
| **Domain** | `squash.tomlinson.co.za` (subdomain of existing domain) |
| **Google Cloud project** | New project, created under `atholl@tomlinson.co.za` |
| **First admin account** | `atholl@tomlinson.co.za` — seeded on first deploy |
| **PWA display name** | `Doubles Squash @ BSC` |
| **Player names** | First name only is sufficient; no Google account linkage |
| **Submitters** | Separate `users` table; not all players will ever log in |

---

## Next Step

The research and all decisions are complete. The recommended next step is to write the PRD, which translates the BR (`docs/plans/BR-doubles-squash-ladder.md`) and the technical decisions in this document into a full product specification for the web app.

Run: `write the PRD` when ready.
