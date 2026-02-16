/**
 * URL-Slug für Fahrzeugdetailseiten: /fahrzeuge/[id]-[marke]-[modell]
 */

/** Wandelt Text in URL-Slug um (klein, Bindestriche, Umlaute ersetzt). */
export function slugify(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "fahrzeug";
}

/**
 * Erzeugt den Slug für eine Fahrzeugdetail-URL: id-marke-modell
 * z.B. 8879641-bmw-320i
 */
export function getVehicleDetailSlug(id: string, brand: string, model: string): string {
  const safeId = (id || "").trim() || "0";
  const marke = slugify(brand || "");
  const modell = slugify(model || "");
  const parts = [safeId, marke, modell].filter(Boolean);
  return parts.join("-");
}

/**
 * Liest die Fahrzeug-ID aus dem Slug (erstes Segment vor dem ersten Bindestrich).
 * z.B. "8879641-bmw-320i" -> "8879641"
 */
export function getVehicleIdFromSlug(slug: string): string {
  if (!slug || typeof slug !== "string") return "";
  const segment = slug.trim().split("-")[0];
  return segment || "";
}
