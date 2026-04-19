/**
 * Muss mit src/lib/vehicleNameUtils.ts (getVehicleType / START_PAGE_VEHICLE_TYPES) übereinstimmen,
 * damit /fahrzeuge/typ/:typ in der Sitemap dieselben Fahrzeuge abdeckt wie die Fahrzeugsuche.
 */

export const START_PAGE_VEHICLE_TYPES = ["Sportwagen", "Limousine", "Kleinwagen", "Kombi", "Van", "Cabrio", "SUV"] as const;

const KLEINWAGEN_MODEL_PATTERNS = [
  "1er",
  "2er",
  "polo",
  "golf",
  "corsa",
  "up!",
  "up ",
  "fabia",
  "ibiza",
  "cooper",
  "mini ",
  "a1",
  "a2",
  "fiat 500",
  "panda",
  "500c",
  "500l",
  "smart ",
  "fortwo",
  "forfour",
  "clio",
  "208",
  "308",
  "yaris",
  "aygo",
  "mazda2",
  "mazda 2",
  "fiesta",
  "ka+",
  "ka ",
];

export function normalizeApiVehicleTypeToStartPage(apiType: string | undefined): string | null {
  if (!apiType || !apiType.trim()) return null;
  const lower = apiType.trim().toLowerCase();
  if (START_PAGE_VEHICLE_TYPES.includes(apiType.trim() as (typeof START_PAGE_VEHICLE_TYPES)[number])) return apiType.trim();
  if (lower.includes("sport") || lower.includes("coupe") || lower.includes("coupé")) return "Sportwagen";
  if (lower.includes("cabrio") || lower.includes("roadster") || lower.includes("convertible")) return "Cabrio";
  if (lower.includes("kombi") || lower.includes("avant") || lower.includes("touring") || lower.includes("estate") || lower.includes("break"))
    return "Kombi";
  if (lower.includes("van") || lower.includes("transporter") || lower.includes("minibus") || lower.includes("minivan")) return "Van";
  if (lower.includes("suv") || lower.includes("geländewagen") || lower.includes("off-road")) return "SUV";
  if (lower.includes("kleinwagen") || lower.includes("kompakt") || lower.includes("stadtwagen")) return "Kleinwagen";
  if (lower.includes("limousine") || lower.includes("sedan") || lower.includes("stufenheck")) return "Limousine";
  return null;
}

export function isKleinwagenModel(model: string): boolean {
  if (!model) return false;
  const lower = model.toLowerCase();
  return KLEINWAGEN_MODEL_PATTERNS.some((p) => lower.includes(p));
}

export function getVehicleType(model: string, vehicleTypeFromCargate?: string): string | null {
  const modelLower = model?.toLowerCase() ?? "";

  if (vehicleTypeFromCargate) {
    const normalized = normalizeApiVehicleTypeToStartPage(vehicleTypeFromCargate);
    if (normalized === "Sportwagen" && isKleinwagenModel(model)) return "Kleinwagen";
    if (normalized) return normalized;
  }

  if (!model) return null;

  if (modelLower.includes("cabrio") || modelLower.includes("cabriolet") || modelLower.includes("convertible")) {
    return "Cabrio";
  }

  if (
    modelLower.includes("avant") ||
    modelLower.includes("touring") ||
    modelLower.includes("kombi") ||
    modelLower.includes("estate") ||
    modelLower.includes("wagon") ||
    modelLower.includes("break") ||
    modelLower.includes("variant")
  ) {
    return "Kombi";
  }

  if (
    modelLower.includes("x1") ||
    modelLower.includes("x2") ||
    modelLower.includes("x3") ||
    modelLower.includes("x4") ||
    modelLower.includes("x5") ||
    modelLower.includes("x6") ||
    modelLower.includes("x7") ||
    modelLower.includes("q3") ||
    modelLower.includes("q5") ||
    modelLower.includes("q7") ||
    modelLower.includes("q8") ||
    modelLower.includes("gle") ||
    modelLower.includes("glc") ||
    modelLower.includes("gla") ||
    modelLower.includes("glb") ||
    modelLower.includes("tiguan") ||
    modelLower.includes("touareg") ||
    modelLower.includes("suv") ||
    modelLower.includes("macan") ||
    modelLower.includes("cayenne")
  ) {
    return "SUV";
  }

  if (
    modelLower.includes("gran coupe") ||
    modelLower.includes("gran coupé") ||
    modelLower.includes("coupe") ||
    modelLower.includes("coupé") ||
    modelLower.includes("sportwagen") ||
    modelLower.includes("gt") ||
    modelLower.includes("gti") ||
    modelLower.includes("rs") ||
    modelLower.includes("amg") ||
    modelLower.includes("m3") ||
    modelLower.includes("m4") ||
    modelLower.includes("m5") ||
    modelLower.includes("m6")
  ) {
    if (isKleinwagenModel(model)) return "Kleinwagen";
    return "Sportwagen";
  }

  if ((modelLower.includes("i4") || modelLower.includes("i5") || modelLower.includes("i6")) && !modelLower.includes("x")) {
    return "Sportwagen";
  }

  if (
    modelLower.includes("multivan") ||
    modelLower.includes("transporter") ||
    modelLower.includes("crafter") ||
    modelLower.includes("sprinter") ||
    modelLower.includes("vivaro") ||
    modelLower.includes("trafic") ||
    modelLower.includes("master") ||
    modelLower.includes("t6") ||
    modelLower.includes("t7") ||
    modelLower.includes("vito") ||
    modelLower.includes("v-class") ||
    modelLower.includes("viano") ||
    modelLower.includes("transit") ||
    modelLower.includes("ducato") ||
    modelLower.includes("boxer") ||
    modelLower.includes("jumper")
  ) {
    return "Van";
  }

  if (isKleinwagenModel(model)) return "Kleinwagen";

  return "Limousine";
}
