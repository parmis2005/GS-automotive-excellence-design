import { Router } from "express";
import { recordActiveVisit, getActiveVisitorCount } from "../db/database.js";

export const statsRouter = Router();

/** POST /api/stats/visit – Besuch registrieren (anonym, nur sessionId). */
statsRouter.post("/visit", async (req, res) => {
  try {
    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
    if (!sessionId) {
      res.status(400).json({ success: false, error: "sessionId fehlt" });
      return;
    }
    await recordActiveVisit(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error("Stats visit error:", error);
    res.status(500).json({ success: false, error: "Fehler beim Speichern" });
  }
});

/** GET /api/stats/active-visitors – Anzahl Besucher in den letzten 5 Min. Cache 30s. */
statsRouter.get("/active-visitors", async (_req, res) => {
  try {
    const count = await getActiveVisitorCount();
    res.set("Cache-Control", "public, max-age=30");
    res.json({ count });
  } catch (error) {
    console.error("Active visitors error:", error);
    res.status(500).json({ count: 0 });
  }
});
