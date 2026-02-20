/**
 * SEO Utility Functions
 * Centralized functions for SEO-related operations
 */

import { getVehicleDetailSlug } from "@/lib/vehicleSlug";

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url: string;
  type?: "website" | "product" | "article";
}

const BASE_URL = "https://gsauto.de";

/**
 * Generates page title with brand suffix
 */
export function generateTitle(pageTitle: string): string {
  return `${pageTitle} | GS Automobile Rheinland`;
}

/**
 * Generates default SEO data for pages
 */
export function getDefaultSEO(): SEOData {
  return {
    title: generateTitle("Gebrauchtwagen in Krefeld"),
    description: "GS Automobile Rheinland - Ihr Spezialist für Gebrauchtwagen in Krefeld. Geprüfte Qualität, faire Preise, 25+ Jahre Erfahrung. Über 10.000 verkaufte Fahrzeuge. Jetzt Traumauto finden!",
    keywords: "Gebrauchtwagen Krefeld, Auto kaufen, GS Automobile, Autohaus Krefeld, Autohaus NRW, BMW Krefeld, Opel Krefeld, Auto Krefeld, Autohaus Nähe, Gebrauchtwagen kaufen Niederrhein, günstige Finanzierung, Finanzierung Krefeld, Inzahlungnahme Krefeld, Auto verkaufen Krefeld, Fahrzeugankauf Krefeld, Jahreswagen Krefeld, junge Gebrauchtwagen Krefeld",
    image: `${BASE_URL}/logo.png`,
    url: BASE_URL,
    type: "website",
  };
}

/**
 * Generates SEO data for vehicle detail pages (mobile.de-Stil für Link-Vorschau).
 * Titel: "Marke Modell für Preis €", Beschreibung: "Gebrauchtfahrzeug • km • kW (PS) • Kraftstoff"
 */
export function getVehicleSEO(
  brand: string,
  model: string,
  year: number,
  price: number,
  mileage: number,
  image?: string,
  vehicleId?: string,
  options?: { power?: number; powerKw?: number; fuel?: string }
): SEOData {
  const powerKw = options?.powerKw ?? 0;
  const powerPs = options?.power ?? 0;
  const fuel = (options?.fuel ?? "").trim() || "–";
  const priceStr = price > 0 ? price.toLocaleString("de-DE") : "";
  const title = priceStr
    ? `${brand} ${model} für ${priceStr} € | GS Automobile Rheinland`
    : generateTitle(`${brand} ${model} ${year} | Gebrauchtwagen`);
  const parts = ["Gebrauchtfahrzeug"];
  if (mileage > 0) parts.push(`${mileage.toLocaleString("de-DE")} km`);
  if (powerKw > 0 && powerPs > 0) parts.push(`${powerKw} kW (${powerPs} PS)`);
  else if (powerKw > 0) parts.push(`${powerKw} kW`);
  else if (powerPs > 0) parts.push(`${powerPs} PS`);
  if (fuel && fuel !== "–") parts.push(fuel);
  const description = parts.join(" • ");

  const path = vehicleId ? `/fahrzeuge/${getVehicleDetailSlug(vehicleId, brand, model)}` : "/fahrzeuge";
  return {
    title,
    description,
    keywords: `${brand} ${model} Gebrauchtwagen, ${brand} ${model} kaufen Krefeld, ${brand} ${model} ${year}`,
    image: image || `${BASE_URL}/logo.png`,
    url: `${BASE_URL}${path}`,
    type: "product",
  };
}

/**
 * Generates SEO data for vehicles page
 */
export function getVehiclesPageSEO(): SEOData {
  return {
    title: generateTitle("Fahrzeugsuche | Gebrauchtwagen Krefeld"),
    description: "Finden Sie Ihr Traumauto in Krefeld! Große Auswahl an geprüften Gebrauchtwagen bei GS Automobile Rheinland. Filtern Sie nach Marke, Preis, Baujahr und mehr – faire Preise, sofort verfügbar.",
    keywords: "Fahrzeugsuche Krefeld, Gebrauchtwagen suchen, Auto finden Krefeld, Autohaus Krefeld, Gebrauchtwagen Krefeld",
    image: `${BASE_URL}/logo.png`,
    url: `${BASE_URL}/fahrzeuge`,
    type: "website",
  };
}

/**
 * Generates LocalBusiness structured data (JSON-LD)
 */
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    "name": "GS Automobile Rheinland",
    "image": `${BASE_URL}/logo.png`,
    "url": BASE_URL,
    "telephone": "+4921519422262",
    "email": "info@gsauto.de",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Kuhleshütte 149",
      "addressLocality": "Krefeld",
      "postalCode": "47809",
      "addressCountry": "DE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "51.3236",
      "longitude": "6.5986"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:30",
        "closes": "17:30"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "10:00",
        "closes": "13:00"
      }
    ],
    "priceRange": "€€",
    "description": "Ihr Spezialist für Gebrauchtwagen in Krefeld. Geprüfte Qualität, faire Preise, 25+ Jahre Erfahrung."
  };
}

/**
 * Generates Product structured data (JSON-LD) for a vehicle
 */
export function generateVehicleSchema(
  brand: string,
  model: string,
  year: number,
  price: number,
  mileage: number,
  fuel: string,
  image?: string,
  vehicleId?: string,
  description?: string
) {
  const path = vehicleId ? `/fahrzeuge/${getVehicleDetailSlug(vehicleId, brand, model)}` : "";
  const url = path ? `${BASE_URL}${path}` : BASE_URL;
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${brand} ${model}`,
    "image": image || `${BASE_URL}/logo.png`,
    "description": description || `${brand} ${model} ${year}, ${mileage.toLocaleString("de-DE")} km, ${fuel}`,
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "manufacturer": {
      "@type": "Organization",
      "name": brand
    },
    "model": model,
    "productionDate": year.toString(),
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": url,
      "seller": {
        "@type": "Organization",
        "name": "GS Automobile Rheinland"
      }
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Kilometerstand",
        "value": `${mileage.toLocaleString("de-DE")} km`
      },
      {
        "@type": "PropertyValue",
        "name": "Kraftstoff",
        "value": fuel
      },
      {
        "@type": "PropertyValue",
        "name": "Baujahr",
        "value": year.toString()
      }
    ]
  };
}

/**
 * Generates CollectionPage + ItemList schema for vehicle listing pages
 */
export function generateCollectionPageSchema(
  itemUrls: string[],
  pageTitle: string,
  description?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": description || "Gebrauchtwagen bei GS Automobile Rheinland in Krefeld",
    "url": `${BASE_URL}/fahrzeuge`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": itemUrls.length,
      "itemListElement": itemUrls.slice(0, 20).map((url, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": url
      }))
    }
  };
}

/**
 * Generates BreadcrumbList structured data (JSON-LD)
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const fullUrl = (u: string) => u.startsWith("http") ? u : `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": fullUrl(item.url)
    }))
  };
}
