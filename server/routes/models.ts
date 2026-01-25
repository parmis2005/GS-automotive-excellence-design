import { Router } from "express";

export const modelsRouter = Router();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { timestamp: number; data: string[] }>();

const getCacheKey = (make: string) => make.trim().toLowerCase();

modelsRouter.get("/", async (req, res) => {
  try {
    const make = String(req.query.make || "").trim();
    if (!make) {
      return res.status(400).json({
        success: false,
        error: "Missing make parameter",
      });
    }

    const key = getCacheKey(make);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        success: true,
        count: cached.data.length,
        data: cached.data,
        timestamp: new Date().toISOString(),
        source: "nhtsa-cache",
      });
    }

    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const payload = (await response.json()) as {
      Results?: Array<{ Model_Name?: string }>;
    };
    const results = Array.isArray(payload?.Results) ? payload.Results : [];
    const unique = new Set<string>();
    results.forEach((item) => {
      const name = item?.Model_Name?.trim();
      if (name) unique.add(name);
    });

    const models = Array.from(unique).sort((a, b) => a.localeCompare(b));
    cache.set(key, { timestamp: Date.now(), data: models });

    res.json({
      success: true,
      count: models.length,
      data: models,
      timestamp: new Date().toISOString(),
      source: "nhtsa",
    });
  } catch (error) {
    console.error("Error fetching models from NHTSA:", error);
    res.status(502).json({
      success: false,
      error: "Failed to fetch models",
    });
  }
});
