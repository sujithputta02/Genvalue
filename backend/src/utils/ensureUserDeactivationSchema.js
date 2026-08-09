import { prisma } from "../config/database.js";

/**
 * Idempotent: ensures temporary deactivation columns on users.
 */
export async function ensureUserDeactivationSchema() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "deactivatedUntil" TIMESTAMP;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "deactivationReason" STRING;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS users_deactivatedUntil_idx ON users ("deactivatedUntil");
  `);
}
