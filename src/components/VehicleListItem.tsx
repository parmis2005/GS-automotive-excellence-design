import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Calendar, ArrowRight, Download, Zap, Phone, Mail, Car, Route, Cog, User } from "lucide-react";
import { Link } from "react-router-dom";
import type { Vehicle } from "@/types/vehicle";
import { Badge } from "@/components/ui/badge";
import { getVehicleImageWithFallback, getPlaceholderImage } from "@/lib/vehicleImage";
import { splitModelName, getVehicleType, formatFuelType } from "@/lib/vehicleNameUtils";
import { normalizeColorToBasic } from "@/lib/colorUtils";

interface VehicleListItemProps extends Vehicle {
  isFirst?: boolean; // Optional prop to mark first item
}

const VehicleListItem = ({
  id,
  image,
  brand,
  model,
  price,
  year,
  mileage,
  fuel,
  power,
  powerKw,
  transmission,
  exteriorColor,
  interiorColor,
  exposeUrl,
  offerUrl,
  internalNumber,
  vatDisplayable,
  category,
  vehicleType: vehicleTypeFromCargate,
  previousOwners,
  isFirst = false,
}: VehicleListItemProps) => {
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
  
  return (
    <div className="group bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col min-h-[400px]">
      <div className="flex flex-col md:flex-row flex-1 min-h-full">
        {/* Image - Left Side */}
        <div className="relative w-full md:w-96 lg:w-[32rem] flex-shrink-0 bg-secondary overflow-hidden">
          <div className="relative w-full aspect-[4/3] p-1 bg-secondary">
            <img
              src={displayImageUrl}
              alt={`${brand} ${model}`}
              className="w-full h-full"
              style={{ 
                objectFit: isPlaceholderDisplay ? 'contain' : 'cover',
                imageRendering: 'auto'
              }}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          </div>
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 p-6 flex flex-col min-h-full">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {internalNumber && (
                  <Badge variant="outline" className="text-xs">
                    {internalNumber}
                  </Badge>
                )}
              </div>
              {(() => {
                const { base, variant } = splitModelName(model);
                return (
                  <div className="mb-2">
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                      {brand} {base}
                    </h3>
                    {variant && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {variant}
                      </p>
                    )}
                    <div className="mt-1">
                      <span className="inline-block bg-gray-800 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                        GEBRAUCHTWAGEN
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Price */}
            <div className="text-right">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">
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
                  className="bg-primary hover:bg-primary/90 text-white font-semibold"
                >
                  Kaufanfrage
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Specifications Grid - Premium Box */}
          <div className="bg-gray-50/50 border border-gray-200/60 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {year && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Erstzulassung</span>
                    <span className="font-semibold text-sm">{year}</span>
                  </div>
                </div>
              )}

              {mileage > 0 && (
                <div className="flex items-center gap-3">
                  <Route className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Kilometerstand</span>
                    <span className="font-semibold text-sm">{mileage.toLocaleString("de-DE")} km</span>
                  </div>
                </div>
              )}

              {fuel && (
                <div className="flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Kraftstoff</span>
                    <span className="font-semibold text-sm">{formatFuelType(fuel)}</span>
                  </div>
                </div>
              )}

              {transmission && (
                <div className="flex items-center gap-3">
                  <Cog className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Getriebe</span>
                    <span className="font-semibold text-sm">{transmission}</span>
                  </div>
                </div>
              )}

              {(() => {
                const vehicleType = getVehicleType(model, vehicleTypeFromCargate);
                return vehicleType && (
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Fahrzeugtyp</span>
                      <span className="font-semibold text-sm">{vehicleType}</span>
                    </div>
                  </div>
                );
              })()}

              {power && (
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Leistung</span>
                    <span className="font-semibold text-sm">
                      {powerKw ? `${powerKw} kW / ` : ''}{power} PS
                    </span>
                  </div>
                </div>
              )}

              {exteriorColor && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Außenfarbe</span>
                    <span className="font-semibold text-sm">{normalizeColorToBasic(exteriorColor)}</span>
                  </div>
                </div>
              )}

              {previousOwners !== undefined && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Vorbesitzer</span>
                    <span className="font-semibold text-sm">{previousOwners}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-border">
            <Link to={`/fahrzeuge/${id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Details ansehen
              </Button>
            </Link>
            {exposeUrl && (
              <Button
                variant="outline"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(exposeUrl, '_blank');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exposé
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "tel:021519422262";
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Anrufen
            </Button>
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:info@gsauto.de?subject=Anfrage zu ${encodeURIComponent(brand + " " + model)}`;
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              E-Mail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleListItem;
