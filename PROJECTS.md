# Bon Air Media — Project Index

Umbrella monorepo: **[XtianBDevn/bonair](https://github.com/XtianBDevn/bonair)**. Each product below is its own Git repo, linked here as a **submodule**.

## Products (submodules)

| Path | Product | Stack | GitHub | Dev port |
|------|---------|-------|--------|----------|
| `saas/` | Bon Air Campaigns | .NET API + Next.js | [bon-air-ai](https://github.com/XtianBDevn/bon-air-ai) | 3000 (web) |
| `apps/bon-air-local-ai/` | Bon Air Local AI (SEO / GBP / geo) | Next.js + Prisma | [bon-air-local-ai](https://github.com/XtianBDevn/bon-air-local-ai) | 3001 |
| `apps/seren-legal/` | Seren Legal CRM / intake | Next.js + Prisma | [seren-law](https://github.com/XtianBDevn/seren-law) | 3002 |
| `sites/bonairmedia.com/` | Company marketing site | Next.js + GSAP | [bonairmedia](https://github.com/XtianBDevn/bonairmedia) | 3003 |

## Shared (in umbrella repo)

| Path | Purpose |
|------|---------|
| `shared/ts-lib/` | `@bon-air/ts-lib` — auth, Stripe, Prisma helpers for Next apps |
| `shared/python-webscraper/` | Python scraper ([bon-air-media-scraper](https://github.com/XtianBDevn/bon-air-media-scraper) submodule) |

## Clone

```bash
git clone --recurse-submodules https://github.com/XtianBDevn/bonair.git
cd bonair
git submodule update --init --recursive
npm install   # Turborepo workspaces (ts-lib + both Next apps)
```

## Quick start

```bash
# From repo root (Turborepo)
npm run dev:local-ai    # http://localhost:3001
npm run dev:seren       # http://localhost:3002

# Campaigns SaaS
cd saas && docker compose up -d

# Marketing site (submodule)
cd sites/bonairmedia.com && npm install && npm run dev   # :3003

# DB (per product — see each app's infra/docker-compose.yml)
npm run db:migrate
npm run db:seed
npm run test:e2e
```

## Submodule workflow

1. Change code inside the product directory (e.g. `apps/seren-legal/`).
2. Commit and push **in that product repo**.
3. In `bonair`, commit the updated submodule SHA only.

```bash
cd apps/seren-legal
git add . && git commit -m "Your message" && git push
cd ../..
git add apps/seren-legal
git commit -m "Bump seren-legal submodule"
```

## Related repos (not in this tree)

| Repo | Notes |
|------|--------|
| [serenauth](https://github.com/XtianBDevn/serenauth) | Prior auth product (separate) |
| Client sites | `phillysteakandgyro`, `Herlongs-Tree-Service`, etc. |
