/**
 * URL-Slug für Fahrzeugdetailseiten – muss mit dem Frontend (src/lib/vehicleSlug.ts) übereinstimmen.
 * Format: id-marke-modell, z.B. 8879641-bmw-320i
 */

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

export function getVehicleDetailSlug(id: string, brand: string, model: string): string {
  const safeId = (id || "").trim() || "0";
  const marke = slugify(brand || "");
  const modell = slugify(model || "");
  const parts = [safeId, marke, modell].filter(Boolean);
  return parts.join("-");
}
