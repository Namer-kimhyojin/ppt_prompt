import fs from "node:fs/promises";
import path from "node:path";

function finiteDays(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function createAuditLogger(outputDir, retentionDays = 365) {
  const auditDir = path.join(outputDir, "_private");
  const auditFile = path.join(auditDir, "audit.ndjson");
  const keepMs = finiteDays(retentionDays, 365) * 24 * 60 * 60 * 1000;
  let queue = Promise.resolve();

  async function initialize() {
    await fs.mkdir(auditDir, { recursive: true, mode: 0o700 });
    try {
      const raw = await fs.readFile(auditFile, "utf8");
      const cutoff = Date.now() - keepMs;
      const kept = raw.split(/\r?\n/).filter(Boolean).filter((line) => {
        try { return Date.parse(JSON.parse(line).at) >= cutoff; }
        catch { return false; }
      });
      await fs.writeFile(auditFile, kept.length ? `${kept.join("\n")}\n` : "", { mode: 0o600 });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await fs.writeFile(auditFile, "", { mode: 0o600 });
    }
  }

  function log(event, details = {}) {
    const entry = {
      at: new Date().toISOString(),
      event: String(event || "unknown").slice(0, 100),
      userId: details.userId ? String(details.userId).slice(0, 64) : null,
      ip: details.ip ? String(details.ip).slice(0, 128) : null,
      targetId: details.targetId ? String(details.targetId).slice(0, 128) : null,
      ok: details.ok !== false,
    };
    queue = queue.then(() => fs.appendFile(auditFile, `${JSON.stringify(entry)}\n`, { mode: 0o600 })).catch((error) => {
      console.error("[audit] 감사기록 저장 실패:", error?.message || error);
    });
    return queue;
  }

  async function readForUser(userId) {
    await queue;
    try {
      const raw = await fs.readFile(auditFile, "utf8");
      return raw.split(/\r?\n/).filter(Boolean).map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter((entry) => entry?.userId === userId);
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  return { initialize, log, readForUser, file: auditFile };
}

export async function cleanupExpiredUserOutputs(outputDir, retentionDays = 30) {
  const usersRoot = path.join(outputDir, "users");
  const cutoff = Date.now() - finiteDays(retentionDays, 30) * 24 * 60 * 60 * 1000;
  let removed = 0;

  async function visit(directory) {
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(target);
        const remaining = await fs.readdir(target).catch(() => ["keep"]);
        if (remaining.length === 0) await fs.rmdir(target).catch(() => {});
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = await fs.stat(target);
      if (stat.mtimeMs < cutoff) {
        await fs.unlink(target);
        removed += 1;
      }
    }
  }

  await visit(usersRoot);
  return removed;
}

export async function removeUserOutputs(outputDir, userId) {
  if (!/^[a-f0-9]{16}$/i.test(String(userId || ""))) throw new Error("Invalid user id");
  const usersRoot = path.resolve(outputDir, "users");
  const target = path.resolve(usersRoot, userId);
  if (!target.startsWith(`${usersRoot}${path.sep}`)) throw new Error("Invalid output path");
  await fs.rm(target, { recursive: true, force: true });
}
