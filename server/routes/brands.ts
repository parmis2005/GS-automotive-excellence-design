import { Router } from "express";

export const brandsRouter = Router();

const NHTSA_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cachedBrands: string[] = [];
let cachedAt = 0;

brandsRouter.get("/", async (req, res) => {
  try {
    const now = Date.now();
    if (cachedBrands.length && now - cachedAt < CACHE_TTL_MS) {
      return res.json({
        success: true,
        count: cachedBrands.length,
        data: cachedBrands,
        timestamp: new Date().toISOString(),
        source: "nhtsa-cache",
      });
    }

    const response = await fetch(NHTSA_URL);
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const payload = (await response.json()) as {
      Results?: Array<{ Make_Name?: string }>;
    };
    const results = Array.isArray(payload?.Results) ? payload.Results : [];
    const unique = new Set<string>();
    results.forEach((item) => {
      const name = item?.Make_Name?.trim();
      if (name) unique.add(name);
    });

    const brands = Array.from(unique).sort((a, b) => a.localeCompare(b));
    cachedBrands = brands;
    cachedAt = now;

    res.json({
      success: true,
      count: brands.length,
      data: brands,
      timestamp: new Date().toISOString(),
      source: "nhtsa",
    });
  } catch (error) {
    console.error("Error fetching brands from NHTSA:", error);
    res.status(502).json({
      success: false,
      error: "Failed to fetch brands",
    });
  }
});
