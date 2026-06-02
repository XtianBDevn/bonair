# Agent guide — Bon Air Media

## Repository

- **Root:** `bon-air-media` (local) → GitHub [`XtianBDevn/bonair`](https://github.com/XtianBDevn/bonair)
- **Index:** [PROJECTS.md](./PROJECTS.md)

## Submodules

Before editing `saas/`, `sites/bonairmedia.com/`, or `shared/python-webscraper/`:

```bash
git submodule update --init --recursive
```

After submodule changes, commit inside the submodule, then commit the updated pointer in the parent repo.

## Safe defaults

- Never read or commit API keys, Stripe secrets, or database URLs.
- Run installs and dev servers from the project subdirectory listed in `PROJECTS.md`.
- For Bon Air Campaigns (.NET), use `saas/docker-compose.yml` when testing API + DB locally.

## Cursor

- Rules: `.cursor/rules/bon-air-monorepo.mdc`
- Optional: enable GitHub MCP in Cursor Settings for PR/issue workflows.
