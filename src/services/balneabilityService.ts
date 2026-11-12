import { prisma } from "../config/database";
import { env } from "../config/environment";
import { AppError } from "../middlewares/errorMiddleware";
const lastSync: {
  attemptedAt: Date | null;
  ok: boolean;
  error: string | null;
} = {
  attemptedAt: null,
  ok: false,
  error: null,
};
function normalizeName(value: any) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^praia\s+(de\s+|do\s+|da\s+)?/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function parseStatus(value: any) {
  const text = (value ?? "").toLowerCase();
  if (
    text.includes("impropri") ||
    text.includes("impr\xF3pri") ||
    text.includes("nao propria")
  )
    return "IMPROPRIA";
  if (
    text.includes("propri") ||
    text.includes("pr\xF3pri") ||
    text.includes("own")
  )
    return "PROPRIA";
  return "NAO_AVALIADA";
}
function integrationConfigured() {
  return Boolean(env.balneability.apiUrl);
}
async function latestRecords() {
  const rows = await prisma.balneabilityRecord.findMany({
    orderBy: [{ measuredAt: "desc" as const }, { fetchedAt: "desc" as const }],
    take: 200,
  });
  const seen = /* @__PURE__ */ new Set();
  const latest: {
    beachName: string;
    status: string;
    measuredAt: Date;
    source: string;
    sourceUrl: string | null;
    localId: number | null;
    fetchedAt: Date;
  }[] = [];
  for (const row of rows) {
    const key = normalizeName(row.beachName);
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push({
      beachName: row.beachName,
      status: row.status,
      measuredAt: row.measuredAt,
      source: row.source,
      sourceUrl: row.sourceUrl,
      localId: row.localId,
      fetchedAt: row.fetchedAt,
    });
  }
  return latest.sort((a, b) => a.beachName.localeCompare(b.beachName, "pt-BR"));
}
async function getBalneabilityOverview() {
  const beaches = await latestRecords();
  const lastUpdated = beaches.reduce(
    (acc: Date | null, item) =>
      !acc || item.measuredAt > acc ? item.measuredAt : acc,
    null,
  );
  const available = integrationConfigured() && lastSync.ok;
  return {
    available,
    integrationConfigured: integrationConfigured(),
    source: env.balneability.sourceName,
    lastUpdated,
    lastSyncAttempt: lastSync.attemptedAt,
    lastError: lastSync.error,
    beaches,
  };
}
async function syncBalneability() {
  lastSync.attemptedAt = /* @__PURE__ */ new Date();
  if (!integrationConfigured()) {
    lastSync.ok = false;
    lastSync.error =
      "API de balneabilidade n\xE3o configurada (BALNEABILITY_API_URL).";
    throw new AppError(503, "BALNEABILITY_NOT_CONFIGURED", lastSync.error);
  }
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    env.balneability.timeoutMs,
  );
  try {
    const response = await fetch(env.balneability.apiUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const list = Array.isArray(payload)
      ? payload
      : (payload.beaches ?? payload.data ?? []);
    if (list.length === 0) throw new Error("Resposta sem registros de praias.");
    const locals = await prisma.local.findMany({
      where: { category: "PRAIA" },
      select: { id: true, name: true },
    });
    const localByName = new Map(
      locals.map((local) => [normalizeName(local.name), local.id]),
    );
    let inserted = 0;
    for (const item of list) {
      const name = (item.name ?? item.beach ?? "").trim();
      if (!name) continue;
      const measuredAt = new Date(item.measuredAt ?? item.date ?? Date.now());
      if (Number.isNaN(measuredAt.getTime())) continue;
      const exists = await prisma.balneabilityRecord.findFirst({
        where: { beachName: name, measuredAt },
        select: { id: true },
      });
      if (exists) continue;
      await prisma.balneabilityRecord.create({
        data: {
          beachName: name,
          localId: localByName.get(normalizeName(name)) ?? null,
          status: parseStatus(item.status ?? item.situation),
          measuredAt,
          source: env.balneability.sourceName,
          sourceUrl: item.sourceUrl ?? env.balneability.apiUrl,
          raw: item,
        },
      });
      inserted += 1;
    }
    lastSync.ok = true;
    lastSync.error = null;
    return { success: true, inserted, beaches: list.length };
  } catch (error) {
    lastSync.ok = false;
    lastSync.error = error instanceof Error ? error.message : String(error);
    throw new AppError(
      503,
      "BALNEABILITY_UNAVAILABLE",
      `A API de balneabilidade est\xE1 indispon\xEDvel: ${lastSync.error}`,
    );
  } finally {
    clearTimeout(timer);
  }
}
export {
  getBalneabilityOverview,
  integrationConfigured,
  latestRecords,
  syncBalneability,
};
