import { Router } from "express";
import { getAllVehicles } from "../db/database.js";
import { isCargateApiConfigured, getVehiclesFromCargateCached } from "../services/cargateApi.js";
import { slugify } from "../utils/vehicleSlug.js";
import { getVehicleType } from "../utils/vehicleTypeForSitemap.js";

const SITEMAP_BASE = "https://gsauto.de";

export const sitemapFahrzeugsucheRouter = Router();

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET /sitemap-fahrzeugsuche.xml
 * Dynamische Sitemap: Marke-, Marke+Modell- und Typ-Landings aus dem aktuellen Bestand.
 */
sitemapFahrzeugsucheRouter.get("/sitemap-fahrzeugsuche.xml", async (_req, res) => {
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

    const brandSlugs = new Set<string>();
    const markeModellPaths = new Set<string>();
    const typSlugs = new Set<string>();

    for (const v of vehicles) {
      if (!v?.brand || typeof v.brand !== "string") continue;
      const marke = slugify(v.brand);
      if (!marke) continue;
      brandSlugs.add(marke);

      if (v.model && String(v.model).trim()) {
        const modell = slugify(String(v.model));
        if (modell) {
          markeModellPaths.add(`${marke}/${modell}`);
        }
      }

      const vt = getVehicleType(String(v.model ?? ""), v.vehicleType);
      if (vt) {
        const t = slugify(vt);
        if (t) typSlugs.add(t);
      }
    }

    const lastmod = new Date().toISOString().slice(0, 10);

    const urlBlocks: string[] = [];

    for (const marke of Array.from(brandSlugs).sort()) {
      const loc = `${SITEMAP_BASE}/fahrzeuge/marke/${marke}`;
      urlBlocks.push(
        `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.75</priority></url>`,
      );
    }

    for (const path of Array.from(markeModellPaths).sort()) {
      const loc = `${SITEMAP_BASE}/fahrzeuge/marke/${path}`;
      urlBlocks.push(
        `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.72</priority></url>`,
      );
    }

    for (const typ of Array.from(typSlugs).sort()) {
      const loc = `${SITEMAP_BASE}/fahrzeuge/typ/${typ}`;
      urlBlocks.push(
        `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`,
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
    res.send(xml);
  } catch (error) {
    console.error("❌ sitemap-fahrzeugsuche.xml error:", error);
    res.status(500).setHeader("Content-Type", "application/xml").send(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    );
  }
});
