/**
 * Carzilla WebService 6 Integration (Dokumentation: cargate/Carzilla V6.pdf)
 *
 * Zugriffspunkte laut PDF:
 * - JSON: http://api.carzilla.de/6/api/search
 * - Bei jedem Aufruf: SearchId (Such-Id) mitgeben. Methoden: GetVehicleList, GetVehicle, GetVehicles.
 * - GetVehicleList: searchId, page, vehiclePerPage (max 100), searchParams.
 * - Bilder: http://img.carzilla-services.com/Images.ashx?vid=...&bid=...&format=m&ino=1&app=carzilla
 *
 * Umgebungsvariablen:
 * - CARGATE_API_KEY: SearchId / Such-Id für Ihren Fahrzeugbestand
 * - CARGATE_API_BASE_URL: http://api.carzilla.de/6/api/search
 * - CARGATE_BRANCH_ID: Optional, BranchId für Bild-URLs (Fallback)
 */

import NodeCache from "node-cache";
import type { Vehicle } from "../types/vehicle.js";
import { getVehicleImageCount, hasOnlyPlaceholderImage } from "../lib/imageCount.js";

const cache = new NodeCache({
  stdTTL: 24 * 60 * 60,
  checkperiod: 60,
  useClones: false,
});

const CACHE_KEY = "cargate_vehicles";
const CACHE_KEY_CATALOG = "cargate_search_catalog";

/** Branch-ID für Bild-URLs (GS Automobile = 1790) */
const DEFAULT_BRANCH_ID = "1790";

function getBranchId(): string {
  return process.env.CARGATE_BRANCH_ID || DEFAULT_BRANCH_ID;
}

/**
 * Carzilla Image-Service (PDF): img.carzilla-services.com, vid=VehicleId, bid=Branch.BranchId, format s/m/l
 * HTTPS für Mixed-Content auf HTTPS-Seiten.
 */
function carzillaImageUrl(
  vehicleId: string,
  branchId: string,
  imageNo: number = 1,
  format: string = "l"
): string {
  const vid = String(vehicleId || "").trim() || "0";
  const bid = String(branchId || "").trim() || getBranchId();
  return `https://img.carzilla-services.com/Images.ashx?vid=${vid}&bid=${bid}&format=${format}&ino=${imageNo}&app=carzilla`;
}

/**
 * Kategorie aus Marke, Modell und Merkmalen (vereinfacht, gleiche Logik wie im Scraper)
 */
function determineCategory(
  brand: string,
  model: string,
  power?: number,
  fuel?: string
): string {
  const modelLower = model.toLowerCase();
  const brandLower = brand.toLowerCase();
  const fuelLower = fuel?.toLowerCase() || "";
  const titleLower = `${brand} ${model}`.toLowerCase();

  if (
    fuelLower.includes("elektro") ||
    fuelLower.includes("electric") ||
    ["e-tron", "etron", "id.", "id ", "i3", "i4", "i5", "i7", "ix", "tesla"].some(
      (k) => modelLower.includes(k) || titleLower.includes(k)
    ) ||
    brandLower === "tesla"
  ) {
    return "Elektro";
  }
  if (brandLower === "mini" || brandLower === "fiat" || brandLower === "smart")
    return "Kleinwagen";
  const vanKeywords = [
    "multivan",
    "transporter",
    "crafter",
    "sprinter",
    "vivaro",
    "vito",
    "t6",
    "t7",
  ];
  if (vanKeywords.some((k) => modelLower.includes(k) || titleLower.includes(k)))
    return "Van";
  const suvKeywords = [
    "x1",
    "x2",
    "x3",
    "x4",
    "x5",
    "x6",
    "x7",
    "q3",
    "q5",
    "q7",
    "q8",
    "gle",
    "glc",
    "tiguan",
    "touareg",
    "macan",
    "cayenne",
  ];
  if (suvKeywords.some((k) => modelLower.includes(k) || titleLower.includes(k)))
    return "SUV";
  const kombiKeywords = [
    "avant",
    "touring",
    "kombi",
    "estate",
    "wagon",
    "variant",
  ];
  if (
    kombiKeywords.some((k) => modelLower.includes(k) || titleLower.includes(k))
  )
    return "Kombi";
  const sportKeywords = ["m3", "m4", "m5", "amg", "rs", "gti", "gt"];
  if (
    (sportKeywords.some((k) => modelLower.includes(k) || titleLower.includes(k)) ||
      (power && power > 200)) &&
    !suvKeywords.some((k) => modelLower.includes(k) || titleLower.includes(k))
  ) {
    return "Sport";
  }
  const compactKeywords = [
    "polo",
    "golf",
    "a1",
    "a3",
    "1er",
    "cooper",
    "up!",
    "fabia",
  ];
  if (
    compactKeywords.some((k) => modelLower.includes(k) || titleLower.includes(k)) ||
    (power && power < 100)
  ) {
    return "Kleinwagen";
  }
  const familyKeywords = [
    "passat",
    "arteon",
    "a4",
    "a6",
    "c-klasse",
    "3er",
    "5er",
    "e-klasse",
  ];
  if (
    familyKeywords.some((k) => modelLower.includes(k) || titleLower.includes(k)) ||
    (power && power >= 100 && power <= 200)
  ) {
    return "Familienwagen";
  }
  return "Mittelklasse";
}

/**
 * Konvertiert .NET JSON-Datum "/Date(1769770200000+0100)/" in YYYY-MM-DD für PostgreSQL.
 */
function parseDotNetDate(value: string | undefined): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  const match = trimmed.match(/^\/Date\((\d+)([+-]\d+)?\)\/$/);
  if (!match) return trimmed.includes("T") ? trimmed.slice(0, 10) : trimmed.length === 10 ? trimmed : undefined;
  const ms = parseInt(match[1], 10);
  if (Number.isNaN(ms)) return undefined;
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

/** Liest einen String aus einem API-Objekt (direkt oder aus Unterobjekt .Name / .MakeName / .ModelName) */
function getStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && typeof v === "string") return v.trim();
    if (v != null && typeof v === "number") return String(v);
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const name = o.Name ?? o.MakeName ?? o.ModelName ?? o.name ?? o.Text ?? o.DisplayName ?? o.Value ?? o.Url ?? o.url ?? o.Href ?? o.href;
      if (name != null && typeof name === "string") return name.trim();
      if (name != null && typeof name === "number") return String(name);
    }
  }
  return "";
}

/**
 * Liest den Modellzusatz (Ausstattungszeile, z. B. "M-SPORT ACC AHK 360° HEAD-UP") aus CarGate.
 * NUR VersionAdditional – enthält die Ausstattungszeile. Version/ModelVersion sind das Modell (z. B. "220 Active Tourer").
 */
function getVersionAdditionalFromRaw(raw: Record<string, unknown>): string {
  const additional = getStr(raw, "VersionAdditional", "versionAdditional", "VersionAdditionalText");
  return additional || "";
}

/**
 * Liest das Modell (z. B. "220 Active Tourer", "3er Touring", "i4 eDrive40 GC") aus CarGate.
 * Version/ModelVersion haben Priorität – enthalten den vollen Modellnamen. NICHT die Ausstattungszeile.
 */
function getVersionFromRaw(raw: Record<string, unknown>): string {
  const versionKeys = [
    "Version", "version", "ModelVersion", "modelVersion", "Variant", "variant",
    "ModelLine", "modelLine", "ModelVariant", "modelVariant", "Trim", "trim",
    "Line", "line", "Modellvariante", "model_variant", "model_line",
  ];
  for (const key of versionKeys) {
    const v = raw[key];
    if (v != null && typeof v === "string") {
      const s = (v as string).trim();
      // Version kann Modellname duplizieren (z. B. beide "Mokka-e") – dann nicht als Zusatz
      if (s && !/^\d+$/.test(s)) return s;
    }
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const name = o.Name ?? o.name ?? o.Value ?? o.value ?? o.Text ?? o.DisplayName ?? o.text;
      if (name != null && typeof name === "string") {
        const s = name.trim();
        if (s && !/^\d+$/.test(s)) return s;
      }
    }
  }
  const modelObj = raw.Model ?? raw.model;
  if (modelObj != null && typeof modelObj === "object" && !Array.isArray(modelObj)) {
    const o = modelObj as Record<string, unknown>;
    for (const key of versionKeys) {
      const v = o[key];
      if (v != null && typeof v === "string") {
        const s = (v as string).trim();
        if (s && !/^\d+$/.test(s)) return s;
      }
      if (v != null && typeof v === "object" && !Array.isArray(v)) {
        const inner = v as Record<string, unknown>;
        const name = inner.Name ?? inner.name ?? inner.Value ?? inner.value ?? inner.Text;
        if (name != null && typeof name === "string") {
          const s = name.trim();
          if (s && !/^\d+$/.test(s)) return s;
        }
      }
    }
  }
  return "";
}

/**
 * Liest das Modell ausschließlich aus CarGate-Feldern (keine Ableitung, keine Series/Baureihe als Modell).
 * Nur: Model (Objekt mit Name/ModelName), ModelName, VehicleModel, CarModel, Modell.
 */
function getModelFromRaw(raw: Record<string, unknown>): string {
  const modelKeys = [
    "Model",
    "model",
    "ModelName",
    "modelName",
    "VehicleModel",
    "CarModel",
    "Modell",
    "model_name",
    "ModelDescription",
  ];
  for (const key of modelKeys) {
    const v = raw[key];
    if (v != null && typeof v === "string") {
      const s = (v as string).trim();
      if (s && !/^\d+$/.test(s)) return s;
    }
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const name = o.ModelName ?? o.Name ?? o.name ?? o.Text ?? o.Value ?? o.DisplayName ?? o.value ?? o.text;
      if (name != null && typeof name === "string") {
        const s = name.trim();
        if (s && !/^\d+$/.test(s)) return s;
      }
    }
  }
  return "";
}

/** Liest eine URL aus einem Roh-Objekt (direkt oder aus Unterobjekt .Url / .Value). */
function getUrlFromRaw(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && typeof v === "string") {
      const s = v.trim();
      if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
    }
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const url = o.Url ?? o.url ?? o.Value ?? o.value ?? o.Href ?? o.href ?? o.Link ?? o.link;
      if (url != null && typeof url === "string") {
        const s = url.trim();
        if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
      }
    }
  }
  return "";
}

/**
 * Erkennt, ob ein String eher Ausstattung/Beschreibung ist statt eines Modellnamens.
 * Typische Modellnamen: "1er", "1er 118d", "i4", "X1". Ausstattung: lange kommaseparierte Listen.
 */
function looksLikeEquipmentOrDescription(s: string): boolean {
  if (!s || s.length < 30) return false;
  const trimmed = s.trim();
  // Viele Kommas = eher Ausstattungsliste
  const commaCount = (trimmed.match(/,/g) || []).length;
  if (commaCount >= 2) return true;
  // Typische Ausstattungsbegriffe (nicht in echten Modellnamen wie "1er")
  const equipmentKeywords = [
    "klimaanlage", "rußpartikelfilter", "isofix", "heckleuchten", "led", "leuchtweitenregelung",
    "lenksäule", "reifendruck", "kontrolle", "anhänger-stabilisierung", "park-distance",
    "pdc", "schadstoffarm", "euro 6", "lm-felgen", "usb-anschluss", "ambiente",
    "sportsitze", "reifen-reparatur", "sitzbezug", "polsterung", "stoff", "sensatec",
    "leder", "airbag", "esp", "abs", "navigationssystem", "kamera", "sitzheizung",
  ];
  const lower = trimmed.toLowerCase();
  const matchCount = equipmentKeywords.filter((kw) => lower.includes(kw)).length;
  return matchCount >= 2;
}

/**
 * Extrahiert Basismodell aus Titel (z. B. "BMW 1er 118d" -> "1er", "BMW i4 eDrive40" -> "i4").
 */
function extractBaseModelFromTitle(title: string, brand: string): string {
  if (!title || !brand) return "";
  let rest = title.trim();
  const brandEscaped = brand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  rest = rest.replace(new RegExp(`^${brandEscaped}\\s+`, "i"), "").trim();
  if (!rest) return "";
  const first = rest.split(/\s+/)[0] || rest;
  if (/^\d+er$/i.test(first)) return first;
  if (/^[a-z]\d+$/i.test(first)) return first;
  return first;
}

/**
 * Sucht in einem String (z. B. Ausstattungstext) nach einem Modell-Muster (1er, 2er, i4, X1, …)
 * und gibt das erste Treffer zurück, damit "BMW Unbekannt" vermieden wird.
 */
function extractBaseModelFromString(s: string): string {
  if (!s || s.length < 2) return "";
  const trimmed = s.trim();
  // \d+er (1er, 2er, …) – Wortgrenze oder Komma/Leerzeichen davor
  const numberEr = trimmed.match(/(?:^|[\s,])(\d+er)(?:[\s,]|$)/i);
  if (numberEr) return numberEr[1];
  // i3, i4, i5, i7, iX1, … oder X1, X2, …
  const letterNum = trimmed.match(/(?:^|[\s,])([ix]\d+)(?:[\s,]|$)/i);
  if (letterNum) return letterNum[1];
  const xNum = trimmed.match(/(?:^|[\s,])(x\d+)(?:[\s,]|$)/i);
  if (xNum) return xNum[1];
  // A3, A4, Golf, Polo – erstes Wort, das wie Modell aussieht (Buchstabe + optional Zahl)
  const wordLikeModel = trimmed.match(/(?:^|[\s,])([a-z]{2,}\s*\d*[a-z]*)(?:[\s,]|$)/i);
  if (wordLikeModel) {
    const candidate = wordLikeModel[1].trim();
    if (candidate.length >= 2 && candidate.length <= 20) return candidate;
  }
  return "";
}

/**
 * Liest den vollständigen Fahrzeugtitel aus der API – prüft alle infrage kommenden Keys
 * und nimmt den längsten plausiblen String (damit "BMW 4er 420d Cabrio" statt nur "BMW Cabrio").
 */
function getFullTitleFromRaw(raw: Record<string, unknown>): string {
  const candidates: string[] = [];
  const titleLikeKeys = [
    "Title", "title", "FullName", "DisplayName", "Name", "name", "VehicleTitle", "vehicleTitle",
    "FullTitle", "DisplayTitle", "Bezeichnung", "vehicle_title", "fullName", "displayName",
  ];
  for (const key of titleLikeKeys) {
    const v = raw[key];
    if (v != null && typeof v === "string") {
      const s = v.trim();
      if (s.length >= 3 && !/^\d+$/.test(s)) candidates.push(s);
    }
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const inner = o.Name ?? o.name ?? o.Value ?? o.value ?? o.Text ?? o.DisplayName ?? o.FullName;
      if (inner != null && typeof inner === "string") {
        const s = String(inner).trim();
        if (s.length >= 3) candidates.push(s);
      }
    }
  }
  for (const key of Object.keys(raw)) {
    if (/id$/i.test(key)) continue;
    const keyLower = key.toLowerCase();
    if (!keyLower.includes("title") && !keyLower.includes("name") && !keyLower.includes("full") && !keyLower.includes("display") && !keyLower.includes("bezeichnung")) continue;
    const v = raw[key];
    if (v != null && typeof v === "string") {
      const s = (v as string).trim();
      if (s.length >= 10 && s.includes(" ") && !looksLikeEquipmentOrDescription(s)) candidates.push(s);
    }
  }
  if (candidates.length === 0) return "";
  const valid = candidates.filter((s) => s.length >= 5 && s.split(/\s+/).length >= 2 && !looksLikeEquipmentOrDescription(s));
  if (valid.length === 0) return candidates[0] ?? "";
  return valid.reduce((a, b) => (a.length >= b.length ? a : b));
}

/** Erkennt Baureihe-Code (z. B. G21, F30) – ein Buchstabe + 2–3 Ziffern. Nicht als Modellname verwenden. */
function isBaureiheCode(s: string): boolean {
  return /^[A-Z]\d{2,3}$/i.test((s || "").trim());
}

/** Mappt Baureihe-Code auf Modellreihe (1er, 3er, 5er …), damit nicht „G21“ als Modell angezeigt wird. */
function baureiheCodeToSeriesName(code: string): string {
  const c = (code || "").trim().toUpperCase();
  const seriesByCode: Record<string, string> = {
    G20: "3er", G21: "3er", F30: "3er", F31: "3er", F34: "3er", E90: "3er", E91: "3er", E92: "3er", E93: "3er",
    G30: "5er", G31: "5er", F10: "5er", F11: "5er", F18: "5er", E60: "5er", E61: "5er",
    F20: "1er", F21: "1er", E87: "1er",
    G22: "4er", G23: "4er", G26: "4er", F32: "4er", F33: "4er", F36: "4er",
    F22: "2er", F23: "2er", F45: "2er", F46: "2er", G42: "2er",
    G11: "7er", G12: "7er", G32: "6er", F06: "6er", F12: "6er", F13: "6er",
    G15: "8er", G16: "8er",
    F48: "X1", F49: "X1", E84: "X1", G01: "X3", F25: "X3", G02: "X4", F26: "X4",
    G05: "X5", F15: "X5", G06: "X6", F16: "X6", G07: "X7", F39: "X2",
  };
  if (seriesByCode[c]) return seriesByCode[c];
  const digit = c.replace(/^[A-Z]/, "");
  const first = digit.charAt(0);
  if (first === "1") return "1er";
  if (first === "2") return "2er";
  if (first === "3") return "3er";
  if (first === "4") return "4er";
  if (first === "5") return "5er";
  if (first === "6") return "6er";
  if (first === "7") return "7er";
  if (first === "8") return "8er";
  return "";
}

/** Liest ModelId aus Vehicle – auch aus verschachteltem Model-Objekt (z. B. raw.Model.ModelId). */
function getModelIdFromRaw(raw: Record<string, unknown>): number {
  const n = getNum(raw, "ModelId", "modelId", "ModelID", "model_id");
  if (n) return n;
  const modelObj = raw.Model ?? raw.model;
  if (modelObj != null && typeof modelObj === "object" && !Array.isArray(modelObj)) {
    const o = modelObj as Record<string, unknown>;
    const id = o.ModelId ?? o.modelId ?? o.Id ?? o.id;
    if (typeof id === "number" && !Number.isNaN(id)) return id;
    if (typeof id === "string") {
      const parsed = parseInt(id, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

/** Liest MakeId aus Vehicle – auch aus verschachteltem Make-Objekt. */
function getMakeIdFromRaw(raw: Record<string, unknown>): number {
  const n = getNum(raw, "MakeId", "makeId", "MakeID", "make_id");
  if (n) return n;
  const makeObj = raw.Make ?? raw.make;
  if (makeObj != null && typeof makeObj === "object" && !Array.isArray(makeObj)) {
    const o = makeObj as Record<string, unknown>;
    const id = o.MakeId ?? o.makeId ?? o.Id ?? o.id;
    if (typeof id === "number" && !Number.isNaN(id)) return id;
    if (typeof id === "string") {
      const parsed = parseInt(id, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

/** Sucht einen String in beliebigen Keys, die eines der Keywords enthalten (z. B. "make", "model"). Ignoriert reine IDs. */
function getStrFromMatchingKeys(obj: Record<string, unknown>, ...keywords: string[]): string {
  return getStrFromMatchingKeysExcluding(obj, keywords, []);
}

/** Liest Text aus CustomFields/AdditionalFields/TextFieldArray (z.B. {Name: "Freie Gestaltung", Value: "..."}) */
function getStrFromCustomFields(obj: Record<string, unknown>, ...names: string[]): string {
  const fields = obj.CustomFields ?? obj.customFields ?? obj.AdditionalFields ?? obj.additionalFields ?? obj.TextFields ?? obj.textFields ?? obj.ExtendedFields ?? obj.extendedFields;
  if (!fields) return "";
  const arr = Array.isArray(fields) ? fields : (fields && typeof fields === "object" && !Array.isArray(fields) ? Object.values(fields) : []);
  const lower = (s: string) => s.toLowerCase();
  for (const item of arr) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = String(o.Name ?? o.name ?? o.Key ?? o.key ?? o.DisplayName ?? o.FieldName ?? "").trim();
    const value = o.Value ?? o.value ?? o.Text ?? o.text ?? o.Content ?? o.content;
    if (!name || value == null) continue;
    const nameLower = lower(name);
    if (names.some((n) => nameLower.includes(lower(n)))) {
      const s = typeof value === "string" ? value.trim() : String(value).trim();
      if (s && s.length > 10) return s;
    }
  }
  return "";
}

/** Sucht rekursiv in verschachtelten Objekten nach Keys mit Keyword – für z.B. CustomFields.FreieGestaltung */
function getStrFromNestedMatchingKeys(obj: unknown, keywords: string[], maxDepth = 4): string {
  if (maxDepth <= 0) return "";
  if (obj == null) return "";
  if (typeof obj === "string") {
    const s = obj.trim();
    return s && !/^\d+$/.test(s) ? s : "";
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = getStrFromNestedMatchingKeys(item, keywords, maxDepth - 1);
      if (found) return found;
    }
    return "";
  }
  if (typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    const lower = (s: string) => s.toLowerCase();
    for (const key of Object.keys(o)) {
      const keyLower = lower(key);
      if (keywords.some((kw) => keyLower.includes(lower(kw))) && !keyLower.endsWith("id")) {
        const v = o[key];
        if (v != null && typeof v === "string") {
          const s = (v as string).trim();
          if (s && s.length > 10) return s; // sinnvoller Text (kein leerer oder kurzer Platzhalter)
        }
      }
    }
    for (const key of Object.keys(o)) {
      const v = o[key];
      if (v != null && typeof v === "object" && !Array.isArray(v)) {
        const found = getStrFromNestedMatchingKeys(v, keywords, maxDepth - 1);
        if (found) return found;
      }
      if (v != null && Array.isArray(v)) {
        const found = getStrFromNestedMatchingKeys(v, keywords, maxDepth - 1);
        if (found) return found;
      }
    }
  }
  return "";
}

/** Wie getStrFromMatchingKeys, aber Keys die ein excludeKeyword enthalten werden übersprungen (z. B. "interior" bei Außenfarbe). */
function getStrFromMatchingKeysExcluding(
  obj: Record<string, unknown>,
  includeKeywords: string[],
  excludeKeywords: string[] = []
): string {
  const lower = (s: string) => s.toLowerCase();
  for (const key of Object.keys(obj)) {
    const keyLower = lower(key);
    if (!includeKeywords.some((kw) => keyLower.includes(lower(kw)))) continue;
    if (excludeKeywords.some((kw) => keyLower.includes(lower(kw)))) continue;
    if (keyLower.endsWith("id")) continue; // MakeId, ModelId etc. sind IDs, keine Namen
    const v = obj[key];
    if (v != null && typeof v === "string") {
      if (/^\d+$/.test(v.trim())) continue; // reine Zahl = ID
      return v.trim();
    }
    if (v != null && typeof v === "number") continue; // Zahl = ID
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const name = o.Name ?? o.MakeName ?? o.ModelName ?? o.name ?? o.Text ?? o.DisplayName ?? o.Url ?? o.url ?? o.Value ?? o.value;
      if (name != null && typeof name === "string") return name.trim();
      if (name != null && typeof name === "number") return String(name);
    }
  }
  return "";
}

function parseVatDisplayable(raw: Record<string, unknown>): boolean | undefined {
  const direct =
    raw.HasVat ??
    raw.hasVat ??
    raw.HasVAT ??
    raw.vatDisplayable ??
    raw.VatDisplayable ??
    raw.vat_displayable ??
    raw.IsVatDisplayable ??
    raw.isVatDisplayable;

  if (typeof direct === "boolean") return direct;
  if (typeof direct === "number") return direct > 0;
  if (typeof direct === "string") {
    const s = direct.trim().toLowerCase();
    if (["true", "1", "yes", "ja", "y"].includes(s)) return true;
    if (["false", "0", "no", "nein", "n"].includes(s)) return false;
  }

  const vatText = getStrFromMatchingKeys(raw, "mwst", "vat");
  if (!vatText) return undefined;
  const t = vatText.toLowerCase();
  if (t.includes("nicht") || t.includes("no") || t.includes("ohne")) return false;
  if (t.includes("ausweisbar") || t.includes("inkl") || t.includes("mit mwst")) return true;
  return undefined;
}

function getNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
      if (!Number.isNaN(n)) return n;
    }
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const val = o.Value ?? o.value ?? o.Year ?? o.year ?? o.Amount ?? o.amount ?? o.Price ?? o.price ?? o.Ps ?? o.ps ?? o.Kw ?? o.kw;
      if (typeof val === "number" && !Number.isNaN(val)) return val;
    }
  }
  return 0;
}

/** Sucht eine Zahl in Keys, die eines der Keywords enthalten (z. B. Hubraum, Zylinder). */
function getNumFromMatchingKeys(obj: Record<string, unknown>, ...keywords: string[]): number {
  const lower = (s: string) => s.toLowerCase();
  for (const key of Object.keys(obj)) {
    const keyLower = lower(key);
    if (!keywords.some((kw) => keyLower.includes(lower(kw)))) continue;
    if (keyLower.endsWith("id")) continue;
    const v = obj[key];
    if (typeof v === "number" && !Number.isNaN(v) && v > 0) return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
      if (!Number.isNaN(n) && n > 0) return n;
    }
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const val = o.Value ?? o.value ?? o.Amount ?? o.amount;
      if (typeof val === "number" && !Number.isNaN(val) && val > 0) return val;
    }
  }
  return 0;
}

/** Parst Hubraum aus Zahl oder String (z. B. 1995, "1.995", "2.0 l" -> ccm). */
function parseCubicCapacityValue(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v) && v > 0) {
    return v < 100 ? Math.round(v * 1000) : Math.round(v); // 2.0 Liter -> 2000 ccm
  }
  if (typeof v === "string") {
    const s = v.trim();
    const numMatch = s.match(/(\d[\d.,]*)\s*(?:ccm|cm³|cm3|cc|l|liter)?/i);
    if (numMatch) {
      const n = parseFloat(numMatch[1].replace(/\./g, "").replace(",", "."));
      if (!Number.isNaN(n)) return n < 100 ? Math.round(n * 1000) : Math.round(n);
    }
  }
  if (v != null && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const val = o.Value ?? o.value ?? o.OriginalValue ?? o.originalValue ?? o.Amount ?? o.amount;
    return parseCubicCapacityValue(val);
  }
  return 0;
}

/**
 * Liest Hubraum (ccm) und Zylinder aus Roh-Objekt.
 * CarGate/Carzilla: Daten oft in verschachteltem Engine/Motor-Objekt
 * (analog zu Power mit FormattedValue/OriginalValue).
 * PDF dokumentiert Rückgabewerte nicht – Feldnamen empirisch/üblich.
 */
function getEngineSpecsFromRaw(raw: Record<string, unknown>, catalog?: SearchCatalogMaps): { cubicCapacity: number; cylinders: number } {
  let cubicCapacity = 0;
  let cylinders = 0;

  const checkObj = (o: Record<string, unknown>) => {
    const cyl = getNum(o, "Cylinders", "cylinders", "CylinderCount", "cylinderCount", "Zylinder", "zylinder", "NumberOfCylinders", "numberOfCylinders");
    if (cyl > 0) cylinders = cyl;
    // Hubraum: explizite Felder + OriginalValue (wie bei Power)
    const capKeys = ["CubicCapacity", "cubicCapacity", "EngineSize", "engineSize", "Displacement", "displacement", "Hubraum", "hubraum", "Ccm", "ccm", "Cm3", "cm3", "EngineCapacity", "engineCapacity", "EngineDisplacement", "engineDisplacement", "MotorDisplacement", "motorDisplacement"];
    for (const k of capKeys) {
      const val = o[k];
      const parsed = parseCubicCapacityValue(val);
      if (parsed >= 300 && parsed <= 10000) {
        cubicCapacity = parsed;
        break;
      }
    }
    if (cubicCapacity <= 0) {
      const orig = parseCubicCapacityValue(o.OriginalValue ?? o.originalValue);
      if (orig >= 300 && orig <= 10000) cubicCapacity = orig;
    }
    if (cubicCapacity <= 0) {
      const val = parseCubicCapacityValue(o.Value ?? o.value);
      if (val >= 300 && val <= 10000) cubicCapacity = val;
    }
    // FormattedValue z. B. "1.995 ccm" oder "2.0 l" parsen
    if (cubicCapacity <= 0) {
      const fmt = o.FormattedValue ?? o.formattedValue ?? o.Formatted ?? o.formatted;
      if (typeof fmt === "string") {
        const parsed = parseCubicCapacityValue(fmt);
        if (parsed >= 300 && parsed <= 10000) cubicCapacity = parsed;
      }
    }
    // Durchsuche alle Keys die Hubraum-relevant sein könnten
    if (cubicCapacity <= 0) {
      const lower = (s: string) => s.toLowerCase();
      for (const key of Object.keys(o)) {
        const k = lower(key);
        if (k.endsWith("id") || k.includes("cylinder") || k.includes("zylinder")) continue;
        if (k.includes("cubic") || k.includes("hubraum") || k.includes("ccm") || k.includes("displacement") || k.includes("capacity") || k.includes("engine") && (k.includes("size") || k.includes("vol")) || k.includes("motor") && k.includes("size")) {
          const parsed = parseCubicCapacityValue(o[key]);
          if (parsed >= 300 && parsed <= 10000) {
            cubicCapacity = parsed;
            break;
          }
        }
      }
    }
  };

  const engineObj = raw.Engine ?? raw.engine ?? raw.Motor ?? raw.motor;
  if (engineObj != null && typeof engineObj === "object" && !Array.isArray(engineObj)) {
    checkObj(engineObj as Record<string, unknown>);
  }
  if (cubicCapacity <= 0 || cylinders <= 0) {
    checkObj(raw);
  }
  // CubicCapacityId über Katalog auflösen (wie MotorTypeId)
  if (cubicCapacity <= 0 && catalog?.cubicCapacityIdToValue) {
    const capId = getNum(raw, "CubicCapacityId", "cubicCapacityId");
    const engineObj2 = raw.Engine ?? raw.engine ?? raw.Motor ?? raw.motor;
    const capIdFromEngine = engineObj2 != null && typeof engineObj2 === "object" && !Array.isArray(engineObj2)
      ? getNum(engineObj2 as Record<string, unknown>, "CubicCapacityId", "cubicCapacityId") : 0;
    const id = capId || capIdFromEngine;
    if (id > 0) {
      const val = catalog.cubicCapacityIdToValue.get(id);
      if (val != null && val >= 300 && val <= 10000) cubicCapacity = val;
    }
  }
  if (cubicCapacity <= 0) {
    cubicCapacity = getNumFromMatchingKeys(raw, "cubic", "hubraum", "displacement", "engine", "capacity", "ccm", "cm3");
    if (cubicCapacity > 0 && cubicCapacity < 100) cubicCapacity = Math.round(cubicCapacity * 1000);
  }
  if (cylinders <= 0) {
    cylinders = getNumFromMatchingKeys(raw, "cylinder", "zylinder");
  }
  return { cubicCapacity, cylinders };
}

/** Liest Verkaufspreis aus Roh-Objekt: SalePrice, Price oft als Objekt mit Value/Amount/Price. */
function getPriceFromRaw(raw: Record<string, unknown>): number {
  const priceKeys = ["SalePrice", "salePrice", "Price", "price", "sellingPrice", "selling_price", "Preis", "DealerPrice", "HousePrice", "CampaignPrice"];
  for (const k of priceKeys) {
    const v = raw[k];
    if (typeof v === "number" && v >= 0 && v < 1e9) return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
      if (!Number.isNaN(n) && n >= 0 && n < 1e9) return n;
    }
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const val = o.Value ?? o.value ?? o.Amount ?? o.amount ?? o.Price ?? o.price ?? o.OriginalValue ?? o.originalValue;
      if (typeof val === "number" && val >= 0 && val < 1e9) return val;
      if (typeof val === "string") {
        const n = parseFloat(String(val).replace(/\./g, "").replace(",", "."));
        if (!Number.isNaN(n) && n >= 0 && n < 1e9) return n;
      }
      for (const subVal of Object.values(o)) {
        if (typeof subVal === "number" && subVal >= 0 && subVal < 1e9) return subVal;
        if (typeof subVal === "string") {
          const n = parseFloat(String(subVal).replace(/\./g, "").replace(",", "."));
          if (!Number.isNaN(n) && n >= 0 && n < 1e9) return n;
        }
      }
    }
  }
  const lower = (s: string) => s.toLowerCase();
  for (const key of Object.keys(raw)) {
    const k = lower(key);
    if ((k.includes("price") || k.includes("preis")) && !k.endsWith("id")) {
      const v = raw[key];
      if (typeof v === "number" && v >= 0 && v < 1e9) return v;
      if (v != null && typeof v === "object" && !Array.isArray(v)) {
        const o = v as Record<string, unknown>;
        const val = o.Value ?? o.value ?? o.Amount ?? o.amount ?? o.Price ?? o.price ?? o.OriginalValue ?? o.originalValue;
        if (typeof val === "number" && val >= 0 && val < 1e9) return val;
        for (const subVal of Object.values(o)) {
          if (typeof subVal === "number" && subVal >= 0 && subVal < 1e9) return subVal;
        }
      }
    }
  }
  return 0;
}

/** Parst Jahr aus String: .NET /Date(ms)/, ISO YYYY-MM-DD, oder DD.MM.YYYY. */
function yearFromDateString(s: string, minYear: number, maxYear: number): number {
  const trimmed = s.trim();
  const netMatch = trimmed.match(/^\/Date\((\d+)/);
  if (netMatch) {
    const y = new Date(parseInt(netMatch[1], 10)).getFullYear();
    if (y >= minYear && y <= maxYear) return y;
  }
  const isoYear = trimmed.slice(0, 4);
  const yIso = parseInt(isoYear, 10);
  if (!Number.isNaN(yIso) && yIso >= minYear && yIso <= maxYear) return yIso;
  const ddmmyy = trimmed.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ddmmyy) {
    const y = parseInt(ddmmyy[3], 10);
    if (y >= minYear && y <= maxYear) return y;
  }
  const numMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  if (numMatch) {
    const y = parseInt(numMatch[0], 10);
    if (y >= minYear && y <= maxYear) return y;
  }
  return 0;
}

/** Liest Erstzulassungsjahr aus Roh-Objekt: FirstRegistration, Year, oder Datums-String (.NET/ISO). */
function getYearFromRaw(raw: Record<string, unknown>): number {
  const lower = (s: string) => s.toLowerCase();
  const currentYear = new Date().getFullYear();
  const minYear = 1990;
  const maxYear = currentYear + 1;

  const numFromVal = (v: unknown): number => {
    if (typeof v === "number" && v >= minYear && v <= maxYear) return v;
    if (typeof v === "string") return yearFromDateString(v, minYear, maxYear);
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const yNum = o.Year ?? o.year;
      if (typeof yNum === "number" && yNum >= minYear && yNum <= maxYear) return yNum;
      const yStr = o.Value ?? o.value ?? o.Date ?? o.date ?? o.Name ?? o.name;
      if (typeof yStr === "string") return yearFromDateString(yStr, minYear, maxYear);
      if (typeof yStr === "number" && yStr >= minYear && yStr <= maxYear) return yStr;
      for (const val of Object.values(o)) {
        if (typeof val === "string") {
          const y = yearFromDateString(val, minYear, maxYear);
          if (y > 0) return y;
        }
        if (typeof val === "number" && val >= minYear && val <= maxYear) return val;
      }
    }
    return 0;
  };

  const yearKeys = [
    "FirstRegistration",
    "firstRegistration",
    "FirstRegistrationDate",
    "RegistrationDate",
    "Year",
    "year",
    "initialRegistration",
    "Baujahr",
    "constructionYear",
    "EZ",
    "ez",
    "DateOfFirstRegistration",
  ];
  for (const k of yearKeys) {
    const v = raw[k];
    const y = numFromVal(v);
    if (y > 0) return y;
  }

  for (const key of Object.keys(raw)) {
    const k = lower(key);
    if (k.endsWith("id")) continue;
    if (k.includes("registration") || k.includes("year") || k.includes("baujahr") || k === "ez" || (k.includes("first") && k.includes("reg"))) {
      const y = numFromVal(raw[key]);
      if (y > 0) return y;
    }
  }
  return 0;
}

/** Liest eine Zahl aus einem Objekt (direkt, String wie "150" oder "110 kW", oder Unterobjekt Value/Ps/Kw). */
function getNumFromValue(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    const numMatch = trimmed.match(/(\d{1,4})\s*(?:PS|kW|kw|ps)?/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (!Number.isNaN(n)) return n;
    }
    const n = parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
    if (!Number.isNaN(n)) return n;
  }
  if (v != null && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const val = o.Value ?? o.value ?? o.Ps ?? o.ps ?? o.Kw ?? o.kw ?? o.Amount ?? o.amount ?? o.Name ?? o.name;
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    if (typeof val === "string") {
      const n = parseInt(val.replace(/\D/g, ""), 10);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

/** Liest PS und kW aus Roh-Objekt: Power, PowerPs, PowerKw, oder beliebige Keys mit power/ps/kw/leistung. */
function getPowerFromRaw(raw: Record<string, unknown>): { power?: number; powerKw?: number } {
  const lower = (s: string) => s.toLowerCase();
  let power = 0;
  let powerKw = 0;

  // 1) Verschachteltes Power-Objekt (Carzilla: { FormattedValue: "100 kW (136 PS)", OriginalValue: 100 } oder Ps/Kw/Value)
  const powerObj = raw.Power ?? raw.power;
  if (powerObj != null && typeof powerObj === "object" && !Array.isArray(powerObj)) {
    const o = powerObj as Record<string, unknown>;
    let ps = getNumFromValue(o.Ps ?? o.ps) || getNumFromValue(o.Value ?? o.value);
    let kw = getNumFromValue(o.Kw ?? o.kw);
    const originalVal = o.OriginalValue ?? o.originalValue;
    if (typeof originalVal === "number" && originalVal > 0 && originalVal < 2000) kw = originalVal;
    const formatted = o.FormattedValue ?? o.formattedValue;
    if (typeof formatted === "string") {
      const psMatch = formatted.match(/\((\d+)\s*PS\)|(\d+)\s*PS/i);
      if (psMatch) ps = parseInt(psMatch[1] ?? psMatch[2] ?? "0", 10);
      const kwMatch = formatted.match(/(\d+)\s*kW/i);
      if (kwMatch && (kw <= 0 || !kw)) kw = parseInt(kwMatch[1], 10);
    }
    if (ps > 0) power = ps;
    if (kw > 0) powerKw = kw;
  }

  // 2) Top-Level PowerPs / PowerKw (oft Objekte mit .Value wie SalePrice)
  if (power <= 0) {
    const psVal = getNumFromValue(raw.PowerPs ?? raw.powerPs ?? raw.Ps ?? raw.ps);
    if (psVal > 0) power = psVal;
  }
  if (powerKw <= 0) {
    const kwVal = getNumFromValue(raw.PowerKw ?? raw.powerKw ?? raw.Kw ?? raw.kw);
    if (kwVal > 0) powerKw = kwVal;
  }

  // 3) Beliebige Keys die "power" + "ps" oder "ps"/"leistung" (nicht "kw") enthalten → PS
  if (power <= 0) {
    for (const key of Object.keys(raw)) {
      const k = lower(key);
      if (k.endsWith("id")) continue;
      const isPsKey = (k.includes("ps") || k.includes("leistung")) && !k.includes("kw");
      const isPowerPsKey = k.includes("power") && (k.includes("ps") || k === "power");
      if (isPsKey || isPowerPsKey) {
        const v = getNumFromValue(raw[key]);
        if (v > 0 && v < 5000) {
          power = v;
          break;
        }
      }
    }
  }
  // 4) Beliebige Keys die "kw" oder "power" + "kw" enthalten → kW
  if (powerKw <= 0) {
    for (const key of Object.keys(raw)) {
      const k = lower(key);
      if (k.endsWith("id")) continue;
      if (k.includes("kw")) {
        const v = getNumFromValue(raw[key]);
        if (v > 0 && v < 2000) {
          powerKw = v;
          break;
        }
      }
    }
  }

  return {
    power: power > 0 ? power : undefined,
    powerKw: powerKw > 0 ? powerKw : undefined,
  };
}

/**
 * Mappt ein Roh-Fahrzeug aus der CarGate API auf unser Vehicle-Format.
 * Feldnamen können je nach PDF (Carzilla V6) variieren – hier die gängigen Varianten abgedeckt.
 */
let _carzillaStructureLogged = false;
let _carzillaPowerStructureLogged = false;
let _carzillaYearStructureLogged = false;
let _carzillaFuelLogged = false;
let _carzillaPriceStructureLogged = false;
let _carzillaExposeStructureLogged = false;
let _carzillaEngineLogged = false;
let _carzillaDescriptionLogged = false;

function mapCargateItemToVehicle(raw: Record<string, unknown>, catalog?: SearchCatalogMaps): Vehicle {
  const id =
    getStr(raw, "id", "vehicleId", "vehicle_id", "VehicleId") ||
    String(getNum(raw, "id", "vehicleId", "vehicle_id", "VehicleId"));

  // Nur CarGate-Daten übernehmen, nichts ableiten oder ersetzen (keine Baureihe-/BodyType-Logik).
  const makeObj = raw.Make ?? raw.make;
  const makeNameFromObj = makeObj != null && typeof makeObj === "object" && !Array.isArray(makeObj)
    ? String((makeObj as Record<string, unknown>).Name ?? (makeObj as Record<string, unknown>).name ?? "").trim()
    : "";
  const makeId = getMakeIdFromRaw(raw);
  const brand =
    makeNameFromObj ||
    ((catalog?.makeIdToName && makeId ? catalog.makeIdToName.get(makeId) : undefined) ??
      (getStr(raw, "Make", "make", "brand", "manufacturer", "Marke", "MakeName") ||
        getStrFromMatchingKeys(raw, "make", "brand", "marke", "manufacturer", "hersteller") ||
        ""));

  const modelObj = raw.Model ?? raw.model;
  const modelNameFromObj = modelObj != null && typeof modelObj === "object" && !Array.isArray(modelObj)
    ? String((modelObj as Record<string, unknown>).Name ?? (modelObj as Record<string, unknown>).ModelName ?? (modelObj as Record<string, unknown>).name ?? "").trim()
    : "";
  const modelId = getModelIdFromRaw(raw);
  const model =
    modelNameFromObj ||
    ((catalog?.modelIdToName && modelId ? catalog.modelIdToName.get(modelId) : undefined) ??
      (getModelFromRaw(raw) || ""));

  const productionSeriesRaw = getStr(raw, "ProductionSeries", "productionSeries");
  const bodyTypeStr =
    getStr(raw, "BodyType", "bodyType", "vehicleType", "Karosserie", "BodyTypeName") ||
    getStrFromMatchingKeys(raw, "body", "karosserie", "vehicletype");

  const title = brand && model ? `${brand} ${model}`.trim() : "";

  const price = getPriceFromRaw(raw) || getNum(raw, "SalePrice", "salePrice", "Price", "price", "sellingPrice", "selling_price", "Preis");
  if (!_carzillaPriceStructureLogged && (!price || price <= 0)) {
    _carzillaPriceStructureLogged = true;
    const priceKeys = Object.keys(raw).filter((k) => /price|preis|sale|dealer|house|campaign/i.test(k) && !/id$/i.test(k));
    const sample: Record<string, unknown> = {};
    for (const k of priceKeys) sample[k] = raw[k];
    console.warn("Carzilla: Preis nicht gefunden (0). Rohdaten (Preis-Keys):", JSON.stringify(sample, null, 2).slice(0, 1200));
  }
  const fallbackYear = new Date().getFullYear() - 1;
  let year = getYearFromRaw(raw) || getNum(raw, "FirstRegistration", "firstRegistration", "year", "Year", "initialRegistration", "ez", "EZ", "constructionYear", "Baujahr");
  if (!year || year < 1990) {
    year = fallbackYear;
    if (!_carzillaYearStructureLogged) {
      _carzillaYearStructureLogged = true;
      const yearKeys = Object.keys(raw).filter((k) => /registration|year|baujahr|ez|first/i.test(k) && !/id$/i.test(k));
      const sample: Record<string, unknown> = {};
      for (const k of yearKeys) sample[k] = raw[k];
      console.warn("Carzilla: Erstzulassung nicht gefunden – Fallback auf " + fallbackYear + ". Rohdaten (Jahr-relevante Keys):", JSON.stringify(sample, null, 2).slice(0, 1500));
    }
  }
  const mileage = getNum(raw, "Km", "km", "mileage", "Mileage", "kilometer", "odometer", "Kilometerstand");
  let fuel =
    getStr(raw, "FuelType", "fuelType", "Fuel", "fuel", "fuelTypeName", "Kraftstoff", "MotorType", "motorType", "MotorTypeName", "motorTypeName") ||
    getStrFromMatchingKeys(raw, "fuel", "kraftstoff", "fueltype", "motor", "motortype", "motorart");
  // MotorTypeId / FuelTypeId über Katalog auflösen (CarGate: MotorTypes = Motorarten-IDs)
  if (!fuel && catalog?.motorTypeIdToName) {
    const motorId = getNum(raw, "MotorTypeId", "motorTypeId", "FuelTypeId", "fuelTypeId");
    if (motorId > 0) {
      const name = catalog.motorTypeIdToName.get(motorId);
      if (name) fuel = name;
    }
  }
  let transmission =
    getStr(raw, "Transmission", "transmission", "gearbox", "Getriebe", "TransmissionType") ||
    getStrFromMatchingKeys(raw, "transmission", "getriebe", "gearbox");
  const powerFromObj = getPowerFromRaw(raw);
  let power = powerFromObj.power ?? (getNum(raw, "Power", "power", "PowerPs", "powerPs", "ps", "Leistung") || undefined);
  let powerKw = powerFromObj.powerKw ?? (getNum(raw, "PowerKw", "powerKw", "power_kw", "kW", "LeistungKw") || undefined);
  if (power && !powerKw) powerKw = Math.round(power / 1.36);
  if (powerKw && !power) power = Math.round(powerKw * 1.36);

  // Hubraum (ccm) und Zylinderanzahl – aus Engine/Motor-Objekt oder Top-Level
  const engineSpecs = getEngineSpecsFromRaw(raw, catalog);
  const cubicCapacity = engineSpecs.cubicCapacity;
  const cylinders = engineSpecs.cylinders;

  // Einmalig Engine-Struktur loggen wenn Hubraum fehlt (Zylinder funktionieren – Hubraum-Feldname ermitteln)
  if (!cubicCapacity && cylinders > 0 && !_carzillaEngineLogged) {
    _carzillaEngineLogged = true;
    const engineObj = raw.Engine ?? raw.engine ?? raw.Motor ?? raw.motor;
    const engineKeys = engineObj != null && typeof engineObj === "object" && !Array.isArray(engineObj)
      ? Object.keys(engineObj as Record<string, unknown>)
      : [];
    const engineSample = engineObj != null && typeof engineObj === "object" ? engineObj : {};
    console.warn("Carzilla: Hubraum nicht gefunden (Zylinder ok). Engine-Keys:", engineKeys.join(", "), "| Engine-Sample:", JSON.stringify(engineSample, null, 2).slice(0, 1200));
  }

  // Einmalig Power-Struktur loggen, wenn Leistung fehlt (Debug für API-Anpassung)
  if (!_carzillaPowerStructureLogged && !power && !powerKw) {
    _carzillaPowerStructureLogged = true;
    const powerKeys = Object.keys(raw).filter((k) => /power|ps|kw|leistung/i.test(k) && !/id$/i.test(k));
    const powerSample: Record<string, unknown> = {};
    for (const k of powerKeys) {
      powerSample[k] = raw[k];
    }
    if (Object.keys(powerSample).length > 0) {
      console.warn("Carzilla: Power-Struktur (Leistung fehlt):", JSON.stringify(powerSample, null, 2).slice(0, 1200));
    }
  }

  const imageUrl = getStr(raw, "ImageUrl", "imageUrl", "image", "vehicleImageUrl", "mainImage");
  const branchId = (() => {
    const b = raw.Branch ?? raw.branch;
    if (b != null && typeof b === "object" && "BranchId" in b) return String((b as { BranchId: unknown }).BranchId);
    if (b != null && typeof b === "object" && "branchId" in b) return String((b as { branchId: unknown }).branchId);
    return getBranchId();
  })();
  const exposeTemplate = process.env.CARGATE_EXPOSE_URL_TEMPLATE?.trim();
  const exposeBaseUrl = (process.env.CARGATE_EXPOSE_BASE_URL || "https://fahrzeuge.gs-automobile-rheinland.de").replace(/\/+$/, "");
  const useVidParam = (process.env.CARGATE_EXPOSE_USE_VID || "").toLowerCase() === "true";

  let offerUrl =
    normalizeDealerUrlForExpose(
      getStr(raw, "OfferUrl", "offerUrl", "url", "detailUrl", "link") ||
        getStrFromMatchingKeys(raw, "offer", "detail", "fahrzeugsuche", "fahrzeugdetail", "link"),
      exposeBaseUrl
    ) || "";
  // "Freie Gestaltung" (CarGate/Carzilla V6) = freie Fahrzeugbeschreibung (Bei Anfragen, Ausstattung usw.) – als Text-Feld in CarGate
  let description =
    getStr(raw, "FreieGestaltung", "freieGestaltung", "Freie_Gestaltung", "FreieGestaltungText", "freieGestaltungText", "FreeDesign", "freeDesign", "Description", "description", "comment", "Beschreibung") ||
    getStrFromMatchingKeys(raw, "freie", "gestaltung") ||
    getStrFromNestedMatchingKeys(raw, ["freie", "gestaltung"]);
  if (!description) {
    description = getStrFromCustomFields(raw, "Freie Gestaltung", "freie gestaltung", "FreieGestaltung", "FreieGestaltungText");
  }
  if (!description && !_carzillaDescriptionLogged) {
    _carzillaDescriptionLogged = true;
    const textKeys = Object.keys(raw).filter((k) =>
      /freie|gestaltung|description|beschreibung|comment|text/i.test(k) && !/id$/i.test(k)
    );
    const sample: Record<string, unknown> = {};
    for (const k of textKeys) sample[k] = raw[k];
    const topKeys = Object.keys(raw).slice(0, 40).join(", ");
    console.warn(
      "Carzilla: Freie Gestaltung/Beschreibung nicht gefunden. Top-Level-Keys:", topKeys,
      textKeys.length > 0 ? "| Relevante Keys:" : "",
      textKeys.length > 0 ? JSON.stringify(sample, null, 2).slice(0, 1200) : ""
    );
  }
  // Außenfarbe (Allgemeinfarbe für Suche/Filter)
  let exteriorColor =
    getStr(raw, "Color", "ExteriorColor", "exteriorColor", "color", "colour", "Außenfarbe", "PaintColor", "VehicleColor") ||
    getStrFromMatchingKeysExcluding(raw, ["exterior", "color", "farbe", "außen", "paint", "vehicle"], ["interior", "innen", "inner"]);
  // Color/ExteriorColor kann Objekt sein – dann Name/Value lesen
  if (!exteriorColor) {
    const colorObj = raw.Color ?? raw.ExteriorColor ?? raw.color ?? raw.exteriorColor;
    if (colorObj != null && typeof colorObj === "object" && !Array.isArray(colorObj)) {
      const o = colorObj as Record<string, unknown>;
      exteriorColor = getStr(o, "Name", "name", "Value", "value", "Text", "DisplayName");
    }
  }

  // Vollständige Herstellerfarbe: CarGate nutzt Color.AdditionalValue (z. B. "QUARTZ/ARTENSE GREY")
  let exteriorColorFull = "";
  const colorObj = raw.Color ?? raw.ExteriorColor ?? raw.color ?? raw.exteriorColor;
  if (colorObj != null && typeof colorObj === "object" && !Array.isArray(colorObj)) {
    const o = colorObj as Record<string, unknown>;
    exteriorColorFull = getStr(o, "AdditionalValue", "additionalValue", "Herstellerfarbe", "Farbcode", "ManufacturerColor", "Name", "name");
  }
  if (!exteriorColorFull) {
    exteriorColorFull = getStr(raw, "Herstellerfarbe", "Farbcode", "AdditionalValue", "ManufacturerColor", "ColorCode", "PaintCode");
  }
  // Innenfarbe (Carzilla API: ColorInterieur)
  let interiorColor =
    getStr(raw, "ColorInterieur", "InteriorColor", "interiorColor", "Innenfarbe", "InteriorColour") ||
    getStrFromMatchingKeys(raw, "interior", "innen", "inner");
  const internalNumber = getStr(raw, "OfferNumber", "offerNumber", "internalNumber", "stockNumber", "Angebotsnummer", "articleNumber", "StockNumber");
  const vehicleType = bodyTypeStr ||
    getStr(raw, "BodyType", "bodyType", "vehicleType", "Karosserie", "BodyTypeName") ||
    getStrFromMatchingKeys(raw, "body", "karosserie", "vehicletype");
  let exposeUrl = getUrlFromRaw(raw, "ExposeUrl", "exposeUrl", "ExposePdfUrl", "exposePdfUrl", "ExposePdf", "exposePdf", "PdfUrl", "pdfUrl", "ExposeLink", "exposeLink") || getStr(raw, "ExposeUrl", "exposeUrl", "exposePdf", "ExposePdfUrl") || getStrFromMatchingKeys(raw, "expose", "exposé", "pdf");
  if (!exposeUrl && !_carzillaExposeStructureLogged) {
    _carzillaExposeStructureLogged = true;
    const exposeKeys = Object.keys(raw).filter((k) => /expose|exposé|pdf|link|url/i.test(k) && !/id$/i.test(k));
    const sample: Record<string, unknown> = {};
    for (const k of exposeKeys) sample[k] = raw[k];
    if (exposeKeys.length > 0) console.warn("Carzilla: Exposé-URL nicht gefunden. Rohdaten (expose/pdf/url-Keys):", JSON.stringify(sample, null, 2).slice(0, 800));
  }
  if (!exposeUrl && id) {
    let oidForExpose = getStr(raw, "Oid", "oid", "OfferId", "OfferGuid", "VehicleGuid", "Uuid", "Guid") || getUrlFromRaw(raw, "Oid", "oid", "OfferId");
    if (!oidForExpose && offerUrl) oidForExpose = extractOidFromOfferUrl(offerUrl) || "";
    const hasRealOid = oidForExpose && isUuidLike(oidForExpose);
    if (!oidForExpose) oidForExpose = id;
    oidForExpose = formatOidAsUuid(oidForExpose);
    const defaultDetailUrl = (offerUrl && (offerUrl.startsWith("http") || offerUrl.startsWith("/")) ? offerUrl : null) || `${exposeBaseUrl}/Fahrzeugsuche/Details?vid=${id}`;
    if (exposeTemplate) {
      exposeUrl = exposeTemplate
        .replace(/\{id\}/gi, id)
        .replace(/\{vehicleId\}/gi, id)
        .replace(/\{oid\}/gi, oidForExpose)
        .replace(/\{vid\}/gi, id)
        .replace(/\{ourl\}/gi, () => encodeURIComponent(defaultDetailUrl));
      if (!exposeUrl.startsWith("http://") && !exposeUrl.startsWith("https://")) {
        exposeUrl = (exposeUrl.startsWith("/") ? exposeBaseUrl + exposeUrl : exposeBaseUrl + "/" + exposeUrl);
      }
    } else {
      if (useVidParam || !hasRealOid) {
        exposeUrl = `${exposeBaseUrl}/Expose.pdf?vid=${encodeURIComponent(id)}&ourl=${encodeURIComponent(defaultDetailUrl)}`;
      } else {
        exposeUrl = `${exposeBaseUrl}/Expose.pdf?oid=${encodeURIComponent(oidForExpose)}&ourl=${encodeURIComponent(defaultDetailUrl)}`;
      }
    }
    if (!exposeUrl.startsWith("http") && !exposeUrl.startsWith("/")) exposeUrl = "";
  }
  const previousOwners = typeof raw.PreviousOwners === "number" ? raw.PreviousOwners : typeof raw.previousOwners === "number" ? raw.previousOwners : getNum(raw, "PreviousOwners", "previousOwners", "numberOfPreviousOwners");
  const vatDisplayable = parseVatDisplayable(raw);
  // Bildanzahl aus API (RealImageCount = echte Fotos, ImageCount/CountImages = Alternativen)
  const imageCountFromApi = getNum(raw, "RealImageCount", "realImageCount", "ImageCount", "imageCount", "CountImages", "countImages", "ImageSetSize", "imageSetSize");

  // Modellzusatz (VersionAdditional) – Ausstattungszeile wie "M-SPORT ACC AHK 360° HEAD-UP"
  let modelVariantFromApi = getVersionAdditionalFromRaw(raw);

  // Einmalig Struktur loggen: Modell/Make/Variant/Ausstattung aus API (für Debug)
  if (!_carzillaStructureLogged) {
    _carzillaStructureLogged = true;
    const modelRelated: Record<string, unknown> = {};
    for (const k of Object.keys(raw)) {
      const keyLower = k.toLowerCase();
      if (
        keyLower.includes("model") || keyLower.includes("modell") || keyLower.includes("make") || keyLower.includes("marke") ||
        keyLower.includes("series") || keyLower.includes("baureihe") || keyLower.includes("version") || keyLower.includes("variant") ||
        keyLower.includes("trim") || keyLower.includes("line") || keyLower.includes("title") ||
        keyLower.includes("color") || keyLower.includes("farbe") || keyLower.includes("farbcode") || keyLower.includes("herstellerfarbe") || keyLower.includes("paint") ||
        keyLower.includes("equipment") || keyLower.includes("ausstattung") || keyLower.includes("feature")
      ) {
        modelRelated[k] = raw[k];
      }
    }
    console.warn("Carzilla: Modell/Make/Variant/Ausstattung (erstes Fahrzeug):", JSON.stringify(modelRelated, null, 2).slice(0, 3000));
    // Alle Keys des ersten Fahrzeugs (für Struktur-Erkennung)
    console.warn("Carzilla: Alle Keys des ersten Fahrzeugs:", Object.keys(raw).sort().join(", "));
  }

  // Standtage / Zugangsdatum (PDF: CreatedAt; Carzilla liefert .NET-Format /Date(ms+offset)/)
  let arrivalDateRaw = getStr(raw, "arrivalDate", "arrival_date", "dateOfArrival", "DateOfArrival", "createdAt", "CreatedAt", "stockDate", "stock_date", "created_at", "Zugangsdatum", "Erfassungsdatum", "created");
  let arrivalDate = parseDotNetDate(arrivalDateRaw) || (arrivalDateRaw && arrivalDateRaw.length >= 10 ? arrivalDateRaw.slice(0, 10) : undefined);
  const standtage = getNum(raw, "standtage", "Standtage", "daysInStock", "days_in_stock", "stockDays", "TageImBestand", "CreatedWithinLastDays");
  if (!arrivalDate && standtage > 0) {
    const d = new Date();
    d.setDate(d.getDate() - standtage);
    arrivalDate = d.toISOString().slice(0, 10);
  }
  // Für DB und Frontend: nur YYYY-MM-DD (PostgreSQL DATE) oder ISO mit Zeit für Anzeige
  if (arrivalDate && arrivalDate.length === 10) {
    arrivalDate = `${arrivalDate}T00:00:00.000Z`;
  }
  // Standtage für Anzeige/Sortierung: von API oder aus Zugangsdatum berechnen
  let standtageNum = standtage > 0 ? standtage : undefined;
  if (standtageNum == null && arrivalDate) {
    standtageNum = Math.max(0, Math.floor((Date.now() - new Date(arrivalDate).getTime()) / 86400000));
  }

  if (!fuel) {
    fuel = "Unbekannt";
    if (!_carzillaFuelLogged) {
      _carzillaFuelLogged = true;
      const fuelKeys = Object.keys(raw).filter((k) => /fuel|kraftstoff|motor|motorart|motortype/i.test(k));
      const sample: Record<string, unknown> = {};
      for (const k of fuelKeys) sample[k] = raw[k];
      console.warn("Carzilla: Kraftstoff nicht gefunden – Fallback Unbekannt. Rohdaten (fuel/motor-Keys):", JSON.stringify(sample, null, 2).slice(0, 800));
    }
  }
  if (!transmission) transmission = "Unbekannt";

  // Nur CarGate-Daten: keine Ableitung aus Titel oder Textanalyse. Marke/Modell exakt wie von der API.
  const displayBrand = brand || "Unbekannt";
  let displayModel = model || "Unbekannt";
  const category = determineCategory(displayBrand, displayModel, power, fuel);

  // Ausstattung: 1) EquipmentIds + Katalog, 2) Equipment/EquipmentList Array, 3) kommaseparierter String
  let equipment: string[] = [];
  const equipmentIds = raw.EquipmentIds ?? raw.equipmentIds ?? raw.EquipmentId ?? raw.equipmentId;
  if (catalog?.equipmentIdToName && equipmentIds) {
    const ids = Array.isArray(equipmentIds) ? equipmentIds : [equipmentIds];
    for (const idRaw of ids) {
      const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);
      if (!Number.isNaN(id)) {
        const name = catalog.equipmentIdToName.get(id);
        if (name && !equipment.includes(name)) equipment.push(name);
      }
    }
  }
  if (equipment.length === 0) {
    const eq = raw.equipment ?? raw.Equipment ?? raw.EquipmentList ?? raw.EquipmentItems ?? raw.Features ?? raw.Ausstattung ?? raw.StandardEquipment ?? raw.Serienausstattung;
    if (Array.isArray(eq)) {
      equipment = eq
        .map((x) => {
          if (x == null) return "";
          if (typeof x === "string") return x.trim();
          if (typeof x === "object" && !Array.isArray(x)) {
            const o = x as Record<string, unknown>;
            return String(o.Name ?? o.name ?? o.Text ?? o.text ?? o.Value ?? o.value ?? o.DisplayName ?? o.DisplayText ?? o.Description ?? "").trim();
          }
          return String(x).trim();
        })
        .filter((s): s is string => Boolean(s && s !== "undefined"));
    } else if (typeof eq === "string") {
      equipment = eq.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  // Fallback: Alle Keys durchsuchen, die Arrays mit Name-Objekten enthalten (CarGate-Struktur variiert)
  if (equipment.length === 0) {
    for (const key of Object.keys(raw)) {
      const keyLower = key.toLowerCase();
      if (!keyLower.includes("equip") && !keyLower.includes("ausstattung") && !keyLower.includes("feature") && !keyLower.includes("option")) continue;
      const v = raw[key];
      if (!Array.isArray(v) || v.length === 0) continue;
      const items = v
        .map((x: unknown) => {
          if (x == null) return "";
          if (typeof x === "string") return x.trim();
          if (typeof x === "object" && !Array.isArray(x)) {
            const o = x as Record<string, unknown>;
            return String(o.Name ?? o.name ?? o.Text ?? o.text ?? o.Value ?? o.value ?? "").trim();
          }
          return String(x).trim();
        })
        .filter((s: string) => s && s.length > 1);
      if (items.length > 0) {
        equipment = items;
        break;
      }
    }
  }

  // Modell = Version/ModelVersion (z. B. "220 Active Tourer") hat Priorität vor Katalog-Modell ("2er")
  const versionFromApi = getVersionFromRaw(raw);
  if (versionFromApi && versionFromApi.length >= displayModel.length && !looksLikeEquipmentOrDescription(versionFromApi)) {
    displayModel = versionFromApi;
  }
  // Fallback: Aus FullTitle extrahieren (Brand + Model + Modellzusatz) → Model = Rest nach Brand minus Modellzusatz
  else {
    const fullTitleFromApi = getFullTitleFromRaw(raw);
    if (fullTitleFromApi && displayBrand && modelVariantFromApi) {
      const brandEscaped = displayBrand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let restAfterBrand = fullTitleFromApi.replace(new RegExp(`^${brandEscaped}\\s+`, "i"), "").trim();
      // Modellzusatz am Ende entfernen → ergibt Modell (z. B. "220 Active Tourer")
      const v = modelVariantFromApi.trim();
      if (restAfterBrand.toLowerCase().endsWith(v.toLowerCase())) {
        restAfterBrand = restAfterBrand.slice(0, -v.length).trim();
      }
      if (restAfterBrand && restAfterBrand.length > displayModel.length && !looksLikeEquipmentOrDescription(restAfterBrand)) {
        displayModel = restAfterBrand;
      }
    } else if (fullTitleFromApi && displayBrand && !modelVariantFromApi) {
      const brandEscaped = displayBrand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const restAfterBrand = fullTitleFromApi.replace(new RegExp(`^${brandEscaped}\\s+`, "i"), "").trim();
      if (restAfterBrand && restAfterBrand.length > displayModel.length && !looksLikeEquipmentOrDescription(restAfterBrand)) {
        displayModel = restAfterBrand;
      }
    }
  }

  // Fallback Modellzusatz: Aus Title extrahieren, wenn VersionAdditional fehlt (Rest nach Brand + Modell)
  if (!modelVariantFromApi && displayBrand && displayModel && displayModel !== "Unbekannt") {
    const fullTitle = getFullTitleFromRaw(raw);
    const prefix = `${displayBrand} ${displayModel}`.trim();
    if (fullTitle && fullTitle.length > prefix.length && fullTitle.toLowerCase().startsWith(prefix.toLowerCase())) {
      const rest = fullTitle.slice(prefix.length).trim();
      if (rest && rest.length >= 2 && !looksLikeEquipmentOrDescription(rest)) {
        modelVariantFromApi = rest;
      }
    }
  }

  // Titel = Marke + Modell. Modellzusatz separat (wird darunter angezeigt).
  const displayTitle =
    displayBrand && displayModel && displayModel !== "Unbekannt"
      ? `${displayBrand} ${displayModel}`.trim()
      : getFullTitleFromRaw(raw) || title?.trim() || "";
  const productionSeriesOut = productionSeriesRaw?.trim() || undefined;

  return {
    id: id || "unknown",
    image: imageUrl || carzillaImageUrl(id || "0", branchId, 1, "l"),
    brand: displayBrand,
    model: displayModel,
    title: displayTitle || undefined,
    productionSeries: productionSeriesOut,
    modelVariant: modelVariantFromApi || undefined,
    price,
    year: year || new Date().getFullYear() - 1,
    mileage,
    fuel,
    transmission,
    isNew: year >= new Date().getFullYear() - 1,
    description: description || undefined,
    power: power || undefined,
    powerKw: powerKw || undefined,
    exteriorColor: exteriorColor || undefined,
    exteriorColorFull: exteriorColorFull || undefined,
    interiorColor: interiorColor || undefined,
    equipment: equipment.length > 0 ? equipment : undefined,
    exposeUrl: exposeUrl || undefined,
    offerUrl: offerUrl || undefined,
    internalNumber: internalNumber || undefined,
    arrivalDate: arrivalDate || undefined,
    standtage: standtageNum,
    category,
    vehicleType: vehicleType || undefined,
    previousOwners: Number.isFinite(previousOwners) && previousOwners > 0 ? (previousOwners as number) : undefined,
    vatDisplayable: typeof vatDisplayable === "boolean" ? vatDisplayable : undefined,
    cubicCapacity: cubicCapacity > 0 ? cubicCapacity : undefined,
    cylinders: cylinders > 0 ? cylinders : undefined,
    imageCount: imageCountFromApi > 0 ? imageCountFromApi : undefined,
  };
}

/**
 * Prüft, ob ein Fahrzeug „online“ ist (auf Börsen sichtbar).
 * Nur online-Fahrzeuge sollen angezeigt werden; offline/Entwurf/Noch nicht freigegeben ausschließen.
 */
function isVehicleOnline(raw: Record<string, unknown>): boolean {
  const lower = (s: string) => s.toLowerCase();

  if (raw.IsOnline === false || raw.isOnline === false) return false;
  if (raw.IsWebVehicle === false || raw.isWebVehicle === false) return false;
  if (raw.IsPublished === false || raw.isPublished === false) return false;
  if (raw.VisibleOnExchanges === false || raw.visibleOnExchanges === false) return false;

  const status = raw.Status ?? raw.status;
  if (status != null && typeof status === "object" && !Array.isArray(status)) {
    const o = status as Record<string, unknown>;
    const name = String(o.Name ?? o.name ?? o.Text ?? o.text ?? "").trim().toLowerCase();
    if (name) {
      if (
        name.includes("offline") ||
        name.includes("nicht online") ||
        name.includes("inaktiv") ||
        name.includes("entwurf") ||
        name.includes("draft") ||
        name.includes("noch nicht") ||
        name.includes("wartend") ||
        name.includes("pending")
      )
        return false;
    }
  }

  const statusName = String(raw.StatusName ?? raw.statusName ?? raw.PublicationStatus ?? raw.publicationStatus ?? "").trim().toLowerCase();
  if (statusName) {
    if (
      statusName.includes("offline") ||
      statusName.includes("nicht online") ||
      statusName.includes("inaktiv") ||
      statusName.includes("entwurf") ||
      statusName.includes("draft") ||
      statusName.includes("wartend") ||
      statusName.includes("pending")
    )
      return false;
  }

  const statusId = raw.StatusId ?? raw.statusId;
  if (typeof statusId === "number" && statusId === 0) return false;

  return true;
}

/**
 * Carzilla V6 Dokumentation (cargate/Carzilla V6.pdf):
 * - Es gibt keine Methode „GetExposé PDF“ oder Exposé-URL. Nur Fahrzeugdaten (GetVehicleList, GetVehicle),
 *   HTML-Templates (TemplateInfo mit ExposeLogoUrl = Logo-URL) und Image-Service.
 * - GetVehicle(vehicleId, searchId, searchParams) liefert ein einzelnes Fahrzeug zur Detailansicht.
 * - Das Vehicle-Objekt kann Oid/GUID enthalten; die Exposé-PDF-URL wird vom Händler bereitgestellt
 *   (z. B. Expose.pdf?oid={Oid}&ourl=…). Wir bauen diese URL aus der GetVehicle-Antwort (Oid).
 */

/**
 * Extrahiert die "Freie Gestaltung" (Custom Description) aus einem rohen CarGate-Vehicle-Objekt.
 * Wird für GetVehicle-Detailantwort genutzt – GetVehicleList enthält oft keine Freie Gestaltung.
 */
export function extractDescriptionFromRaw(raw: Record<string, unknown>): string {
  const desc =
    getStr(raw, "FreieGestaltung", "freieGestaltung", "Freie_Gestaltung", "FreieGestaltungText", "freieGestaltungText", "CustomDescription", "customDescription", "CustomText", "customText", "FreeDesign", "freeDesign", "Description", "description", "comment", "Beschreibung") ||
    getStrFromMatchingKeys(raw, "freie", "gestaltung") ||
    getStrFromNestedMatchingKeys(raw, ["freie", "gestaltung"]) ||
    getStrFromCustomFields(raw, "Freie Gestaltung", "freie gestaltung", "FreieGestaltung", "FreieGestaltungText", "Custom Description", "custom description");
  return desc ? desc.trim() : "";
}

/**
 * Ruft Carzilla GetVehicle für ein einzelnes Fahrzeug auf (laut Doku: vehicleId, searchId, searchParams).
 * Gibt das rohe Vehicle-Objekt aus der API-Antwort zurück oder null bei Fehler.
 */
export async function getVehicleFromCarzillaApi(vehicleId: string): Promise<Record<string, unknown> | null> {
  const searchId = process.env.CARGATE_API_KEY?.trim();
  const baseUrl = process.env.CARGATE_API_BASE_URL?.trim();
  if (!searchId || !baseUrl) return null;

  const url = baseUrl.endsWith("/") ? `${baseUrl}GetVehicle` : `${baseUrl}/GetVehicle`;
  const searchParams: Record<string, unknown> = { IsWebVehicle: true, IsCarzillaVehicle: true };
  const body = { searchId, vehicleId, searchParams };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || typeof data !== "object") return null;

    const d = data as Record<string, unknown>;
    if (d.Vehicle && typeof d.Vehicle === "object") return d.Vehicle as Record<string, unknown>;
    const gvr = d.GetVehicleResult;
    if (gvr && typeof gvr === "object") {
      const o = gvr as Record<string, unknown>;
      if (o.Vehicle && typeof o.Vehicle === "object") return o.Vehicle as Record<string, unknown>;
      return o;
    }
    if (d.vehicle && typeof d.vehicle === "object") return d.vehicle as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

/** Liest String aus Objekt (inkl. verschachtelt .Name / .Value). */
function getStrFromRaw(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = raw[k];
    if (v == null) continue;
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const s = String(o.Name ?? o.name ?? o.Value ?? o.value ?? o.Text ?? o.text ?? "").trim();
      if (s) return s;
    }
  }
  return "";
}

/**
 * Formatiert 32-stelligen Hex-String als UUID (mit Bindestrichen).
 * Erwartetes Format der funktionierenden Seite: oid=91f374f1-c405-4bb4-9b58-dace6dc0a446
 */
function formatOidAsUuid(oid: string): string {
  const hex = (oid || "").replace(/-/g, "").trim();
  if (hex.length !== 32 || !/^[0-9a-fA-F]+$/.test(hex)) return oid;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Extrahiert Oid (UUID) aus OfferUrl-Pfad, falls vorhanden (z. B. …/91f374f1c4054bb49b58dace6dc0a446/1302).
 */
function extractOidFromOfferUrl(offerUrl: string): string | null {
  if (!offerUrl || !offerUrl.includes("/")) return null;
  const withDashes = offerUrl.match(/\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:\/|$)/);
  if (withDashes) return withDashes[1];
  const noDashes = offerUrl.match(/\/([0-9a-fA-F]{32})\/(?:\d+|$)/);
  if (noDashes) return formatOidAsUuid(noDashes[1]);
  return null;
}

function normalizeDealerUrlForExpose(url?: string | null, base?: string): string | null {
  if (!url) return null;
  let normalized = url.trim();
  if (!normalized) return null;

  normalized = normalized
    .replace(/^httpss:\/\//i, "https://")
    .replace(/^http:\/\/https:\/\//i, "https://")
    .replace(/^https:\/\/https:\/\//i, "https://");

  if (normalized.startsWith("//")) normalized = `https:${normalized}`;

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  const baseUrl = (base || process.env.CARGATE_EXPOSE_BASE_URL || "https://fahrzeuge.gs-automobile-rheinland.de").replace(/\/+$/, "");
  if (normalized.startsWith("/")) {
    return `${baseUrl}${normalized}`;
  }

  return `${baseUrl}/${normalized.replace(/^\/+/, "")}`;
}

/**
 * Prüft, ob der String eine gültige UUID (32 Hex-Zeichen, mit oder ohne Bindestriche) ist.
 */
function isUuidLike(s: string): boolean {
  const hex = (s || "").replace(/-/g, "").trim();
  return hex.length === 32 && /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * Baut die Exposé-PDF-URL für die Händlerseite.
 *
 * Hinweis: Die Carzilla V6-Dokumentation beschreibt KEINEN Exposé-PDF-Download.
 * Sie nennt nur den Image-Service (vid, bid) und TemplateInfo.Links (DetailsPage mit vid={Vehicle.VehicleId}).
 * Das Exposé-PDF wird vom Händlerserver bereitgestellt (z. B. /Expose.pdf).
 *
 * Wir verwenden vid (VehicleId), wenn die API keinen echten Oid/UUID liefert, da die Doku
 * nur VehicleId für Details und Bilder kennt. Wenn die API Oid oder eine OfferUrl mit UUID
 * zurückgibt, verwenden wir oid.
 */
export function buildExposeUrlFromCarzillaVehicle(raw: Record<string, unknown>, vehicleId: string): string | null {
  const base = (process.env.CARGATE_EXPOSE_BASE_URL || "https://fahrzeuge.gs-automobile-rheinland.de").replace(/\/+$/, "");
  let oid = getStrFromRaw(raw, "Oid", "oid", "OfferId", "OfferGuid", "VehicleGuid", "Uuid", "Guid");
  const offerUrl =
    normalizeDealerUrlForExpose(
      getStr(raw, "OfferUrl", "offerUrl", "url", "detailUrl", "link") || getStrFromRaw(raw, "OfferUrl", "offerUrl", "url", "detailUrl", "link"),
      base
    ) || "";
  if (!oid && offerUrl) oid = extractOidFromOfferUrl(offerUrl) || "";
  const hasRealOid = oid && isUuidLike(oid);
  const detailUrl = offerUrl && (offerUrl.startsWith("http") || offerUrl.startsWith("/")) ? offerUrl : `${base}/Fahrzeugsuche/Details?vid=${vehicleId}`;
  const ourl = encodeURIComponent(detailUrl);
  if (hasRealOid) {
    return `${base}/Expose.pdf?oid=${encodeURIComponent(formatOidAsUuid(oid!))}&ourl=${ourl}`;
  }
  return `${base}/Expose.pdf?vid=${encodeURIComponent(vehicleId)}&ourl=${ourl}`;
}

/**
 * Prüft, ob die CarGate API konfiguriert ist (API-Key + Basis-URL gesetzt).
 */
export function isCargateApiConfigured(): boolean {
  const key = process.env.CARGATE_API_KEY?.trim();
  const base = process.env.CARGATE_API_BASE_URL?.trim();
  return Boolean(key && base);
}

/**
 * Suchkatalog: ModelId/MakeId/EquipmentId/MotorTypeId → Name (laut PDF GetSearchCatalog).
 * MotorTypes (Motorarten-IDs) → Kraftstoff; EquipmentIds → Ausstattung.
 */
export interface SearchCatalogMaps {
  modelIdToName: Map<number, string>;
  makeIdToName: Map<number, string>;
  equipmentIdToName: Map<number, string>;
  motorTypeIdToName: Map<number, string>;
  cubicCapacityIdToValue?: Map<number, number>;
}

function parseCatalogIntoMaps(data: Record<string, unknown>): SearchCatalogMaps {
  const modelIdToName = new Map<number, string>();
  const makeIdToName = new Map<number, string>();
  const equipmentIdToName = new Map<number, string>();
  const motorTypeIdToName = new Map<number, string>();
  const cubicCapacityIdToValue = new Map<number, number>();

  const pushCubicCapacities = (arr: unknown[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (item == null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const idRaw = o.CubicCapacityId ?? o.cubicCapacityId ?? o.Id ?? o.id;
      const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);
      const valRaw = o.Value ?? o.value ?? o.CubicCapacity ?? o.cubicCapacity ?? o.Ccm ?? o.ccm;
      const val = typeof valRaw === "number" ? valRaw : parseInt(String(valRaw || "").replace(/\D/g, ""), 10);
      if (!Number.isNaN(id) && val >= 300 && val <= 10000) cubicCapacityIdToValue.set(id, val);
    }
  };

  const pushMotorTypes = (arr: unknown[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (item == null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const idRaw = o.MotorTypeId ?? o.motorTypeId ?? o.Id ?? o.id ?? o.FuelTypeId ?? o.fuelTypeId;
      const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);
      const name = String(o.Name ?? o.name ?? o.Text ?? o.text ?? o.Value ?? o.value ?? "").trim();
      if (!Number.isNaN(id) && name) motorTypeIdToName.set(id, name);
    }
  };

  const pushEquipment = (arr: unknown[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (item == null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const idRaw = o.EquipmentId ?? o.equipmentId ?? o.Id ?? o.id;
      const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);
      const name = String(o.Name ?? o.name ?? o.Text ?? o.text ?? o.Value ?? o.value ?? "").trim();
      if (!Number.isNaN(id) && name) equipmentIdToName.set(id, name);
    }
  };

  const pushModels = (arr: unknown[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (item == null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const idRaw = o.ModelId ?? o.modelId ?? o.Id ?? o.id;
      const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);
      const name = String(o.Name ?? o.name ?? o.ModelName ?? o.modelName ?? "").trim();
      if (!Number.isNaN(id) && name) modelIdToName.set(id, name);
    }
  };
  const pushMakes = (arr: unknown[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (item == null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const idRaw = o.MakeId ?? o.makeId ?? o.Id ?? o.id;
      const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);
      const name = String(o.Name ?? o.name ?? o.MakeName ?? o.makeName ?? "").trim();
      if (!Number.isNaN(id) && name) makeIdToName.set(id, name);
    }
  };

  const catalog = (data.SearchCatalog ?? data.GetSearchCatalogResult ?? data.searchCatalog ?? data) as Record<string, unknown> | undefined;
  if (catalog && typeof catalog === "object") {
    const viewModel = catalog.ViewModel as Record<string, unknown> | undefined;
    const modelsArr = catalog.Models ?? catalog.models ?? viewModel?.Models ?? [];
    const makesArr = catalog.Makes ?? catalog.makes ?? viewModel?.Makes ?? [];
    const equipmentArr = catalog.Equipment ?? catalog.equipment ?? catalog.EquipmentItems ?? catalog.equipmentItems ?? viewModel?.Equipment ?? viewModel?.EquipmentItems ?? [];
    const motorTypesArr = catalog.MotorTypes ?? catalog.motorTypes ?? catalog.MotorType ?? catalog.motorType ?? viewModel?.MotorTypes ?? viewModel?.MotorType ?? [];
    const cubicCapacitiesArr = catalog.CubicCapacities ?? catalog.cubicCapacities ?? viewModel?.CubicCapacities ?? viewModel?.cubicCapacities ?? [];
    pushModels(Array.isArray(modelsArr) ? modelsArr : []);
    pushMakes(Array.isArray(makesArr) ? makesArr : []);
    pushEquipment(Array.isArray(equipmentArr) ? equipmentArr : []);
    pushMotorTypes(Array.isArray(motorTypesArr) ? motorTypesArr : []);
    pushCubicCapacities(Array.isArray(cubicCapacitiesArr) ? cubicCapacitiesArr : []);
  }
  pushModels(Array.isArray(data.Models) ? data.Models : Array.isArray(data.models) ? data.models : []);
  pushMakes(Array.isArray(data.Makes) ? data.Makes : Array.isArray(data.makes) ? data.makes : []);
  pushEquipment(Array.isArray(data.Equipment) ? data.Equipment : Array.isArray(data.equipment) ? data.equipment : []);
  pushMotorTypes(Array.isArray(data.MotorTypes) ? data.MotorTypes : Array.isArray(data.motorTypes) ? data.motorTypes : []);
  pushCubicCapacities(Array.isArray(data.CubicCapacities) ? data.CubicCapacities : Array.isArray(data.cubicCapacities) ? data.cubicCapacities : []);

  return { modelIdToName, makeIdToName, equipmentIdToName, motorTypeIdToName, cubicCapacityIdToValue };
}

async function getSearchCatalogFromApi(): Promise<SearchCatalogMaps> {
  const cached = cache.get<SearchCatalogMaps>(CACHE_KEY_CATALOG);
  if (cached) return cached;

  const searchId = process.env.CARGATE_API_KEY?.trim();
  const baseUrl = process.env.CARGATE_API_BASE_URL?.trim();
  if (!searchId || !baseUrl) {
    return { modelIdToName: new Map(), makeIdToName: new Map(), equipmentIdToName: new Map(), motorTypeIdToName: new Map(), cubicCapacityIdToValue: new Map() };
  }

  const searchParams = { IsWebVehicle: true, IsCarzillaVehicle: true };
  const body = { searchId, searchParams };

  const tryFetch = async (method: string): Promise<Record<string, unknown> | null> => {
    const url = baseUrl.endsWith("/") ? `${baseUrl}${method}` : `${baseUrl}/${method}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(method === "GetInitialData" ? { searchId, searchParams } : body),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  // 1) GetSearchCatalog (laut Doku für Dropdown-Werte / Katalog)
  let data = await tryFetch("GetSearchCatalog");
  let maps = data ? parseCatalogIntoMaps(data) : { modelIdToName: new Map(), makeIdToName: new Map(), equipmentIdToName: new Map(), motorTypeIdToName: new Map(), cubicCapacityIdToValue: new Map() };

  // 2) Falls leer: GetInitialData (laut Doku: liefert SearchParams, SearchInfo, SearchCatalog)
  if (maps.modelIdToName.size === 0 && maps.makeIdToName.size === 0 && maps.equipmentIdToName.size === 0 && maps.motorTypeIdToName.size === 0) {
    data = await tryFetch("GetInitialData");
    if (data) {
      const searchCatalog = data.SearchCatalog ?? data.searchCatalog;
      if (searchCatalog && typeof searchCatalog === "object") {
        maps = parseCatalogIntoMaps({ SearchCatalog: searchCatalog, ...(searchCatalog as Record<string, unknown>) });
      }
    }
  }

  cache.set(CACHE_KEY_CATALOG, maps, 10 * 60); // 10 Min wie in der Doku
  if (maps.modelIdToName.size > 0 || maps.makeIdToName.size > 0 || maps.equipmentIdToName.size > 0) {
    console.log(`✅ Carzilla Katalog: ${maps.makeIdToName.size} Marken, ${maps.modelIdToName.size} Modelle, ${maps.equipmentIdToName.size} Ausstattungen`);
  }
  if (maps.equipmentIdToName.size === 0 && data) {
    const catalog = (data as Record<string, unknown>).SearchCatalog ?? (data as Record<string, unknown>).GetSearchCatalogResult ?? data;
    const cat = catalog as Record<string, unknown>;
    const catalogKeys = cat && typeof cat === "object" ? Object.keys(cat).join(", ") : "n/a";
    console.warn("Carzilla: Katalog-Keys (Equipment fehlt?):", catalogKeys);
  }
  return maps;
}

/**
 * Liefert alle Fahrzeuge von CarGate (Cache oder API-Abruf).
 * Für direkte Auslieferung ohne Datenbank.
 */
export async function getVehiclesFromCargateCached(): Promise<Vehicle[]> {
  return fetchVehiclesFromCargateApi();
}

/**
 * Holt alle Fahrzeuge über Carzilla WebService 6 GetVehicleList (PDF: Methoden, SearchId, Pagination max 100).
 * Modell/Marke werden per GetSearchCatalog aus ModelId/MakeId aufgelöst, falls vorhanden.
 */
export async function fetchVehiclesFromCargateApi(): Promise<Vehicle[]> {
  const searchId = process.env.CARGATE_API_KEY?.trim();
  const baseUrl = process.env.CARGATE_API_BASE_URL?.trim();

  if (!searchId || !baseUrl) {
    throw new Error(
      "Carzilla API nicht konfiguriert: CARGATE_API_KEY (SearchId) und CARGATE_API_BASE_URL setzen (cargate/Carzilla V6.pdf)."
    );
  }

  const cacheKey = CACHE_KEY;
  const cached = cache.get<Vehicle[]>(cacheKey);
  if (cached && cached.length > 0) {
    console.log(`✅ Carzilla API: ${cached.length} Fahrzeuge aus Cache`);
    return cached;
  }

  const catalog = await getSearchCatalogFromApi();

  const url = baseUrl.endsWith("/") ? `${baseUrl}GetVehicleList` : `${baseUrl}/GetVehicleList`;
  console.log(`🔄 Carzilla GetVehicleList: ${url} (SearchId) ...`);

  const allItems: unknown[] = [];
  const vehiclePerPage = 100;
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      // PDF: IsWebVehicle true = nur Fahrzeuge die im Web angezeigt werden dürfen; Statuses = nur Online-Zustände (optional)
      const searchParams: Record<string, unknown> = { IsWebVehicle: true, IsCarzillaVehicle: true };
      const onlineStatusIds = process.env.CARGATE_ONLINE_STATUS_IDS?.trim();
      if (onlineStatusIds) {
        const ids = onlineStatusIds.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
        if (ids.length > 0) searchParams.Statuses = ids;
      }
      const body = {
        searchId,
        page,
        vehiclePerPage,
        searchParams,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.error("❌ Carzilla API Fehler:", response.status, text.slice(0, 500));
        const hint =
          response.status === 404
            ? " Die angeforderte URL wurde nicht gefunden. Bitte CARGATE_API_BASE_URL in .env prüfen (z. B. http://api.carzilla.de/6/api/search)."
            : response.status === 401 || response.status === 403
              ? " Zugriff verweigert. Bitte CARGATE_API_KEY (SearchId) prüfen."
              : response.status >= 500
                ? " Serverfehler auf Carzilla-Seite. Bitte später erneut versuchen."
                : "";
        throw new Error(
          `Carzilla API: ${response.status} ${response.statusText}.${hint}${text.slice(0, 200) ? ` Antwort: ${text.slice(0, 200)}` : ""}`
        );
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Carzilla API: Ungültige Antwort (kein JSON). Bitte CARGATE_API_BASE_URL prüfen – der Endpunkt muss JSON zurückgeben."
        );
      }

      let items: unknown[] = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (Array.isArray(d.Vehicles)) items = d.Vehicles;
        else if (Array.isArray(d.vehicles)) items = d.vehicles;
        else if (Array.isArray(d.GetVehicleListResult)) items = d.GetVehicleListResult;
        else if (d.GetVehicleListResult && typeof d.GetVehicleListResult === "object" && Array.isArray((d.GetVehicleListResult as Record<string, unknown>).Vehicles)) {
          items = (d.GetVehicleListResult as { Vehicles: unknown[] }).Vehicles;
        } else if (Array.isArray(d.data)) items = d.data;
      }

      allItems.push(...items);
      hasMore = items.length >= vehiclePerPage;
      page += 1;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Carzilla API: Timeout – der Server hat nicht rechtzeitig geantwortet. Bitte CARGATE_API_BASE_URL und Netzwerk prüfen.");
    }
    if (err instanceof TypeError && (err.message === "fetch failed" || err.message.includes("network"))) {
      throw new Error("Carzilla API: Verbindung fehlgeschlagen. Server nicht erreichbar oder Netzwerkfehler. Bitte CARGATE_API_BASE_URL prüfen.");
    }
    throw err;
  }

  if (page === 1 && allItems.length === 0) {
    throw new Error(
      "Carzilla API: Keine Fahrzeuge erhalten. Bitte SearchId (CARGATE_API_KEY) und CARGATE_API_BASE_URL prüfen (Dokumentation: cargate/Carzilla V6.pdf)."
    );
  }

  const validItems = allItems.filter((item): item is Record<string, unknown> => item != null && typeof item === "object");
  const onlineItems = validItems.filter((raw) => isVehicleOnline(raw));
  const excluded = validItems.length - onlineItems.length;
  if (excluded > 0) {
    console.log(`📋 Carzilla: ${excluded} Fahrzeug(e) mit Offline-Status ausgefiltert, ${onlineItems.length} online sichtbar`);
  }

  let vehicles: Vehicle[] = onlineItems
    .map((item) => mapCargateItemToVehicle(item, catalog))
    .filter((v) => v.id && v.id !== "unknown");

  // Kopien ausschließen (Kennnr. enthält "Kopie", z. B. "146Kopie" bei Duplikat von "146")
  const beforeKopieFilter = vehicles.length;
  vehicles = vehicles.filter((v) => !v.internalNumber?.toLowerCase().includes("kopie"));
  const kopieExcluded = beforeKopieFilter - vehicles.length;
  if (kopieExcluded > 0) {
    console.log(`📋 Carzilla: ${kopieExcluded} Kopie(n) ausgefiltert (Kennnr. enthält "Kopie"), ${vehicles.length} Fahrzeuge sichtbar`);
  }

  if (vehicles.length > 0) {
    // Platzhalter-Filter: Wenn Bild 2 nicht existiert = nur "Bald verfügbar" Platzhalter → image leeren
    const hasCarGateImage = (v: Vehicle) =>
      v.image && v.image.trim() !== "" &&
      (v.image.includes("cargate360") || v.image.includes("carzilla-services.com"));
    const BATCH = 10;
    for (let i = 0; i < vehicles.length; i += BATCH) {
      const batch = vehicles.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (v) => {
          if (!hasCarGateImage(v)) return;
          try {
            const onlyPlaceholder = await hasOnlyPlaceholderImage(v.id, v.image);
            if (onlyPlaceholder) {
              v.image = "";
            }
          } catch {
            v.image = "";
          }
        })
      );
      if (i + BATCH < vehicles.length) await new Promise((r) => setTimeout(r, 30));
    }
    cache.set(cacheKey, vehicles);
    console.log(`✅ Carzilla API: ${vehicles.length} Fahrzeuge geladen`);
  }

  return vehicles;
}
