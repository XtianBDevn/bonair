import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

type PrismaClientConstructor = new (options?: {
  adapter?: PrismaPg;
  log?: Array<"query" | "info" | "warn" | "error">;
}) => object;

const globalForPrisma = globalThis as unknown as {
  prismaByKey: Map<string, object>;
};

function getPrismaStore() {
  if (!globalForPrisma.prismaByKey) {
    globalForPrisma.prismaByKey = new Map();
  }
  return globalForPrisma.prismaByKey;
}

/**
 * Singleton Prisma client factory (each app passes its generated PrismaClient class).
 */
export function createPrismaClient<T extends object>(
  Client: PrismaClientConstructor,
  options?: { connectionString?: string; cacheKey?: string }
): T {
  const cacheKey = options?.cacheKey ?? Client.name;
  const store = getPrismaStore();

  if (process.env.NODE_ENV !== "production" && store.has(cacheKey)) {
    return store.get(cacheKey) as T;
  }

  const connectionString =
    options?.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const client = new Client({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  }) as T;

  if (process.env.NODE_ENV !== "production") {
    store.set(cacheKey, client);
  }

  return client;
}
