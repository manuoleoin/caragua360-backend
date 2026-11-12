import path from "node:path";

function normalizeDatabaseUrl(raw: any) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol.startsWith("postgres")) {
      const ssl = url.searchParams.get("ssl");
      url.searchParams.delete("ssl");
      if (ssl === "true" || ssl === "1")
        url.searchParams.set("sslmode", "require");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const isProduction = process.env.NODE_ENV === "production";
const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL),
  jwtSecret: process.env.CARAGUA_JWT_SECRET ?? "caragua360-dev-secret",
  jwtIssuer: "caragua360",
  sessionCookieName: "caragua_session",
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
  loginMaxAttempts: 3,
  loginLockMinutes: 15,
  passwordResetTtlMs: 24 * 60 * 60 * 1000,
  uploadDir: path.resolve(
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
  ),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? "Caragua360 <no-reply@caragua360.local>",
  },
  balneability: {
    apiUrl: process.env.BALNEABILITY_API_URL ?? "",
    sourceName: process.env.BALNEABILITY_SOURCE_NAME ?? "CETESB",
    timeoutMs: Number(process.env.BALNEABILITY_TIMEOUT_MS ?? 8000),
  },
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? "",
};

export { env };
