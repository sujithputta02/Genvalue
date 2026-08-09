import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function expandUserPath(filePath) {
  if (!filePath) return filePath;
  if (filePath.startsWith("~")) {
    return path.join(process.env.HOME || process.env.USERPROFILE || "", filePath.slice(1));
  }
  return filePath;
}

/**
 * Remove sslrootcert=... from the URL when the file is not present (common on Render
 * when the connection string was copied from a local cockroach download).
 */
export function sanitizeDatabaseUrl(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslRoot = url.searchParams.get("sslrootcert");
    if (sslRoot) {
      const resolved = expandUserPath(decodeURIComponent(sslRoot));
      if (!fs.existsSync(resolved)) {
        url.searchParams.delete("sslrootcert");
        console.warn(
          "⚠️  DATABASE_URL sslrootcert path missing on this host — removed from URL. Prefer DATABASE_CA_CERT env."
        );
        return url.toString();
      }
    }
    return connectionString;
  } catch {
    return connectionString;
  }
}

function readCaFromEnv() {
  const raw =
    process.env.DATABASE_CA_CERT ||
    process.env.COCKROACH_CA_CERT ||
    process.env.PG_CA_CERT ||
    "";
  if (!raw.trim()) return null;
  return raw.replace(/\\n/g, "\n").trim();
}

function readCaFromFile() {
  const candidates = [
    process.env.DATABASE_SSL_CERT_PATH,
    process.env.PGSSLROOTCERT,
    path.join(process.cwd(), "certs", "root.crt"),
    path.join(__dirname, "../../certs/root.crt"),
    expandUserPath("~/.postgresql/root.crt"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = expandUserPath(candidate);
    try {
      if (fs.existsSync(resolved)) {
        return { ca: fs.readFileSync(resolved).toString(), path: resolved };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

function wantsSsl(connectionString) {
  const lower = connectionString.toLowerCase();
  if (lower.includes("sslmode=disable")) return false;
  if (process.env.DATABASE_SSL === "false") return false;
  return (
    lower.includes("cockroach") ||
    lower.includes("sslmode=require") ||
    lower.includes("sslmode=verify") ||
    process.env.NODE_ENV === "production" ||
    process.env.DATABASE_SSL === "true"
  );
}

export function buildSslConfig(connectionString) {
  if (!wantsSsl(connectionString)) {
    return false;
  }

  const allowInsecure =
    process.env.DATABASE_SSL_INSECURE === "true" ||
    process.env.DATABASE_SSL_INSECURE === "1";

  const caFromEnv = readCaFromEnv();
  if (caFromEnv) {
    console.log("✅ Using SSL CA from DATABASE_CA_CERT / COCKROACH_CA_CERT");
    return {
      rejectUnauthorized: true,
      ca: caFromEnv,
    };
  }

  const caFromFile = readCaFromFile();
  if (caFromFile) {
    console.log(`✅ Using SSL certificate file: ${caFromFile.path}`);
    return {
      rejectUnauthorized: true,
      ca: caFromFile.ca,
    };
  }

  if (allowInsecure) {
    console.warn(
      "⚠️  DATABASE_SSL_INSECURE=true — TLS encryption on, certificate verification OFF (dev only)."
    );
    return { rejectUnauthorized: false };
  }

  if (process.env.NODE_ENV === "production") {
    console.log(
      "✅ Using TLS with system CA trust (set DATABASE_CA_CERT for Cockroach cluster CA if verify fails)."
    );
    return { rejectUnauthorized: true };
  }

  console.warn(
    "⚠️  No DATABASE_CA_CERT found — using TLS without CA pin in development. Set DATABASE_CA_CERT for verify-full."
  );
  return { rejectUnauthorized: false };
}

export function createPoolConfig(rawConnectionString, overrides = {}) {
  const connectionString = sanitizeDatabaseUrl(rawConnectionString);
  const sslConfig = buildSslConfig(connectionString);
  const poolConfig = {
    connectionString,
    max: Number(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    statement_timeout: 30000,
    keepalives: true,
    keepalives_idle: 30,
    ...overrides,
  };
  if (sslConfig) {
    poolConfig.ssl = sslConfig;
  }
  return poolConfig;
}
