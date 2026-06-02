import path from "node:path";
import { defineConfig } from "prisma/config";

const defaultDatabaseUrl =
  "postgresql://bonair:bonair@localhost:5433/bonair_local?schema=public";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
});
