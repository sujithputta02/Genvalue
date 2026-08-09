import { prisma } from "../config/database.js";
import crypto from "crypto";

/**
 * Idempotent: ensures admin_login_logs table exists for admin portal sign-in audit trail.
 */
export async function ensureAdminLoginLogSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_login_logs (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      "adminId" STRING,
      email STRING NOT NULL,
      name STRING NOT NULL,
      "ipAddress" STRING,
      "userAgent" STRING,
      "createdAt" TIMESTAMP NOT NULL DEFAULT current_timestamp()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS admin_login_logs_created_at_idx ON admin_login_logs ("createdAt");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS admin_login_logs_email_idx ON admin_login_logs (email);
  `);
}

export async function insertAdminLoginLog({
  adminId,
  email,
  name,
  ipAddress,
  userAgent,
}) {
  await ensureAdminLoginLogSchema();

  const id = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO admin_login_logs (id, "adminId", email, name, "ipAddress", "userAgent")
    VALUES (
      ${id},
      ${adminId ?? null},
      ${email},
      ${name},
      ${ipAddress ?? null},
      ${userAgent ?? null}
    )
  `;

  return id;
}

export async function fetchRecentAdminLoginLogs(limit = 100) {
  await ensureAdminLoginLogSchema();

  const rows = await prisma.$queryRaw`
    SELECT id, "adminId", email, name, "ipAddress", "userAgent", "createdAt"
    FROM admin_login_logs
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;

  return rows;
}
