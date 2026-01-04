import * as cheerio from "cheerio";
import NodeCache from "node-cache";
import type { Vehicle } from "../types/vehicle.js";

// Cache configuration: 45 minutes TTL
const cache = new NodeCache({ stdTTL: 45 * 60, checkperiod: 60 });

// Use high rp (rows per page) value to get all vehicles at once
// rp=200 should be enough for most cases (current total is ~88 vehicles)
const VEHICLE_LIST_URL = "https://fahrzeuge.gs-automobile-rheinland.de/Fahrzeugsuche/Fahrzeugliste?st=2&rp=200";

/**
 * Helper function to build cargate360 image URL
 * vid = vehicle ID, bid = business ID (1790 for GS Automobile), ino = image number
 */
function cargateImage(vid: string, ino: number = 1, format: string = "xl"): string {
  return `https://img.cargate360.de/default.aspx?vid=${vid}&bid=1790&format=${format}&ino=${ino}&app=Kiste-Default`;
}

/**
 * Determines vehicle category based on brand, model, and characteristics
 * Improved algorithm to prevent vehicles from appearing in wrong categories
 */
function determineVehicleCategory(brand: string, model: string, power?: number, mileage: number = 0, price?: number, fuel?: string): string {
  const modelLower = model.toLowerCase();
  const brandLower = brand.toLowerCase();
  const fuelLower = fuel?.toLowerCase() || "";
  const titleLower = `${brand} ${model}`.toLowerCase();
  
  // Elektro / E-Fahrzeuge (höchste Priorität - check first)
  const electricKeywords = ['elektro', 'electric', 'e-', 'edrive', 'eq', 'id.', 'id ', 'ioniq', 'kona electric', 'e-tron', 'etron', 'tesla', 'model', 'i3', 'i4', 'i5', 'i7', 'ix', 'id3', 'id4', 'id5', 'id7', 'id buzz'];
  if (fuelLower.includes('elektro') || fuelLower.includes('electric') || 
      electricKeywords.some(keyword => modelLower.includes(keyword) || titleLower.includes(keyword)) ||
      brandLower === 'tesla') {
    return "Elektro";
  }
  
  // Kleinwagen / Kompakt (check VERY EARLY - before Sport, before everything else except Elektro)
  // Explicitly prioritize Mini and Fiat brands - they should NEVER be Sport
  if (brandLower === 'mini' || brandLower === 'fiat' || brandLower === 'smart') {
    return "Kleinwagen";
  }
  
  // Van / Transporter (check before SUV to avoid conflicts)
  const vanKeywords = ['multivan', 'transporter', 'crafter', 'sprinter', 'vivaro', 'trafic', 'master', 't6', 't7', 'vito', 'v-class', 'viano', 'transit', 'trafic', 'master', 'ducato', 'boxer', 'jumper'];
  if (vanKeywords.some(keyword => modelLower.includes(keyword) || titleLower.includes(keyword))) {
    return "Van";
  }
  
  // SUV (check before Sport to avoid conflicts - SUVs should not be Sport)
  const suvKeywords = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'q3', 'q5', 'q7', 'q8', 'gle', 'glc', 'gla', 'glb', 'tiguan', 'touareg', 'kuga', 'sportage', 'tucson', 'rav4', 'cr-v', 'suv', 'macan', 'cayenne', 'nx', 'rx', 'gx', 'lx'];
  if (suvKeywords.some(keyword => modelLower.includes(keyword) || titleLower.includes(keyword))) {
    return "SUV";
  }
  
  // Kombi (check before Sport/Familie to avoid conflicts)
  const kombiKeywords = ['avant', 'touring', 'kombi', 'estate', 'wagon', 'break', 'variant'];
  if (kombiKeywords.some(keyword => modelLower.includes(keyword) || titleLower.includes(keyword))) {
    return "Kombi";
  }
  
  // Sportwagen / Performance (must NOT be SUV, must be sedan/limousine)
  // Only if it's clearly a sport model AND not an SUV AND not Mini/Fiat/Smart
  const sportKeywords = ['m3', 'm4', 'm5', 'm6', 'amg', 'rs', 's3', 's4', 's5', 's6', 'gt', 'gti', 'r', 'turbo', 'coupe', 'coupé', 'm-sport', 'm sport'];
  // Exclude "sport" keyword if it's part of Mini model names (e.g., "Mini Cooper S" should not be Sport)
  const isSportKeyword = sportKeywords.some(keyword => modelLower.includes(keyword) || titleLower.includes(keyword));
  const isHighPower = power && power > 200;
  
  // Only mark as Sport if it's a sport model AND not an SUV AND not Mini/Fiat/Smart
  if ((isSportKeyword || isHighPower) && 
      !suvKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw)) &&
      brandLower !== 'mini' && brandLower !== 'fiat' && brandLower !== 'smart') {
    return "Sport";
  }
  
  // Luxus (check before Familienwagen)
  const luxuryBrands = ['mercedes-benz', 'bmw', 'audi', 'porsche', 'lexus', 'tesla'];
  const luxuryModels = ['s-klasse', 's-class', '7er', '7 series', 'a8', 'panamera'];
  if (luxuryBrands.includes(brandLower) && (price && price > 50000 || luxuryModels.some(m => modelLower.includes(m) || titleLower.includes(m)))) {
    // But not if it's an SUV (already handled above)
    if (!suvKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw))) {
      return "Luxus";
    }
  }
  
  // Kleinwagen / Kompakt (additional check for other compact models)
  
  const compactKeywords = ['polo', 'golf', 'a1', 'a3', '1er', '1 series', 'a-klasse', 'a-class', 'up!', 'up ', 'fabia', 'ibiza', 'fiesta', 'focus', 'corsa', 'astra', '500', 'panda', 'punto', 'aygo', 'iq', 'cooper', 'countryman', 'clubman', 'paceman', 'roadster', 'coupe'];
  if (compactKeywords.some(keyword => modelLower.includes(keyword) || titleLower.includes(keyword)) || 
      (power && power < 100 && !suvKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw)))) {
    return "Kleinwagen";
  }
  
  // Familienwagen (Mittelklasse, größere Fahrzeuge) - but not SUVs, not Vans, not Kombis
  const familyKeywords = ['passat', 'arteon', 'a4', 'a6', 'c-klasse', 'c-class', '3er', '3 series', '5er', '5 series', 'e-klasse', 'e-class'];
  if (familyKeywords.some(keyword => modelLower.includes(keyword) || titleLower.includes(keyword)) || 
      (power && power >= 100 && power <= 200 && 
       !suvKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw)) &&
       !vanKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw)) &&
       !kombiKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw)))) {
    return "Familienwagen";
  }
  
  // Default: Mittelklasse
  return "Mittelklasse";
}

/**
 * Parses a vehicle title to extract brand and model
 * Example: "BMW i4 eDrive40 GC M-SPORT-PRO" -> { brand: "BMW", model: "i4 eDrive40 GC M-SPORT-PRO" }
 */
function parseVehicleTitle(title: string): { brand: string; model: string } {
  // Common German car brands
  const brands = [
    "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche", "Opel",
    "Ford", "Seat", "Skoda", "Toyota", "Hyundai", "Kia", "Peugeot",
    "Renault", "Citroen", "Fiat", "Alfa Romeo", "Volvo", "Mazda",
    "Nissan", "Honda", "Suzuki", "Mini", "Smart", "Dacia", "Tesla"
  ];
  
  for (const brand of brands) {
    if (title.startsWith(brand)) {
      return {
        brand,
        model: title.substring(brand.length).trim(),
      };
    }
  }
  
  // Fallback: Take first word as brand
  const parts = title.split(" ");
  return {
    brand: parts[0] || "Unbekannt",
    model: parts.slice(1).join(" ") || title,
  };
}

/**
 * Extracts additional vehicle data from the offer URL or HTML content
 * For now, returns defaults - can be enhanced by fetching individual vehicle pages
 */
function extractVehicleDetails(
  vehicleId: string,
  title: string,
  price: number
): Partial<Vehicle> {
  const { brand, model } = parseVehicleTitle(title);
  
  // Try to extract year from title (e.g., "2023" or "EZ 2023")
  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear() - 1;
  
  return {
    brand,
    model,
    year,
    price,
    mileage: 0, // Will be extracted from detail page if needed
    fuel: "Unbekannt", // Will be extracted from detail page if needed
    transmission: "Unbekannt", // Will be extracted from detail page if needed
    isNew: year >= new Date().getFullYear() - 1,
  };
}

/**
 * Fetches detailed vehicle information from the detail page
 */
async function fetchVehicleDetails(offerUrl: string, vehicleId: string): Promise<Partial<Vehicle>> {
  try {
    const response = await fetch(offerUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch detail page for vehicle ${vehicleId}: ${response.status}`);
      return {};
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const details: Partial<Vehicle> = {};

    // Extract year (Erstzulassung / Baujahr)
    // Try to find "EZ" (Erstzulassung) in list items first - most reliable
    const ezItem = $('li:contains("EZ")').first();
    if (ezItem.length > 0) {
      const ezText = ezItem.text();
      const yearMatch = ezText.match(/(\d{4})/);
      if (yearMatch && yearMatch[1]) {
        const year = parseInt(yearMatch[1], 10);
        if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1) {
          details.year = year;
        }
      }
    } else {
      // Fallback: try structured data
      const structuredMatch = html.match(/itemprop="dateVehicleFirstRegistered"[^>]*content="([0-9]{4})/);
      if (structuredMatch && structuredMatch[1]) {
        const year = parseInt(structuredMatch[1], 10);
        if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1) {
          details.year = year;
        }
      } else {
        // Fallback: try to find in HTML table structure
        const yearText = $('th:contains("Erstzulassung"), th:contains("EZ")').parent().find('td').first().text();
        const yearMatchFallback = yearText.match(/(\d{4})/);
        if (yearMatchFallback && yearMatchFallback[1]) {
          const year = parseInt(yearMatchFallback[1], 10);
          if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1) {
            details.year = year;
          }
        }
      }
    }

    // Extract mileage (Kilometerstand)
    const mileageMatch = html.match(/"mileageFromOdometer":\s*"([^"]+)"/);
    if (mileageMatch) {
      const mileageStr = mileageMatch[1].replace(/\s/g, "").replace(/\./g, "");
      const mileageNum = parseInt(mileageStr, 10);
      if (!isNaN(mileageNum)) {
        details.mileage = mileageNum;
      }
    } else {
      // Fallback: try to find in list items
      const mileageText = $('li:contains("km")').first().text();
      const kmMatch = mileageText.match(/(\d{1,3}(?:\.\d{3})*)\s*km/);
      if (kmMatch) {
        details.mileage = parseInt(kmMatch[1].replace(/\./g, ""), 10);
      }
    }

    // Extract power (Leistung)
    const powerMatch = html.match(/"value":\s*"(\d+)\s*kW\s*\((\d+)\s*PS\)"/);
    if (powerMatch) {
      details.powerKw = parseInt(powerMatch[1], 10);
      details.power = parseInt(powerMatch[2], 10);
    } else {
      // Fallback: try to extract from text
      const powerText = $('li:contains("kW")').first().text();
      const powerMatchFallback = powerText.match(/(\d+)\s*kW\s*\((\d+)\s*PS\)/);
      if (powerMatchFallback) {
        details.powerKw = parseInt(powerMatchFallback[1], 10);
        details.power = parseInt(powerMatchFallback[2], 10);
      }
    }

    // Extract exterior color
    const colorMatch = html.match(/"color":\s*"([^"]+)"/);
    if (colorMatch) {
      details.exteriorColor = colorMatch[1];
    }

    // Extract interior color (Innenfarbe)
    const interiorColorRow = $('th:contains("Innenfarbe")').parent().find('td').first();
    if (interiorColorRow.length > 0) {
      details.interiorColor = interiorColorRow.text().trim();
    }

    // Extract fuel and transmission if not already extracted from URL
    // Try to extract from structured data or HTML
    if (!details.fuel) {
      // Could extract from URL or HTML structure if needed
    }
    
    // Extract equipment list from description meta tag
    const descMatch = html.match(/"description":\s*"([^"]+)"/);
    if (descMatch) {
      const description = descMatch[1];
      // Split by comma and clean up
      details.equipment = description
        .split(',')
        .map((eq: string) => eq.trim())
        .filter((eq: string) => eq.length > 0);
      details.description = description;
    }

    // Extract Exposé URL
    const exposeLink = $('a:contains("Exposé")').attr('href');
    if (exposeLink) {
      // Make it absolute if it's relative
      if (exposeLink.startsWith('/')) {
        details.exposeUrl = `https://fahrzeuge.gs-automobile-rheinland.de${exposeLink}`;
      } else {
        details.exposeUrl = exposeLink;
      }
    }

    // Extract internal number (Angebotsnummer / interne Nummer)
    // Try multiple patterns:
    // 1. Meta tag: product:retailer_item_id (most reliable)
    // 2. HTML: "Angebotsnummer <strong>597</strong>" 
    // 3. HTML: "interne Nummer 597"
    let internalNumber: string | undefined;
    
    // Try meta tag first
    const metaMatch = html.match(/product:retailer_item_id[^>]*content="([^"]+)"/i);
    if (metaMatch && metaMatch[1]) {
      internalNumber = metaMatch[1];
    } else {
      // Fallback to HTML patterns
      const htmlMatch = html.match(/Angebotsnummer[^<]*<strong>(\d+)<\/strong>/i) || 
                        html.match(/interne Nummer[^<]*(\d{3,})/i) ||
                        html.match(/Angebotsnummer[^<]*(\d{3,})/i);
      if (htmlMatch && htmlMatch[1]) {
        internalNumber = htmlMatch[1];
      }
    }
    
    if (internalNumber) {
      details.internalNumber = internalNumber;
    }

    // Extract arrival date (Eintreffdatum / Standtage) from cargate
    // Based on cargate UI: "Angelegt am: DD.MM.YYYY" and "Anzahl Standtage: XX"
    // Try multiple approaches: HTML patterns, structured data, and cheerio queries
    let arrivalDateFound = false;
    
    // Approach 1: Try to find "Angelegt am" (Created on) - this is the arrival date in cargate
    const angelegtPattern = /Angelegt am[^<]*(\d{1,2})\.(\d{1,2})\.(\d{4})/i;
    const angelegtMatch = html.match(angelegtPattern);
    if (angelegtMatch) {
      try {
        const [, day, month, year] = angelegtMatch;
        const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const now = new Date();
          const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const minDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          if (date <= maxDate && date >= minDate) {
            details.arrivalDate = date.toISOString().split('T')[0];
            console.log(`✅ Extracted arrivalDate (Angelegt am) for vehicle ${vehicleId}: ${details.arrivalDate}`);
            arrivalDateFound = true;
          }
        }
      } catch (e) {
        console.warn(`⚠️ Error parsing "Angelegt am" date for vehicle ${vehicleId}:`, e);
      }
    }
    
    // Approach 2: Try to find in HTML using cheerio (more reliable for structured HTML)
    if (!arrivalDateFound) {
      const arrivalDateSelectors = [
        'li:contains("Angelegt am")',
        'li:contains("eingetroffen")',
        'li:contains("seit")',
        'li:contains("Standtage")',
        'td:contains("Angelegt am")',
        'td:contains("eingetroffen")',
        'td:contains("Eintreffdatum")',
        '[data-arrival-date]',
        '[data-standtage]',
        '*:contains("Angelegt am")',
      ];
      
      for (const selector of arrivalDateSelectors) {
        try {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text();
            // Try to extract date from text
            const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            if (dateMatch) {
              const [, day, month, year] = dateMatch;
              const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const now = new Date();
                const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const minDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                if (date <= maxDate && date >= minDate) {
                  details.arrivalDate = date.toISOString().split('T')[0];
                  console.log(`✅ Extracted arrivalDate for vehicle ${vehicleId} using selector: ${details.arrivalDate}`);
                  arrivalDateFound = true;
                  break;
                }
              }
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }
    
    // Approach 3: Try regex patterns in HTML if cheerio didn't work
    if (!arrivalDateFound) {
      const arrivalDatePatterns = [
        // Pattern 1: "Angelegt am DD.MM.YYYY" (highest priority - this is what cargate shows)
        /Angelegt am[^<]*(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
        // Pattern 2: "eingetroffen am DD.MM.YYYY" or "seit DD.MM.YYYY"
        /(?:eingetroffen|seit)[^<]*(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
        // Pattern 3: "eingetroffen: DD.MM.YYYY"
        /eingetroffen[:\s]+(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
        // Pattern 4: Look for "Standtage" or "Tage" with date nearby
        /(?:standtage|tage)[^<]*(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
        // Pattern 5: Meta tags
        /"datePublished"[^>]*content="([^"]+)"/,
        /"dateCreated"[^>]*content="([^"]+)"/,
        // Pattern 6: Structured data
        /"datePublished":\s*"([^"]+)"/,
        /"dateCreated":\s*"([^"]+)"/,
        // Pattern 7: Table row with "Eintreffdatum" or similar
        /(?:eintreffdatum|eingetroffen|angelegt)[^<]*<td[^>]*>([^<]*)<\/td>/i,
        // Pattern 8: Look in list items
        /<li[^>]*>(?:eingetroffen|seit|standtage|angelegt)[^<]*(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
        // Pattern 9: Data attributes
        /data-arrival-date="([^"]+)"/i,
        /data-standtage="([^"]+)"/i,
        /data-angelegt="([^"]+)"/i,
      ];
      
      for (const pattern of arrivalDatePatterns) {
        const match = html.match(pattern);
        if (match) {
          try {
            let dateStr: string;
            if (match.length === 4) {
              // DD.MM.YYYY format
              const [, day, month, year] = match;
              dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else if (match.length === 2) {
              // ISO format or other from meta tags
              dateStr = match[1];
              // Try to parse and reformat if needed
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                dateStr = parsed.toISOString().split('T')[0];
              }
            } else {
              continue; // Skip if format doesn't match
            }
            
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              // Validate date is reasonable (not in future, not too old)
              const now = new Date();
              const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Max 7 days in future
              const minDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Max 1 year ago
              
              if (date <= maxDate && date >= minDate) {
                details.arrivalDate = date.toISOString().split('T')[0];
                console.log(`✅ Extracted arrivalDate for vehicle ${vehicleId} using regex: ${details.arrivalDate}`);
                arrivalDateFound = true;
                break;
              }
            }
          } catch (e) {
            // Continue to next pattern
            console.warn(`⚠️ Error parsing arrival date pattern for vehicle ${vehicleId}:`, e);
          }
        }
      }
    }
    
    // If no arrivalDate found, log it for debugging (but don't fail - it's optional data)
    if (!arrivalDateFound) {
      console.warn(`⚠️ Could not extract arrivalDate for vehicle ${vehicleId} from cargate - this is optional data`);
    }

    return details;
  } catch (error) {
    console.error(`❌ Error fetching details for vehicle ${vehicleId}:`, error);
    return {};
  }
}

/**
 * Processes vehicles in batches to avoid overwhelming the server
 */
async function processVehiclesInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Small delay between batches to be respectful
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Fetches and parses vehicles from the GS Automobile Rheinland website
 */
export async function fetchVehiclesFromWebsite(): Promise<Vehicle[]> {
  // Check cache first
  const cacheKey = "vehicles_list";
  const cached = cache.get<Vehicle[]>(cacheKey);
  if (cached) {
    console.log(`✅ Returning ${cached.length} vehicles from cache`);
    return cached;
  }
  
  console.log("🔄 Fetching vehicles from website...");
  
  try {
    // Fetch the HTML page
    const response = await fetch(VEHICLE_LIST_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const vehicles: Vehicle[] = [];
    const processedIds = new Set<string>(); // Track processed vehicle IDs to avoid duplicates
    
    // Find all carzilla-ui-vehicle custom elements
    $("carzilla-ui-vehicle").each((index, element) => {
      try {
        const $el = $(element);
        
        // Extract attributes
        const vehicleId = $el.attr("vehicle-id");
        const title = $el.attr("vehicle-title") || "";
        const priceStr = $el.attr("vehicle-price") || "0";
        const imageUrl = $el.attr("vehicle-image-url") || "";
        const offerUrl = $el.attr("offer-url") || "";
        const branchId = $el.attr("branch-id") || "";
        
        if (!vehicleId) {
          console.warn(`⚠️ Skipping vehicle at index ${index}: missing vehicle-id`);
          return;
        }
        
        // Skip if we've already processed this vehicle ID (avoid duplicates)
        if (processedIds.has(vehicleId)) {
          return;
        }
        processedIds.add(vehicleId);
        
        // Parse price (remove dots, replace comma with dot)
        const price = parseFloat(priceStr.replace(/\./g, "").replace(",", ".")) || 0;
        
        // Extract vehicle details
        const details = extractVehicleDetails(vehicleId, title, price);
        
        // Try to extract fuel and transmission from URL
        // URL format: /.../Brand/Model/Type/Fuel/Transmission/...
        let fuel = details.fuel || "Unbekannt";
        let transmission = details.transmission || "Unbekannt";
        if (offerUrl) {
          const urlParts = offerUrl.split('/').filter(p => p.length > 0);
          // Common fuel types in German
          const fuelTypes = ['Benzin', 'Diesel', 'Elektro', 'Hybrid', 'CNG', 'LPG'];
          const transmissionTypes = ['Automatik', 'Schaltgetriebe', 'Automatisch', 'Manuell'];
          
          for (const part of urlParts) {
            if (fuelTypes.includes(part)) {
              fuel = part;
            }
            if (transmissionTypes.includes(part)) {
              transmission = part;
            }
          }
        }
        
        // Build image URL - use the exact URL from cargate (vehicle-image-url) if available
        // This ensures we use the exact image URL that cargate provides, maintaining full quality
        let image = imageUrl;
        if (!image || !image.trim()) {
          // Only fallback to generating URL if no image URL is provided
          image = cargateImage(vehicleId, 1, "xl"); // Use "xl" for higher quality fallback
        }
        
        const brand = details.brand || "Unbekannt";
        const model = details.model || title;
        const power = details.power;
        const mileage = details.mileage || 0;
        
        const vehicle: Vehicle = {
          id: vehicleId,
          image,
          brand,
          model,
          price,
          year: details.year || new Date().getFullYear() - 1,
          mileage,
          fuel,
          transmission,
          isNew: details.isNew || false,
          offerUrl: offerUrl || undefined,
          category: determineVehicleCategory(brand, model, power, mileage, price, fuel),
        };
        
        vehicles.push(vehicle);
      } catch (error) {
        console.error(`❌ Error parsing vehicle at index ${index}:`, error);
      }
    });
    
    console.log(`✅ Successfully parsed ${vehicles.length} vehicles from list`);
    
    // Now fetch detailed information for each vehicle (in batches to avoid overwhelming the server)
    console.log("🔄 Fetching detailed information for vehicles...");
    const detailedVehicles = await processVehiclesInBatches(
      vehicles,
      5, // Process 5 vehicles at a time
      async (vehicle) => {
        if (!vehicle.offerUrl) return vehicle;
        
        const additionalDetails = await fetchVehicleDetails(vehicle.offerUrl, vehicle.id);
        
        // Update category if we got more information (power, etc.)
        const updatedVehicle = {
          ...vehicle,
          ...additionalDetails,
        };
        
        // Re-determine category with updated data
        if (additionalDetails.power !== undefined || additionalDetails.mileage !== undefined) {
          updatedVehicle.category = determineVehicleCategory(
            updatedVehicle.brand,
            updatedVehicle.model,
            updatedVehicle.power,
            updatedVehicle.mileage,
            updatedVehicle.price,
            updatedVehicle.fuel
          );
        }
        
        // Determine isNew based on arrival date (if available)
        if (updatedVehicle.arrivalDate) {
          const arrivalDate = new Date(updatedVehicle.arrivalDate);
          const daysSinceArrival = Math.floor((new Date().getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
          updatedVehicle.isNew = daysSinceArrival < 10; // Less than 10 days old
        }
        
        return updatedVehicle;
      }
    );
    
    console.log(`✅ Successfully enriched ${detailedVehicles.length} vehicles with detailed data`);
    
    // Cache the result
    cache.set(cacheKey, detailedVehicles);
    
    return detailedVehicles;
  } catch (error) {
    console.error("❌ Error fetching vehicles:", error);
    
    // Return cached data even if expired as fallback
    const staleCache = cache.get<Vehicle[]>(cacheKey);
    if (staleCache) {
      console.log("⚠️ Returning stale cache as fallback");
      return staleCache;
    }
    
    throw error;
  }
}
