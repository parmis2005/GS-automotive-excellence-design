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
function cargateImage(vid: string, ino: number = 1, format: string = "xlrm"): string {
  return `https://img.cargate360.de/default.aspx?vid=${vid}&bid=1790&format=${format}&ino=${ino}&app=Kiste-Default`;
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
        
        // Build image URL (use cargate360 if image-url is not available or use the provided one)
        let image = imageUrl;
        if (!image || !image.includes("cargate360")) {
          image = cargateImage(vehicleId, 1);
        }
        
        const vehicle: Vehicle = {
          id: vehicleId,
          image,
          brand: details.brand || "Unbekannt",
          model: details.model || title,
          price,
          year: details.year || new Date().getFullYear() - 1,
          mileage: details.mileage || 0,
          fuel,
          transmission,
          isNew: details.isNew || false,
          offerUrl: offerUrl || undefined,
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
        return {
          ...vehicle,
          ...additionalDetails,
        };
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
