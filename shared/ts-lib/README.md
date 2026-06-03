# @bon-air/ts-lib

Shared TypeScript utilities for Bon Air Media Next.js apps (`bon-air-local-ai`, `seren-legal`).

## Exports

- **utils** — `cn`, `slugify`
- **env** — `validateServerEnv`, `getAppUrl`, OpenAI helpers, `isStripeConfigured`
- **api** — `jsonOk`, `jsonError`
- **password** — `hashPassword`, `verifyPassword`
- **jwt** — `getJwtSecret`, `verifyJwtPayload`
- **stripe** — `getStripe`
- **prisma** — `createPrismaClient` (pass each app's generated `PrismaClient`)

## Usage

```ts
// Client components
import { cn, slugify } from "@bon-air/ts-lib";

// Server routes / lib
import { jsonOk, createPrismaClient, getStripe } from "@bon-air/ts-lib/server";
import { PrismaClient } from "@prisma/client";

export const prisma = createPrismaClient(PrismaClient, {
  cacheKey: "local-ai",
});
```

Build before app builds (handled by Turborepo `^build` dependency):

```bash
npm run build --workspace=@bon-air/ts-lib
```
