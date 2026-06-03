# Bon Air Media — Next.js apps workspace

Managed with **npm workspaces** + **Turborepo** from the **bonair** umbrella repo root.

Each product folder is a **git submodule** with its own GitHub repository. Develop Next.js apps from the umbrella clone so `@bon-air/ts-lib` resolves via workspaces.

## Packages

| Package | Path | Dev URL |
|---------|------|---------|
| `@bon-air/ts-lib` | `shared/ts-lib` | — |
| `@bon-air/local-ai-web` | `bon-air-local-ai/apps/web` | http://localhost:3001 |
| `@bon-air/seren-legal-web` | `seren-legal/apps/web` | http://localhost:3002 |

## Commands (from repo root)

```bash
npm install
npm run build
npm run dev:local-ai
npm run dev:seren
npm run db:migrate
npm run db:seed
npm run test:e2e
```

## E2E tests

Requires Postgres running and seeds applied:

```bash
# Local AI
cd bon-air-local-ai && docker compose -f infra/docker-compose.yml up -d
cd apps/web && npm run db:migrate:deploy && npm run db:seed && npm run test:e2e

# Seren Legal
cd seren-legal && docker compose -f infra/docker-compose.yml up -d
cd apps/web && npm run db:migrate:deploy && npm run db:seed && npm run test:e2e
```

Demo logins: `demo@bonairlocal.ai` / `demo@serenlegal.ai` — password `demo1234`
