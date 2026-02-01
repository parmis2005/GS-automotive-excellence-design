/**
 * Utility functions for formatting vehicle names
 */

/**
 * Gibt den Anzeigenamen eines Fahrzeugs zurück (ohne Baureihe in Klammern).
 * productionSeries wird nicht angezeigt, bleibt aber für Suche/Filter verfügbar.
 */
export function getVehicleDisplayName(
  brand: string,
  model: string,
  _productionSeries?: string | null,
  fallbackTitle?: string | null
): string {
  const base = [brand, model].filter(Boolean).join(" ").trim() || fallbackTitle?.trim() || "";
  if (!base) return "Fahrzeug";
  return base;
}

/**
 * Formats fuel type for display, removing "-Benzin" from "Plugin Hybrid-Benzin"
 */
export function formatFuelType(fuel: string): string {
  if (!fuel) return fuel;
  return fuel.replace(/^Plugin Hybrid-Benzin$/i, "Plugin Hybrid");
}

/**
 * Extracts the base model name from a full model string for filtering
 * This returns only the basic model name (e.g., "1er", "2er", "i4", "X1") without variants
 * Example: "i4 eDrive40 GC M-SPORT-PRO" -> "i4"
 * Example: "1er 118d" -> "1er"
 * Example: "X1 F48 sDrive18d" -> "X1"
 */
export function getBaseModelName(fullModelName: string): string {
  if (!fullModelName) return "";
  
  // Common patterns for base models
  // Match: number + "er" (1er, 2er, 3er, etc.)
  const numberErMatch = fullModelName.match(/^(\d+er)/i);
  if (numberErMatch) {
    return numberErMatch[1];
  }
  
  // Match: single letter + number (i4, i5, X1, X2, etc.) - but stop before space if followed by more details
  const letterNumberMatch = fullModelName.match(/^([A-Z]\d+)/i);
  if (letterNumberMatch) {
    return letterNumberMatch[1];
  }
  
  // Match: word + number (Golf 8, Polo 6, etc.)
  const wordNumberMatch = fullModelName.match(/^([A-Za-z]+\s?\d+)/i);
  if (wordNumberMatch) {
    return wordNumberMatch[1].trim();
  }
  
  // Match: single word or first word (Mini Cooper, Fiesta, etc.)
  const firstWordMatch = fullModelName.match(/^([A-Za-z]+)/i);
  if (firstWordMatch) {
    return firstWordMatch[1];
  }
  
  // Fallback: return first part before space
  return fullModelName.split(' ')[0] || fullModelName;
}

/**
 * Groups models by series (Baureihe) for BMW and similar brands
 * Returns a map of series name to array of models in that series
 * Simple logic: What starts with "1" goes to "1er", what starts with "X" goes to "X-Reihe", etc.
 * Example: { "1er": ["118", "120"], "2er": ["218 Active Tourer", "218 Gran Coupe"], "X-Reihe": ["X1", "X2"] }
 */
export function groupModelsBySeries(models: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  
  models.forEach(model => {
    // Get the base model name (e.g., "118", "X1", "i4")
    const baseModel = getBaseModelName(model);
    const baseModelLower = baseModel.toLowerCase();
    
    // Determine series based on first character/number of base model
    let series: string | null = null;
    
    // Check if it starts with a number (1, 2, 3, 4, 5, 6, 7, 8)
    const numberMatch = baseModelLower.match(/^(\d)/);
    if (numberMatch) {
      const number = numberMatch[1];
      series = `${number}er`;
    }
    // Check for X-series (X1, X2, X3, etc.) - starts with "x"
    else if (baseModelLower.startsWith('x')) {
      series = "X-Reihe";
    }
    // Check for i-models (i3, i4, i5, i7, iX1, etc.) - starts with "i"
    else if (baseModelLower.startsWith('i')) {
      series = "i-Modelle";
    }
    
    if (series) {
      if (!grouped.has(series)) {
        grouped.set(series, []);
      }
      grouped.get(series)!.push(model);
    } else {
      // Models that don't fit into a series go into "Sonstige"
      if (!grouped.has("Sonstige")) {
        grouped.set("Sonstige", []);
      }
      grouped.get("Sonstige")!.push(model);
    }
  });
  
  // Sort series: 1er, 2er, 3er, 4er, 5er, 6er, 7er, 8er, X-Reihe, i-Modelle, Sonstige
  const seriesOrder = ["1er", "2er", "3er", "4er", "5er", "6er", "7er", "8er", "X-Reihe", "i-Modelle", "Sonstige"];
  const sortedGrouped = new Map<string, string[]>();
  
  seriesOrder.forEach(series => {
    if (grouped.has(series)) {
      sortedGrouped.set(series, grouped.get(series)!.sort());
    }
  });
  
  // Add any remaining series that weren't in the order
  grouped.forEach((models, series) => {
    if (!sortedGrouped.has(series)) {
      sortedGrouped.set(series, models.sort());
    }
  });
  
  return sortedGrouped;
}

/**
 * Gets all models in a series
 * Example: "1er" -> ["118", "120"] if those are the models in the 1er series
 */
export function getModelsInSeries(series: string, allModels: string[]): string[] {
  const grouped = groupModelsBySeries(allModels);
  return grouped.get(series) || [];
}

/**
 * Splits a vehicle model name into base model (Baureihe) and variant/trim
 * Base model includes: first word (Baureihe like "X1", "i4", "A4") + optional generation code (like "F48", "G20")
 * Everything else goes to variant
 * 
 * Examples:
 * "X1 F48" -> { base: "X1 F48", variant: "" }
 * "i4 eDrive40 GC M-SPORT-PRO" -> { base: "i4", variant: "eDrive40 GC M-SPORT-PRO" }
 * "320d" -> { base: "320d", variant: "" }
 * "C 300" -> { base: "C 300", variant: "" }
 * "C 300 AMG" -> { base: "C 300", variant: "AMG" }
 * "A4 Avant 40 TDI" -> { base: "A4", variant: "Avant 40 TDI" }
 */
export function splitModelName(model: string): { base: string; variant: string } {
  if (!model) return { base: "", variant: "" };
  
  const words = model.trim().split(/\s+/);
  
  // If only 1 word, it's the base model
  if (words.length === 1) {
    return { base: words[0], variant: "" };
  }
  
  // Check if second word is a generation code (like "F48", "G20", "W205") - usually letter(s) + numbers
  // Generation codes pattern: 1-2 letters followed by 2-3 digits (e.g., F48, G20, W205, E46)
  const generationCodePattern = /^[A-Z]{1,2}\d{2,3}$/i;
  
  // If 2 words, check if second word is a generation code or a number
  if (words.length === 2) {
    const secondWord = words[1];
    if (generationCodePattern.test(secondWord) || /^\d+[a-z]?$/i.test(secondWord)) {
      // Both words are base (e.g., "X1 F48", "C 300")
      return { base: model, variant: "" };
    } else {
      // First word is base, second is variant (e.g., "A4 Avant")
      return { base: words[0], variant: words[1] };
    }
  }
  
  // If 3+ words
  const secondWord = words[1];
  const thirdWord = words[2];
  
  // Check if second word is a generation code
  if (generationCodePattern.test(secondWord)) {
    // First 2 words are base (Baureihe + Generation Code), rest is variant
    // Example: "X1 F48 xDrive20d" -> base: "X1 F48", variant: "xDrive20d"
    return { 
      base: words.slice(0, 2).join(" "), 
      variant: words.slice(2).join(" ") 
    };
  }
  
  // Check if second word is a number (like "C 300")
  if (/^\d+[a-z]?$/i.test(secondWord)) {
    // First 2 words are base, rest is variant
    // Example: "C 300 AMG" -> base: "C 300", variant: "AMG"
    return { 
      base: words.slice(0, 2).join(" "), 
      variant: words.slice(2).join(" ") 
    };
  }
  
  // Otherwise, first word is base (Baureihe), rest is variant
  // Example: "i4 eDrive40 GC M-SPORT-PRO" -> base: "i4", variant: "eDrive40 GC M-SPORT-PRO"
  return { 
    base: words[0], 
    variant: words.slice(1).join(" ") 
  };
}

/**
 * Gruppiert Ausstattungsliste nach Kategorien (Komfort, Sicherheit, Licht, etc.)
 */
export type EquipmentCategory =
  | "Komfort"
  | "Sicherheit"
  | "Multimedia"
  | "Licht & Sicht"
  | "Außen"
  | "Innenausstattung"
  | "Fahrwerk & Antrieb"
  | "Sonstiges";

const EQUIPMENT_CATEGORY_KEYWORDS: Record<EquipmentCategory, string[]> = {
  Komfort: [
    "klima", "sitzheizung", "sitzkühlung", "lenkrad", "sportsitze", "leder", "stoff", "polster",
    "massage", "memory", "elektrisch", "verstellbar", "head-up", "head up", "keyless",
    "parkassistent", "einfahrkamera", "rückfahrkamera", "kamera", "pdc", "abstands",
    "cruise control", "tempomat", "usb", "bluetooth", "wireless", "lade", "sitz", "komfort",
    "elektrisch verstellbar", "sitzverstellung", "klimaautomatik", "zonenklima",
  ],
  Sicherheit: [
    "airbag", "esp", "abs", "assistent", "abstand", "spur", "notbrems", "totwinkel",
    "reifendruck", "isofix", "hinweis", "kontrolle", "warn", "kollisions", "sicherheit",
    "reifendruckkontrolle", "ndc", "müdigkeits", "aufmerksamkeits",
  ],
  Multimedia: [
    "navi", "navigation", "display", "touchscreen", "apple carplay", "carplay", "android auto",
    "radio", "lautsprecher", "sound", "audio", "dab", "infotainment", "connect",
  ],
  "Licht & Sicht": [
    "led", "xenon", "scheinwerfer", "abblend", "fernlicht", "tagfahr", "nebel",
    "licht", "leuchte", "heckleuchte", "blinker", "scheibe", "heizbar", "regensensor",
    "leuchtweiten", "automatisches licht", "lichtautomatik",
  ],
  Außen: [
    "felge", "lm", "alufelge", "dach", "schiene", "spoiler", "paket", "pakete",
    "lack", "spiegel", "heckscheiben", "wischer", "ahk", "anhänger", "dachreling",
  ],
  Innenausstattung: [
    "innen", "innenausstattung", "armaturen", "multifunktions", "konsolen",
    "handschuh", "kofferraum", "tonnendach", "himmel", "bezug", "verkleidung",
  ],
  "Fahrwerk & Antrieb": [
    "getriebe", "allrad", "xdrive", "4matic", "quattro", "hil", "dcc", "fahrwerk",
    "sportfahrwerk", "adaptiv", "dämpfer", "antrieb", "differenzial",
  ],
  Sonstiges: [],
};

export function groupEquipmentByCategory(equipment: string[]): Map<EquipmentCategory, string[]> {
  const grouped = new Map<EquipmentCategory, string[]>();
  const categories: EquipmentCategory[] = [
    "Komfort",
    "Sicherheit",
    "Multimedia",
    "Licht & Sicht",
    "Außen",
    "Innenausstattung",
    "Fahrwerk & Antrieb",
    "Sonstiges",
  ];
  for (const cat of categories) {
    grouped.set(cat, []);
  }

  for (const item of equipment) {
    if (!item || !item.trim()) continue;
    const lower = item.toLowerCase();
    let assigned = false;
    for (const cat of categories.slice(0, -1)) {
      if (EQUIPMENT_CATEGORY_KEYWORDS[cat].some((kw) => lower.includes(kw))) {
        grouped.get(cat)!.push(item.trim());
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      grouped.get("Sonstiges")!.push(item.trim());
    }
  }

  return grouped;
}

/** Fahrzeugtypen der Startseite (VehicleTypeSelector) – einheitliche Zuordnung für Filter und API. */
export const START_PAGE_VEHICLE_TYPES = ["Sportwagen", "Limousine", "Kleinwagen", "Kombi", "Van", "Cabrio", "SUV"] as const;

/**
 * Mappt API-Fahrzeugtyp (BodyType/Karosserie) auf einen der Startseiten-Typen.
 * So stimmen Klicks auf der Startseite mit den gefetchten Fahrzeugen überein.
 */
export function normalizeApiVehicleTypeToStartPage(apiType: string | undefined): string | null {
  if (!apiType || !apiType.trim()) return null;
  const lower = apiType.trim().toLowerCase();
  if (START_PAGE_VEHICLE_TYPES.includes(apiType.trim() as typeof START_PAGE_VEHICLE_TYPES[number])) return apiType.trim();
  if (lower.includes("sport") || lower.includes("coupe") || lower.includes("coupé")) return "Sportwagen";
  if (lower.includes("cabrio") || lower.includes("roadster") || lower.includes("convertible")) return "Cabrio";
  if (lower.includes("kombi") || lower.includes("avant") || lower.includes("touring") || lower.includes("estate") || lower.includes("break")) return "Kombi";
  if (lower.includes("van") || lower.includes("transporter") || lower.includes("minibus") || lower.includes("minivan")) return "Van";
  if (lower.includes("suv") || lower.includes("geländewagen") || lower.includes("off-road")) return "SUV";
  if (lower.includes("kleinwagen") || lower.includes("kompakt") || lower.includes("stadtwagen")) return "Kleinwagen";
  if (lower.includes("limousine") || lower.includes("sedan") || lower.includes("stufenheck")) return "Limousine";
  return null;
}

/**
 * Extracts the vehicle type (Fahrzeugtyp) from the model name
 * This is a fallback function - prefer using vehicle.vehicleType from cargate if available
 * Examples: "Cabrio", "Limousine", "Sportwagen", "Kombi", "SUV", etc.
 * Returned type is always one of START_PAGE_VEHICLE_TYPES for consistency with the start page.
 */
/** Modelle, die immer als Kleinwagen gelten – auch wenn API „Sportwagen“/„Coupe“ liefert (z. B. Opel Corsa). */
const KLEINWAGEN_MODEL_PATTERNS = [
  "1er", "2er", "polo", "golf", "corsa", "up!", "up ", "fabia", "ibiza", "cooper", "mini ",
  "a1", "a2", "fiat 500", "panda", "500c", "500l", "smart ", "fortwo", "forfour",
  "clio", "208", "308", "yaris", "aygo", "mazda2", "mazda 2", "fiesta", "ka+", "ka ",
];

/** Prüft, ob das Modell ein Kleinwagen ist (z. B. Corsa, Polo, 1er) – für Filter/Sportwagen-Ausschluss. */
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
  
  // Cabrio / Convertible
  if (modelLower.includes('cabrio') || modelLower.includes('cabriolet') || modelLower.includes('convertible')) {
    return "Cabrio";
  }
  
  // Kombi / Estate / Touring / Avant
  if (modelLower.includes('avant') || modelLower.includes('touring') || 
      modelLower.includes('kombi') || modelLower.includes('estate') || 
      modelLower.includes('wagon') || modelLower.includes('break') || 
      modelLower.includes('variant')) {
    return "Kombi";
  }
  
  // SUV
  if (modelLower.includes('x1') || modelLower.includes('x2') || modelLower.includes('x3') || 
      modelLower.includes('x4') || modelLower.includes('x5') || modelLower.includes('x6') || 
      modelLower.includes('x7') || modelLower.includes('q3') || modelLower.includes('q5') || 
      modelLower.includes('q7') || modelLower.includes('q8') || modelLower.includes('gle') || 
      modelLower.includes('glc') || modelLower.includes('gla') || modelLower.includes('glb') || 
      modelLower.includes('tiguan') || modelLower.includes('touareg') || 
      modelLower.includes('suv') || modelLower.includes('macan') || 
      modelLower.includes('cayenne')) {
    return "SUV";
  }
  
  // Sportwagen / Coupe – aber bekannte Kleinwagen (z. B. Opel Corsa Coupé) bleiben Kleinwagen
  if (modelLower.includes('gran coupe') || modelLower.includes('gran coupé') || 
      modelLower.includes('coupe') || modelLower.includes('coupé') || 
      modelLower.includes('sportwagen') || modelLower.includes('gt') || 
      modelLower.includes('gti') || modelLower.includes('rs') || 
      modelLower.includes('amg') || modelLower.includes('m3') || 
      modelLower.includes('m4') || modelLower.includes('m5') || 
      modelLower.includes('m6')) {
    if (isKleinwagenModel(model)) return "Kleinwagen";
    return "Sportwagen";
  }
  
  // Special case: BMW i4 is a Gran Coupe (4-door coupe), so it should be Sportwagen
  // Check if it's an i4, i5, or similar electric Gran Coupe models
  if ((modelLower.includes('i4') || modelLower.includes('i5') || modelLower.includes('i6')) && 
      !modelLower.includes('x')) { // Exclude iX (SUV)
    // Check if it's explicitly a Gran Coupe or if it's just the base model
    // For BMW i4/i5/i6, they are typically Gran Coupes (Sportwagen)
    return "Sportwagen";
  }
  
  // Van / Transporter
  if (modelLower.includes('multivan') || modelLower.includes('transporter') || 
      modelLower.includes('crafter') || modelLower.includes('sprinter') || 
      modelLower.includes('vivaro') || modelLower.includes('trafic') || 
      modelLower.includes('master') || modelLower.includes('t6') || 
      modelLower.includes('t7') || modelLower.includes('vito') || 
      modelLower.includes('v-class') || modelLower.includes('viano') || 
      modelLower.includes('transit') || modelLower.includes('ducato') || 
      modelLower.includes('boxer') || modelLower.includes('jumper')) {
    return "Van";
  }
  
  // Kleinwagen / Kompakt (vor Limousine)
  if (isKleinwagenModel(model)) return "Kleinwagen";
  
  // Limousine (default for sedans – nur wenn weder SUV, Kombi, Van, Sport noch Kleinwagen)
  return "Limousine";
}
