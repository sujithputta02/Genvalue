import { prisma } from "../config/database.js";

const DEFAULT_MAX_AUTHORIZED_ADMINS = 5;
const DEFAULT_MAINTENANCE_MESSAGE =
  "GenValue LMS is temporarily under maintenance. Please check back shortly.";

function mapSettingsRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    maxAuthorizedAdmins: Number(row.maxAuthorizedAdmins),
    maintenanceMode: Boolean(row.maintenanceMode),
    maintenanceMessage:
      typeof row.maintenanceMessage === "string" && row.maintenanceMessage.trim()
        ? row.maintenanceMessage.trim()
        : DEFAULT_MAINTENANCE_MESSAGE,
    updatedAt: row.updatedAt,
    updatedByEmail: row.updatedByEmail ?? null,
  };
}

/**
 * Idempotent: ensures admin_portal_settings table exists with a default row.
 */
export async function ensureAdminPortalSettingsSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_portal_settings (
      id STRING NOT NULL PRIMARY KEY DEFAULT 'default',
      "maxAuthorizedAdmins" INT NOT NULL DEFAULT ${DEFAULT_MAX_AUTHORIZED_ADMINS},
      "updatedAt" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
      "updatedByEmail" STRING
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE admin_portal_settings
    ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOL NOT NULL DEFAULT false;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE admin_portal_settings
    ADD COLUMN IF NOT EXISTS "maintenanceMessage" STRING;
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO admin_portal_settings (id, "maxAuthorizedAdmins")
    SELECT 'default', ${DEFAULT_MAX_AUTHORIZED_ADMINS}
    WHERE NOT EXISTS (SELECT 1 FROM admin_portal_settings WHERE id = 'default');
  `).catch(() => {
    /* row may already exist */
  });
}

async function fetchSettingsRow() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT id, "maxAuthorizedAdmins", "maintenanceMode", "maintenanceMessage", "updatedAt", "updatedByEmail"
    FROM admin_portal_settings
    WHERE id = 'default'
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function getAdminPortalSettingsRecord() {
  await ensureAdminPortalSettingsSchema();

  let row = await fetchSettingsRow();
  if (!row) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO admin_portal_settings (id, "maxAuthorizedAdmins")
      VALUES ('default', ${DEFAULT_MAX_AUTHORIZED_ADMINS})
    `).catch(() => {
      /* concurrent insert */
    });
    row = await fetchSettingsRow();
  }

  return (
    mapSettingsRow(row) ?? {
      id: "default",
      maxAuthorizedAdmins: DEFAULT_MAX_AUTHORIZED_ADMINS,
      maintenanceMode: false,
      maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
      updatedAt: new Date(),
      updatedByEmail: null,
    }
  );
}

export async function updateAdminPortalSettingsRecord(maxAuthorizedAdmins, updatedByEmail) {
  await ensureAdminPortalSettingsSchema();

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO admin_portal_settings (id, "maxAuthorizedAdmins", "updatedByEmail", "updatedAt")
    VALUES ('default', $1, $2, current_timestamp())
    ON CONFLICT (id) DO UPDATE SET
      "maxAuthorizedAdmins" = EXCLUDED."maxAuthorizedAdmins",
      "updatedByEmail" = EXCLUDED."updatedByEmail",
      "updatedAt" = current_timestamp()
    `,
    maxAuthorizedAdmins,
    updatedByEmail
  );

  return getAdminPortalSettingsRecord();
}

export async function updateMaintenanceModeRecord({
  enabled,
  message,
  updatedByEmail,
}) {
  await ensureAdminPortalSettingsSchema();
  const settings = await getAdminPortalSettingsRecord();
  const nextMessage =
    typeof message === "string" && message.trim()
      ? message.trim().slice(0, 500)
      : settings.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE;

  await prisma.$executeRawUnsafe(
    `
    UPDATE admin_portal_settings
    SET
      "maintenanceMode" = $1,
      "maintenanceMessage" = $2,
      "updatedByEmail" = $3,
      "updatedAt" = current_timestamp()
    WHERE id = 'default'
    `,
    Boolean(enabled),
    nextMessage,
    updatedByEmail ?? null
  );

  return getAdminPortalSettingsRecord();
}

export async function countActiveNonSuperAdmins() {
  return prisma.authorizedAdmin.count({
    where: { isActive: true, isSuperAdmin: false },
  });
}

export { DEFAULT_MAINTENANCE_MESSAGE };
