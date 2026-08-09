import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { createPoolConfig } from "./databaseSsl.js";

dotenv.config();

const { Pool } = pg;

// Prisma Client instance with PostgreSQL adapter
const prismaClientSingleton = () => {
  const rawConnectionString = process.env.DATABASE_URL;

  if (!rawConnectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const poolConfig = createPoolConfig(rawConnectionString);
  const pool = new Pool(poolConfig);

  pool.on("error", (err) => {
    console.error("🔴 Unexpected error on idle client:", err);
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis;

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached?.studentPlannerEvent && cached?.studentActivityLog) {
    return cached;
  }

  const client = prismaClientSingleton();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();

export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 as connected`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
