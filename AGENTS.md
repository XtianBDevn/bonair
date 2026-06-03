# Agent guide — Bon Air Media

## Repository

- **Umbrella:** [`XtianBDevn/bonair`](https://github.com/XtianBDevn/bonair) (this folder)
- **Index:** [PROJECTS.md](./PROJECTS.md)

## Submodules (products)

```bash
git submodule update --init --recursive
```

| Submodule | Own repo |
|-----------|----------|
| `saas/` | bon-air-ai |
| `apps/bon-air-local-ai/` | bon-air-local-ai |
| `apps/seren-legal/` | seren-law |
| `sites/bonairmedia.com/` | bonairmedia |
| `shared/python-webscraper/` | bon-air-media-scraper |

`shared/ts-lib/` is **not** a submodule — it ships with the umbrella repo and is consumed via npm workspaces.

## Workflow

1. Edit files inside the product submodule directory.
2. `git commit` + `git push` in that submodule.
3. In the umbrella repo: `git add <submodule-path>` and commit the new SHA.

## Safe defaults

- Never commit secrets or `.env` files.
- Run `npm install` from the umbrella root for Turborepo + `@bon-air/ts-lib`.
- Per-product Postgres: see `infra/docker-compose.yml` in each app folder.

## Cursor

- Rules: `.cursor/rules/bon-air-monorepo.mdc`
