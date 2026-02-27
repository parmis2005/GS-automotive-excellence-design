import { Router } from "express";
import { getAllVehicles } from "../db/database.js";
import { isCargateApiConfigured, getVehiclesFromCargateCached } from "../services/cargateApi.js";
import { getVehicleDetailSlug } from "../utils/vehicleSlug.js";

const SITEMAP_BASE = "https://gsauto.de";

export const sitemapFahrzeugeRouter = Router();

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET /sitemap-fahrzeuge.xml
 * Dynamische Sitemap mit allen Fahrzeugdetail-URLs für Google.
 */
sitemapFahrzeugeRouter.get("/sitemap-fahrzeuge.xml", async (_req, res) => {
  try {
    let vehicles;
    if (isCargateApiConfigured()) {
      try {
        vehicles = await getVehiclesFromCargateCached();
      } catch {
        vehicles = await getAllVehicles();
      }
    } else {
      vehicles = await getAllVehicles();
    }

    const urlEntries = vehicles
      .filter((v) => v.id && v.brand && v.model)
      .map((v) => {
        const slug = getVehicleDetailSlug(v.id, v.brand, v.model);
        const loc = `${SITEMAP_BASE}/fahrzeuge/${slug}`;
        return `<url><loc>${escapeXml(loc)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
    res.send(xml);
  } catch (error) {
    console.error("❌ sitemap-fahrzeuge.xml error:", error);
    res.status(500).setHeader("Content-Type", "application/xml").send(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    );
  }
});
