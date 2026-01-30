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

const cache = new NodeCache({
  stdTTL: 24 * 60 * 60,
  checkperiod: 60,
  useClones: false,
});

const CACHE_KEY = "cargate_vehicles";

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
      const name = o.Name ?? o.MakeName ?? o.ModelName ?? o.name ?? o.Text ?? o.DisplayName ?? o.Value;
      if (name != null && typeof name === "string") return name.trim();
      if (name != null && typeof name === "number") return String(name);
    }
  }
  return "";
}

/** Sucht einen String in beliebigen Keys, die eines der Keywords enthalten (z. B. "make", "model"). Ignoriert reine IDs. */
function getStrFromMatchingKeys(obj: Record<string, unknown>, ...keywords: string[]): string {
  return getStrFromMatchingKeysExcluding(obj, keywords, []);
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
      const name = o.Name ?? o.MakeName ?? o.ModelName ?? o.name ?? o.Text ?? o.DisplayName;
      if (name != null && typeof name === "string") return name.trim();
      if (name != null && typeof name === "number") return String(name);
    }
  }
  return "";
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
      const val = o.Value ?? o.value ?? o.Amount ?? o.amount ?? o.Ps ?? o.ps ?? o.Kw ?? o.kw;
      if (typeof val === "number" && !Number.isNaN(val)) return val;
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

  // 1) Verschachteltes Power-Objekt (Power: { Ps, Kw } oder { Value })
  const powerObj = raw.Power ?? raw.power;
  if (powerObj != null && typeof powerObj === "object" && !Array.isArray(powerObj)) {
    const o = powerObj as Record<string, unknown>;
    const ps = getNumFromValue(o.Ps ?? o.ps) || getNumFromValue(o.Value ?? o.value);
    const kw = getNumFromValue(o.Kw ?? o.kw);
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

function mapCargateItemToVehicle(raw: Record<string, unknown>): Vehicle {
  const id =
    getStr(raw, "id", "vehicleId", "vehicle_id", "VehicleId") ||
    String(getNum(raw, "id", "vehicleId", "vehicle_id", "VehicleId"));

  // Marke: zuerst bekannte Keys, dann Suche nach Keys die "make"/"brand"/"marke" enthalten (keine *Id-Keys als Text)
  let brand = getStr(raw, "Make", "make", "brand", "manufacturer", "Marke", "MakeName");
  if (!brand) brand = getStrFromMatchingKeys(raw, "make", "brand", "marke", "manufacturer", "hersteller");
  if (brand && /^\d+$/.test(brand)) brand = ""; // reine Zahl = ID, nicht Name

  // Modell: zuerst bekannte Keys, dann Suche nach Keys die "model"/"modell" enthalten
  let model = getStr(raw, "Model", "model", "modelName", "model_name", "Modell", "ModelName");
  if (!model) model = getStrFromMatchingKeys(raw, "model", "modell");
  if (model && /^\d+$/.test(model)) model = ""; // reine Zahl = ID

  // Kombinierter Titel (z. B. "BMW 320d") als Fallback für Anzeige
  const title = getStr(raw, "Title", "title", "Name", "name", "vehicleTitle", "vehicle_title", "Bezeichnung", "Description", "FullName", "DisplayName") || (brand && model ? `${brand} ${model}`.trim() : "");

  const price = getNum(raw, "SalePrice", "salePrice", "Price", "price", "sellingPrice", "selling_price", "Preis");
  const year = getNum(raw, "FirstRegistration", "firstRegistration", "year", "Year", "initialRegistration", "ez", "EZ", "constructionYear", "Baujahr") || new Date().getFullYear() - 1;
  const mileage = getNum(raw, "Km", "km", "mileage", "Mileage", "kilometer", "odometer", "Kilometerstand");
  let fuel =
    getStr(raw, "FuelType", "fuelType", "Fuel", "fuel", "fuelTypeName", "Kraftstoff") ||
    getStrFromMatchingKeys(raw, "fuel", "kraftstoff", "fueltype");
  let transmission =
    getStr(raw, "Transmission", "transmission", "gearbox", "Getriebe", "TransmissionType") ||
    getStrFromMatchingKeys(raw, "transmission", "getriebe", "gearbox");
  const powerFromObj = getPowerFromRaw(raw);
  let power = powerFromObj.power ?? (getNum(raw, "Power", "power", "PowerPs", "powerPs", "ps", "Leistung") || undefined);
  let powerKw = powerFromObj.powerKw ?? (getNum(raw, "PowerKw", "powerKw", "power_kw", "kW", "LeistungKw") || undefined);
  if (power && !powerKw) powerKw = Math.round(power / 1.36);
  if (powerKw && !power) power = Math.round(powerKw * 1.36);

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
  const offerUrl = getStr(raw, "OfferUrl", "offerUrl", "url", "detailUrl", "link");
  const description = getStr(raw, "Description", "description", "comment", "Beschreibung");
  // Außenfarbe: explizite Keys zuerst, dann beliebiger Key mit color/farbe – aber nicht Innenfarbe
  let exteriorColor =
    getStr(raw, "Color", "ExteriorColor", "exteriorColor", "color", "colour", "Außenfarbe", "PaintColor", "VehicleColor") ||
    getStrFromMatchingKeysExcluding(raw, ["exterior", "color", "farbe", "außen", "paint", "vehicle"], ["interior", "innen", "inner"]);
  // Innenfarbe (Carzilla API: ColorInterieur)
  let interiorColor =
    getStr(raw, "ColorInterieur", "InteriorColor", "interiorColor", "Innenfarbe", "InteriorColour") ||
    getStrFromMatchingKeys(raw, "interior", "innen", "inner");
  const internalNumber = getStr(raw, "OfferNumber", "offerNumber", "internalNumber", "stockNumber", "Angebotsnummer", "articleNumber", "StockNumber");
  const vehicleType =
    getStr(raw, "BodyType", "bodyType", "vehicleType", "Karosserie", "BodyTypeName") ||
    getStrFromMatchingKeys(raw, "body", "karosserie", "vehicletype");
  const exposeUrl = getStr(raw, "ExposeUrl", "exposeUrl", "exposePdf", "ExposePdfUrl");
  const previousOwners = typeof raw.PreviousOwners === "number" ? raw.PreviousOwners : typeof raw.previousOwners === "number" ? raw.previousOwners : getNum(raw, "PreviousOwners", "previousOwners", "numberOfPreviousOwners");
  const vatDisplayable = raw.HasVat ?? raw.vatDisplayable ?? raw.vat_displayable;

  // Einmalig Struktur loggen, wenn wichtige Felder fehlen (Marke/Modell/Farbe) – für Anpassung an echte API
  if (!_carzillaStructureLogged && (!brand || !model || !exteriorColor)) {
    _carzillaStructureLogged = true;
    const keys = Object.keys(raw).sort();
    const relevant = keys.filter((k) =>
      /make|model|brand|marke|title|name|price|sale|color|farbe|fuel|getriebe|transmission/i.test(k)
    );
    const sample: Record<string, unknown> = {};
    for (const k of relevant.slice(0, 30)) {
      const v = raw[k];
      sample[k] = v != null && typeof v === "object" && !Array.isArray(v) ? "[object]" : v;
    }
    console.warn("Carzilla: Erste Fahrzeug-Keys (Marke/Modell/Farbe):", JSON.stringify(sample, null, 0).slice(0, 800));
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

  if (!fuel) fuel = "Unbekannt";
  if (!transmission) transmission = "Unbekannt";

  // Fallback: Aus kombiniertem Titel "Marke Modell" ableiten, wenn Marke/Modell fehlen
  let displayBrand = brand || "Unbekannt";
  let displayModel = model || "Unbekannt";
  if (title && title.trim()) {
    const combined = title.trim();
    if (displayBrand === "Unbekannt" || displayModel === "Unbekannt") {
      const parts = combined.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        if (displayBrand === "Unbekannt") displayBrand = parts[0];
        if (displayModel === "Unbekannt") displayModel = parts.slice(1).join(" ");
      } else if (parts.length === 1 && displayBrand === "Unbekannt") {
        displayBrand = parts[0];
      } else if (displayModel === "Unbekannt") {
        displayModel = combined;
      }
    }
  }
  const category = determineCategory(displayBrand, displayModel, power, fuel);

  // Ausstattung: Array von Strings, Array von Objekten mit Name/Text, oder kommaseparierter String
  let equipment: string[] | undefined;
  const eq = raw.equipment ?? raw.Equipment ?? raw.EquipmentList ?? raw.Features;
  if (Array.isArray(eq)) {
    equipment = eq
      .map((x) => (x != null && typeof x === "object" && "Name" in (x as object) ? String((x as { Name: unknown }).Name) : String(x)))
      .filter((s) => s && s !== "undefined");
  } else if (typeof eq === "string") {
    equipment = eq.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return {
    id: id || "unknown",
    image: imageUrl || carzillaImageUrl(id || "0", branchId, 1, "l"),
    brand: displayBrand,
    model: displayModel,
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
    interiorColor: interiorColor || undefined,
    equipment,
    exposeUrl: exposeUrl || undefined,
    offerUrl: offerUrl || undefined,
    internalNumber: internalNumber || undefined,
    arrivalDate: arrivalDate || undefined,
    standtage: standtageNum,
    category,
    vehicleType: vehicleType || undefined,
    previousOwners: Number.isFinite(previousOwners) && previousOwners > 0 ? (previousOwners as number) : undefined,
    vatDisplayable: typeof vatDisplayable === "boolean" ? vatDisplayable : undefined,
  };
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
 * Liefert alle Fahrzeuge von CarGate (Cache oder API-Abruf).
 * Für direkte Auslieferung ohne Datenbank.
 */
export async function getVehiclesFromCargateCached(): Promise<Vehicle[]> {
  return fetchVehiclesFromCargateApi();
}

/**
 * Holt alle Fahrzeuge über Carzilla WebService 6 GetVehicleList (PDF: Methoden, SearchId, Pagination max 100).
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

      // PDF: IsWebVehicle true = nur Fahrzeuge die im Web angezeigt werden dürfen; IsCarzillaVehicle true empfohlen
      const body = {
        searchId,
        page,
        vehiclePerPage,
        searchParams: { IsWebVehicle: true, IsCarzillaVehicle: true },
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
        throw new Error(`Carzilla API: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as unknown;
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
    if (err instanceof Error && err.name === "AbortError") throw new Error("Carzilla API: Timeout");
    throw err;
  }

  const vehicles: Vehicle[] = allItems
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => mapCargateItemToVehicle(item))
    .filter((v) => v.id && v.id !== "unknown");

  if (vehicles.length > 0) {
    cache.set(cacheKey, vehicles);
    console.log(`✅ Carzilla API: ${vehicles.length} Fahrzeuge geladen`);
  }

  return vehicles;
}
