import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Calendar, ArrowRight, Download, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Vehicle } from "@/types/vehicle";

interface VehicleCardProps extends Vehicle {
  showCategory?: boolean; // Optional prop to show/hide category badge
}

/**
 * Ensures the image URL uses "xl" format for high quality
 * Replaces any format parameter (xlrm, xlrg, etc.) with "xl"
 */
function ensureHighQualityImageUrl(imageUrl: string, vehicleId: string): string {
  if (!imageUrl || !imageUrl.includes('cargate360')) {
    // If not a cargate URL, return as-is or generate one
    return `https://img.cargate360.de/default.aspx?vid=${vehicleId}&bid=1790&format=xl&ino=1&app=Kiste-Default`;
  }
  
  // Replace any format parameter with "xl" for consistent high quality
  return imageUrl.replace(/format=[^&]*/i, 'format=xl');
}

const VehicleCard = ({
  id,
  image,
  brand,
  model,
  price,
  year,
  mileage,
  fuel,
  isNew: isNewProp,
  power,
  powerKw,
  transmission,
  exteriorColor,
  interiorColor,
  exposeUrl,
  offerUrl,
  category,
  arrivalDate,
  showCategory = false, // Default: don't show category (only on homepage)
}: VehicleCardProps) => {
  // Ensure image URL uses "xl" format for high quality
  const highQualityImage = ensureHighQualityImageUrl(image, id);
  // Determine if vehicle should show "Neu eingetroffen" badge
  // Priority 1: Use arrivalDate if available (from cargate) - but this data is loaded via JS, so usually not available
  // Priority 2: Fallback - since arrivalDate is not available, use indicators based on vehicle characteristics
  const isNew = (() => {
    // Priority 1: Use arrivalDate if available
    if (arrivalDate) {
      try {
        const arrival = new Date(arrivalDate);
        if (!isNaN(arrival.getTime())) {
          const daysSinceArrival = Math.floor((new Date().getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
          // Only show if less than 30 days AND not negative (future dates)
          if (daysSinceArrival >= 0 && daysSinceArrival < 30) {
            return true;
          }
        }
      } catch (e) {
        // Continue to fallback
      }
    }
    
    // Priority 2: Fallback indicators - since arrivalDate is not available via scraping
    // Show badge for vehicles that are likely "new arrivals":
    // - Very new year (current year or last year) AND low mileage (< 5000 km)
    // OR very low mileage (< 1000 km) regardless of year
    const currentYear = new Date().getFullYear();
    const isVeryNewYear = year >= currentYear - 1;
    const isVeryLowMileage = mileage < 1000;
    const isLowMileage = mileage < 5000;
    
    return (isVeryNewYear && isLowMileage) || isVeryLowMileage;
  })();
  return (
    <div className="group relative bg-background rounded-lg overflow-hidden hover-lift border border-border shadow-soft h-full flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={highQualityImage}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          style={{ imageRendering: 'auto' }}
        />
        
        {/* Category Badge - oben links im Bild (nur auf Startseite) */}
        {showCategory && category && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-primary/30 text-primary text-xs font-medium">
            {category === "Elektro" && "Elektro"}
            {category === "Sport" && "Sportlich"}
            {category === "SUV" && "SUV"}
            {category === "Familienwagen" && "Familie"}
            {category === "Kleinwagen" && "Kleinwagen"}
            {category === "Kombi" && "Kombi"}
            {category === "Luxus" && "Luxus"}
            {category === "Van" && "Van"}
            {category === "Mittelklasse" && "Mittelklasse"}
            {!["Elektro", "Sport", "SUV", "Familienwagen", "Kleinwagen", "Kombi", "Luxus", "Van", "Mittelklasse"].includes(category) && category}
          </div>
        )}
        
        {/* New Badge - rechts oben, wenn vorhanden */}
        {isNew && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
            Neu eingetroffen
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Brand & Model - Modellname größer/stärker */}
        <div className="mb-4">
          <span className="text-xs text-primary font-semibold uppercase tracking-wider">
            {brand}
          </span>
          <h3 className="font-display text-2xl font-bold text-foreground mt-1">
            {model}
          </h3>
        </div>

        {/* Price - visuell dominanter */}
        <div className="mb-4">
          <div className="font-display text-3xl font-bold text-primary">
            {price.toLocaleString("de-DE")} €
          </div>
        </div>

        {/* Specs - Eckdaten kompakt */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
          {mileage > 0 && (
            <>
              <span>{mileage.toLocaleString("de-DE")} km</span>
              <span>·</span>
            </>
          )}
          <span>{year}</span>
          <span>·</span>
          <span>{fuel}</span>
          {transmission && (
            <>
              <span>·</span>
              <span>{transmission}</span>
            </>
          )}
        </div>

        {/* Colors - nur wenn vorhanden, kompakter */}
        {(exteriorColor || interiorColor) && (
          <div className="mb-4 text-xs text-muted-foreground">
            {exteriorColor && <span>Außen: {exteriorColor}</span>}
            {exteriorColor && interiorColor && <span className="mx-2">·</span>}
            {interiorColor && <span>Innen: {interiorColor}</span>}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-border space-y-2 mt-auto">
          <Link to={`/fahrzeuge/${id}`} className="block w-full">
            <Button
              variant="default"
              size="sm"
              className="w-full"
            >
              Fahrzeug ansehen
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          {exposeUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                window.open(exposeUrl, '_blank');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exposé herunterladen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
