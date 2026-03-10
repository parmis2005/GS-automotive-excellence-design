import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Calendar, ArrowRight, Zap, Phone, Mail, Car, Route, Cog, User } from "lucide-react";
import { Link } from "react-router-dom";
import type { Vehicle } from "@/types/vehicle";
import { getVehicleListImageWithFallback, getPlaceholderImage, getVehiclePrefetchUrls, prefetchImages } from "@/lib/vehicleImage";
import { ShareVehicleButton } from "@/components/ShareVehicleButton";
import { getVehicleType, formatFuelType, getVehicleDisplayName } from "@/lib/vehicleNameUtils";
import { getVehicleDetailSlug } from "@/lib/vehicleSlug";
import { VehicleTitle } from "@/components/VehicleTitle";
import { normalizeColorToBasic } from "@/lib/colorUtils";
import { formatPrice } from "@/lib/utils";

interface VehicleListItemProps extends Vehicle {
  isFirst?: boolean; // Optional prop to mark first item
  /** Wird vor dem Navigieren zur Detailseite aufgerufen (z. B. um Filter für Zurück-Kommen zu speichern) */
  onNavigateToDetail?: () => void;
}

const VehicleListItem = ({
  id,
  image,
  imageCount,
  brand,
  model,
  title,
  price,
  year,
  mileage,
  fuel,
  power,
  powerKw,
  transmission,
  exteriorColor,
  interiorColor,
  offerUrl,
  internalNumber,
  vatDisplayable,
  category,
  vehicleType: vehicleTypeFromCargate,
  previousOwners,
  arrivalDate,
  productionSeries,
  modelVariant: modelVariantProp,
  isFirst = false,
  onNavigateToDetail,
}: VehicleListItemProps) => {
  const displayTitle = getVehicleDisplayName(brand, model, productionSeries, title);

  // Get image URL with fallback to placeholder
  const initialImageUrl = getVehicleListImageWithFallback(image, id);
  const placeholderImageUrl = getPlaceholderImage();
  const hasPrefetchedRef = useRef(false);
  
  // State for image error handling and placeholder detection
  const [imageError, setImageError] = useState(false);
  const [usePlaceholder, setUsePlaceholder] = useState(!image || !image.trim());
  
  // Check if the image is a placeholder (only one image exists AND it's a placeholder)
  useEffect(() => {
    const isCargateImage = image?.includes('cargate360');
    const isCarzillaImage = image?.includes('carzilla-services.com');
    if (!image || !image.trim() || (!isCargateImage && !isCarzillaImage)) {
      setUsePlaceholder(true);
      return;
    }

    // Check if image 1 is a real photo (by loading it and checking dimensions)
    // and if image 2 exists
    const checkImages = async () => {
      try {
        const bid = image?.match(/[?&]bid=([^&]+)/)?.[1] || '1790';
        const image2Url = isCarzillaImage
          ? `https://img.carzilla-services.com/Images.ashx?vid=${id}&bid=${bid}&format=l&ino=2&app=carzilla`
          : `https://img.cargate360.de/default.aspx?vid=${id}&bid=1790&format=l&ino=2&app=Kiste-Default`;
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

  const handlePrefetch = () => {
    if (hasPrefetchedRef.current) return;
    const urls = getVehiclePrefetchUrls(image, id, imageCount, 3);
    if (urls.length > 0) {
      prefetchImages(urls);
      hasPrefetchedRef.current = true;
    }
  };
  
  const displayImageUrl = (imageError || usePlaceholder) ? placeholderImageUrl : initialImageUrl;
  const isPlaceholderDisplay = imageError || usePlaceholder;
  const inzahlungnahmeLink = (() => {
    const digits = (internalNumber || "").replace(/\D/g, "").slice(0, 3);
    return digits ? `/fahrzeugankauf?kennnr=${encodeURIComponent(digits.padStart(3, "0"))}` : "/fahrzeugankauf";
  })();

  // "Neu eingetroffen" Badge – gleiche Logik wie VehicleCard
  const isNew = (() => {
    if (arrivalDate) {
      try {
        const arrival = new Date(arrivalDate);
        if (!isNaN(arrival.getTime())) {
          const daysSinceArrival = Math.floor((new Date().getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceArrival >= 0 && daysSinceArrival < 30) return true;
        }
      } catch {
        // continue
      }
    }
    const currentYear = new Date().getFullYear();
    const isVeryNewYear = year >= currentYear - 1;
    const isVeryLowMileage = mileage < 1000;
    const isLowMileage = mileage < 5000;
    return (isVeryNewYear && isLowMileage) || isVeryLowMileage;
  })();
  
  return (
    <div className="group bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col min-h-[400px] min-w-0">
      {/* lg: Desktop-Kartenformat (Bild links), md: mobil (Bild oben) – Filter verschwindet bei xl zuerst */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-full min-w-0">
        {/* Image – ab lg nebeneinander, darunter gestapelt */}
        <Link
          to={`/fahrzeuge/${getVehicleDetailSlug(id, brand, model)}`}
          className="relative w-full lg:w-80 xl:w-96 2xl:w-[32rem] flex-shrink-0 bg-white overflow-hidden block group/image"
          onMouseEnter={handlePrefetch}
          onFocus={handlePrefetch}
          onTouchStart={handlePrefetch}
          onClick={() => onNavigateToDetail?.()}
        >
          <div className="relative w-full aspect-[4/3] p-1 bg-white">
            {isNew && (
              <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                Neu eingetroffen
              </div>
            )}
            <img
              src={displayImageUrl}
              alt={displayTitle}
              className="w-full h-full transition-transform duration-300 group-hover/image:scale-[1.02]"
              style={{ 
                objectFit: isPlaceholderDisplay ? 'contain' : 'cover',
                imageRendering: 'auto'
              }}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          </div>
        </Link>

        {/* Content - Right Side */}
        <div className="flex-1 p-6 flex flex-col min-h-full min-w-0">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap text-sm text-muted-foreground">
                {internalNumber && (
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-primary">
                    NR. {internalNumber}
                  </span>
                )}
              </div>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <VehicleTitle
                    brand={brand}
                    model={model}
                    productionSeries={productionSeries}
                    modelVariant={modelVariantProp}
                    fallbackTitle={title}
                    className="font-display text-2xl md:text-3xl font-bold text-foreground"
                    as="h3"
                  />
                  <div className="mt-1">
                    <span className="inline-block bg-gray-800 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                      GEBRAUCHTWAGEN
                    </span>
                  </div>
                </div>
                <div className="lg:hidden text-right shrink-0">
                  <div className="font-display text-3xl sm:text-4xl font-bold text-primary leading-none">
                    {formatPrice(price)} €
                  </div>
                  <div className="text-[10px] text-primary mt-1">
                    {vatDisplayable === false ? "MwSt. nicht ausweisbar" : "inkl. MwSt."}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Price */}
            <div className="hidden lg:block text-right">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">
                {formatPrice(price)} €
              </div>
              <div className="text-xs text-primary mt-1">
                {vatDisplayable === false ? "MwSt. nicht ausweisbar" : "inkl. MwSt."}
              </div>
              <Link to={`/fahrzeuge/${getVehicleDetailSlug(id, brand, model)}`} className="mt-3 inline-block" onClick={() => onNavigateToDetail?.()}>
                <Button
                  variant="default"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold"
                >
                  Details ansehen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Specifications Grid - Premium Box */}
          <div className="bg-gray-50/50 border border-gray-200/60 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-border lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <Link to={`/fahrzeuge/${getVehicleDetailSlug(id, brand, model)}#kaufanfrage`} className="w-full" onClick={() => onNavigateToDetail?.()}>
                <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-white">
                  Kaufanfrage
                </Button>
              </Link>
              <Link to={inzahlungnahmeLink} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Inzahlungnahme
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex flex-wrap gap-2 xl:gap-3 mt-auto pt-4 border-t border-border">
            <Link to={inzahlungnahmeLink} className="flex-shrink-0 xl:flex-1 min-w-[10.5rem]">
              <Button variant="outline" size="sm" className="text-xs xl:text-sm whitespace-nowrap w-full min-w-[10.5rem] xl:h-10 xl:py-2">
                Inzahlungnahme
              </Button>
            </Link>
            <ShareVehicleButton
              vehicleUrl={`/fahrzeuge/${getVehicleDetailSlug(id, brand, model)}`}
              label="Teilen"
              variant="outline"
              size="sm"
              className="flex-shrink-0 xl:flex-1 xl:min-w-0 xl:w-full xl:h-10 xl:py-2 text-xs xl:text-sm [&_svg]:w-3.5 [&_svg]:h-3.5 xl:[&_svg]:w-4 xl:[&_svg]:h-4"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 xl:flex-1 xl:min-w-0 xl:w-full xl:h-10 xl:py-2 text-xs xl:text-sm"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "tel:021519422262";
              }}
            >
              <Phone className="w-3.5 h-3.5 xl:w-4 xl:h-4 mr-1.5 xl:mr-2" />
              Anrufen
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 xl:flex-1 xl:min-w-0 xl:w-full xl:h-10 xl:py-2 text-xs xl:text-sm"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:info@gsauto.de?subject=Anfrage zu ${encodeURIComponent(displayTitle)}`;
              }}
            >
              <Mail className="w-3.5 h-3.5 xl:w-4 xl:h-4 mr-1.5 xl:mr-2" />
              E-Mail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleListItem;
