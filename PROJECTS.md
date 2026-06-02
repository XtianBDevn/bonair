# Bon Air Media — Project Index

Central map for this monorepo. Open the folder in **Cursor**; GitHub remote is [`XtianBDevn/bonair`](https://github.com/XtianBDevn/bonair).

## Layout

| Path | Product | Stack | GitHub | Deploy |
|------|---------|-------|--------|--------|
| `saas/` | Bon Air Campaigns (AI campaigns) | .NET API + Next.js | [bon-air-ai](https://github.com/XtianBDevn/bon-air-ai) | Railway (API), Vercel (web) |
| `apps/bon-air-local-ai/` | Local SEO / GBP / geo pages | Next.js + Prisma | *(this repo)* | Vercel (`apps/web`) |
| `apps/seren-legal/` | Seren Legal CRM / intake | Next.js + Prisma | [seren-law](https://github.com/XtianBDevn/seren-law) *(private, may diverge)* | Vercel (`apps/web`) |
| `sites/bonairmedia.com/` | Company marketing site | Next.js + GSAP / Three.js | [bonairmedia](https://github.com/XtianBDevn/bonairmedia) | Vercel |
| `shared/python-webscraper/` | Shared scraper library | Python | [bon-air-media-scraper](https://github.com/XtianBDevn/bon-air-media-scraper) | pip install -e |

## Submodules

These three paths are **git submodules** (separate repos, pinned commits in `bonair`):

```bash
git submodule update --init --recursive   # first clone
git submodule update --remote saas        # optional: advance submodule to latest main
```

## Quick start (per project)

```bash
# SaaS (see saas/README.md)
cd saas && docker compose up -d

# Bon Air Local AI
cd apps/bon-air-local-ai/apps/web && npm install && npm run dev

# Seren Legal
cd apps/seren-legal/apps/web && npm install && npm run dev

# Company site
cd sites/bonairmedia.com && npm install && npm run dev

# Scraper
cd shared/python-webscraper && pip install -e .
```

## Related GitHub repos (not in this tree)

| Repo | Notes |
|------|--------|
| [seren-law](https://github.com/XtianBDevn/seren-law) | May mirror `apps/seren-legal` |
| [serenauth](https://github.com/XtianBDevn/serenauth) | Prior auth product |
| Client sites | `phillysteakandgyro`, `Herlongs-Tree-Service`, etc. |

## Workflow

1. **Cursor** — work at repo root; rules in `.cursor/rules/`.
2. **GitHub** — push `bonair` for apps + docs; push submodule repos when changing `saas/`, `sites/bonairmedia.com/`, or `shared/python-webscraper/`.
3. **Branches** — `main` on parent; feature branches `feature/<area>-<description>`.
