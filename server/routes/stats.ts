import { Router } from "express";
import { recordActiveVisit, getActiveVisitorCount } from "../db/database.js";

export const statsRouter = Router();
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const inMemoryVisitors = new Map<string, number>();

const pruneInMemoryVisitors = () => {
  const now = Date.now();
  for (const [sessionId, lastSeen] of inMemoryVisitors.entries()) {
    if (now - lastSeen > ACTIVE_WINDOW_MS) {
      inMemoryVisitors.delete(sessionId);
    }
  }
};

const recordInMemoryVisit = (sessionId: string) => {
  inMemoryVisitors.set(sessionId, Date.now());
  pruneInMemoryVisitors();
};

const getInMemoryActiveVisitorCount = () => {
  pruneInMemoryVisitors();
  return inMemoryVisitors.size;
};

/** POST /api/stats/visit – Besuch registrieren (anonym, nur sessionId). */
statsRouter.post("/visit", async (req, res) => {
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
  if (!sessionId) {
    res.status(400).json({ success: false, error: "sessionId fehlt" });
    return;
  }

  // Immer lokal zählen, damit Visitor-Anzeige auch ohne DB weiterläuft.
  recordInMemoryVisit(sessionId);

  try {
    await recordActiveVisit(sessionId);
    res.json({ success: true, source: "db" });
  } catch (error) {
    console.error("Stats visit error (fallback to in-memory):", error);
    res.json({ success: true, source: "memory" });
  }
});

/** GET /api/stats/active-visitors – Anzahl Besucher in den letzten 5 Min. Cache 30s. */
statsRouter.get("/active-visitors", async (_req, res) => {
  const memoryCount = getInMemoryActiveVisitorCount();

  try {
    const dbCount = await getActiveVisitorCount();
    // Höheren Wert nutzen: verhindert Sprünge nach unten, falls eine Quelle kurz ausfällt.
    const count = Math.max(dbCount, memoryCount);
    res.set("Cache-Control", "public, max-age=30");
    res.json({ count, source: "db+memory" });
  } catch (error) {
    console.error("Active visitors error (fallback to in-memory):", error);
    res.set("Cache-Control", "public, max-age=30");
    res.json({ count: memoryCount, source: "memory" });
  }
});
