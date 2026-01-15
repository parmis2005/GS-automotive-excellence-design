import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Calendar, ArrowRight, Download, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Vehicle } from "@/types/vehicle";
import { getVehicleImageWithFallback, getPlaceholderImage } from "@/lib/vehicleImage";
import { normalizeColorToBasic } from "@/lib/colorUtils";
import { formatFuelType } from "@/lib/vehicleNameUtils";

interface VehicleCardProps extends Vehicle {
  showCategory?: boolean; // Optional prop to show/hide category badge
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
  vatDisplayable,
  showCategory = false, // Default: don't show category (only on homepage)
}: VehicleCardProps) => {
  // Get image URL with fallback to placeholder
  const initialImageUrl = getVehicleImageWithFallback(image, id);
  const placeholderImageUrl = getPlaceholderImage();
  
  // State for image error handling and placeholder detection
  const [imageError, setImageError] = useState(false);
  const [usePlaceholder, setUsePlaceholder] = useState(!image || !image.trim());
  
  // Check if the image is a placeholder (only one image exists AND it's a placeholder)
  useEffect(() => {
    // Only check if we have an image URL from cargate
    if (!image || !image.trim() || !image.includes('cargate360')) {
      setUsePlaceholder(true);
      return;
    }
    
    // Check if image 1 is a real photo (by loading it and checking dimensions)
    // and if image 2 exists
    const checkImages = async () => {
      try {
        // First check if image 2 exists - if it does, we definitely have real photos
        const image2Url = `https://img.cargate360.de/default.aspx?vid=${id}&bid=1790&format=xl&ino=2&app=Kiste-Default`;
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 2000);
        
        try {
          const response2 = await fetch(image2Url, {
            method: 'HEAD',
            signal: controller2.signal,
          });
          clearTimeout(timeout2);
          
          // If image 2 exists and is an image, we have real photos - use original
          if (response2.ok && response2.headers.get('content-type')?.startsWith('image/')) {
            setUsePlaceholder(false);
            return;
          }
        } catch (error) {
          clearTimeout(timeout2);
        }
        
        // Image 2 doesn't exist, so check if image 1 is a real photo by loading it
        const image1Url = initialImageUrl;
        const img = new Image();
        
        const image1Check = new Promise<boolean>((resolve) => {
          img.onload = () => {
            // Real car photos are usually larger (at least 600px width)
            // Placeholder images from cargate are typically smaller
            if (img.naturalWidth > 600 && img.naturalHeight > 400) {
              resolve(true); // Real photo
            } else {
              resolve(false); // Likely placeholder
            }
          };
          img.onerror = () => resolve(false);
          img.src = image1Url;
          
          // Timeout after 3 seconds
          setTimeout(() => resolve(false), 3000);
        });
        
        const isRealPhoto = await image1Check;
        
        // If image 1 is a real photo, use it; otherwise use placeholder
        setUsePlaceholder(!isRealPhoto);
      } catch (error) {
        // On error, keep current state (don't change)
      }
    };
    
    checkImages();
  }, [image, id, initialImageUrl]);
  
  const displayImageUrl = (imageError || usePlaceholder) ? placeholderImageUrl : initialImageUrl;
  const isPlaceholderDisplay = imageError || usePlaceholder;
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
          src={displayImageUrl}
          alt={`${brand} ${model}`}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          style={{ 
            objectFit: isPlaceholderDisplay ? 'contain' : 'cover',
            imageRendering: 'auto'
          }}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
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
          {vatDisplayable !== undefined && (
            <div className="text-sm text-muted-foreground mt-1">
              {vatDisplayable ? "MwSt. ausweisbar" : "MwSt. nicht ausweisbar"}
            </div>
          )}
          <Link to={`/fahrzeuge/${id}#kaufanfrage`} className="mt-3 inline-block">
            <Button
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Kaufanfrage
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
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
          <span>{formatFuelType(fuel)}</span>
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
            {exteriorColor && <span>Außen: {normalizeColorToBasic(exteriorColor)}</span>}
            {exteriorColor && interiorColor && <span className="mx-2">·</span>}
            {interiorColor && <span>Innen: {interiorColor}</span>}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-border space-y-2 mt-auto">
          <Link to={`/fahrzeuge/${id}`} className="block w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              Fahrzeug ansehen
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
