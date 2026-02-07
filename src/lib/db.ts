import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  // For build time or when DATABASE_URL is not set, use a mock adapter
  if (!connectionString) {
    console.warn("DATABASE_URL not set, using empty adapter");
    // Return a client that will fail at runtime but pass build
    return new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString: "postgresql://localhost:5432/dummy" })),
    });
  }

  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
