import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useVehicle, useVehicles } from "@/hooks/useVehicles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getVehicleSEO, generateVehicleSchema } from "@/utils/seo";
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Gauge, 
  Fuel, 
  Zap, 
  Download,
  Phone,
  Mail,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  FileText,
  ArrowRight,
  ArrowLeftRight,
  Shield,
  Radio,
  Sun,
  Car,
  Sofa,
  Settings,
  Sparkles,
  Armchair,
  Users,
  Cog,
  Box,
  Layers,
  MapPin,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getPlaceholderImage, getVehicleImageWithFallback } from "@/lib/vehicleImage";
import { ExposeViewerDialog } from "@/components/ExposeViewerDialog";
import { getBaseModelName, getVehicleDisplayName, groupEquipmentByCategory } from "@/lib/vehicleNameUtils";
import { VehicleTitle } from "@/components/VehicleTitle";

/**
 * Helper function to build cargate360 image URL
 */
function cargateImage(vid: string, ino: number = 1, format: string = "xl"): string {
  return `https://img.cargate360.de/default.aspx?vid=${vid}&bid=1790&format=${format}&ino=${ino}&app=Kiste-Default`;
}

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: vehicle, isLoading, error } = useVehicle(id || "");
  const { data: allVehicles } = useVehicles();

  // State for available images (only images that actually exist)
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showExpose, setShowExpose] = useState(false);

  // Reset image index when vehicle ID changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setIsZoomed(false);
  }, [id]);

  // Form state for purchase inquiry
  const [formData, setFormData] = useState({
    salutation: "",
    firstName: "",
    lastName: "",
    company: "",
    street: "",
    houseNumber: "",
    zipCode: "",
    city: "",
    email: "",
    phone: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    message: "",
    privacyAccepted: false,
  });

  // Check which images actually exist (only if vehicle has a valid image already)
  useEffect(() => {
    if (!vehicle) {
      setAvailableImages([]);
      setIsLoadingImages(false);
      return;
    }

    // Check up to 30 images, but only add ones that exist
    // Use image loading approach instead of HEAD requests to avoid CORS issues
    // IMPORTANT: All images (including the first one) use the same "xl" format for consistent quality
    // This ensures the first image is not a thumbnail/small format that gets upscaled and looks blurry
    const checkImages = async () => {
      setIsLoadingImages(true);
      const validImages: string[] = [];
      
      // Check images sequentially starting from image 1, all using "xl" format
      // This prevents loading placeholder images that cargate returns for non-existent images
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 3; // Stop after 3 consecutive failures
      const maxImagesToCheck = 30;
      
      for (let imageNum = 1; imageNum <= maxImagesToCheck && consecutiveFailures < maxConsecutiveFailures; imageNum++) {
        const url = cargateImage(vehicle.id, imageNum, "xl");
        
        try {
          const imageExists = await new Promise<boolean>((resolve) => {
            const img = new Image();
            img.onload = () => {
              // Check if image is a placeholder by checking its dimensions
              // Real car photos are usually larger (at least 600px width)
              // Placeholder images from cargate are typically smaller
              if (img.naturalWidth > 600 && img.naturalHeight > 400) {
                resolve(true);
              } else {
                // Likely a placeholder
                resolve(false);
              }
            };
            img.onerror = () => resolve(false);
            img.src = url;
            // Timeout after 2 seconds
            setTimeout(() => resolve(false), 2000);
          });
          
          if (imageExists) {
            validImages.push(url);
            consecutiveFailures = 0; // Reset counter on success
          } else {
            consecutiveFailures++;
          }
        } catch (e) {
          consecutiveFailures++;
        }
      }

      setAvailableImages(validImages);
      setIsLoadingImages(false);
    };

    checkImages();
  }, [vehicle]);

  // Scroll to top of page when vehicle loads (if no hash)
  useEffect(() => {
    if (!isLoading && vehicle && !location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isLoading, vehicle, location.hash]);

  // Scroll to purchase inquiry form if hash is present
  useEffect(() => {
    if (location.hash === '#kaufanfrage' && !isLoading && vehicle) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById('kaufanfrage');
        if (element) {
          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetTop = 80; // Navbar height
          window.scrollTo({
            top: elementTop - offsetTop,
            behavior: 'smooth'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, isLoading, vehicle]);

  // Find similar vehicles
  const similarVehicles = useMemo(() => {
    if (!vehicle || !allVehicles || allVehicles.length === 0) {
      return [];
    }

    const currentBaseModel = getBaseModelName(vehicle.model);
    const priceRange = vehicle.price * 0.3; // ±30% price range
    const minPrice = vehicle.price - priceRange;
    const maxPrice = vehicle.price + priceRange;
    const yearDiff = 3; // ±3 years

    // Score vehicles based on similarity
    const scoredVehicles = allVehicles
      .filter(v => v.id !== vehicle.id) // Exclude current vehicle
      .map(v => {
        let score = 0;
        
        // Same brand: +10 points
        if (v.brand === vehicle.brand) {
          score += 10;
        }
        
        // Same base model: +20 points
        const vBaseModel = getBaseModelName(v.model);
        if (vBaseModel === currentBaseModel) {
          score += 20;
        }
        
        // Similar price (±30%): +5 points
        if (v.price >= minPrice && v.price <= maxPrice) {
          score += 5;
        }
        
        // Similar year (±3 years): +3 points
        if (Math.abs(v.year - vehicle.year) <= yearDiff) {
          score += 3;
        }
        
        // Same fuel type: +2 points
        if (v.fuel === vehicle.fuel) {
          score += 2;
        }
        
        return { vehicle: v, score };
      })
      .filter(item => item.score > 0) // Only include vehicles with some similarity
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 6) // Take top 6
      .map(item => item.vehicle);

    return scoredVehicles;
  }, [vehicle, allVehicles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Fahrzeug wird geladen...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler beim Laden des Fahrzeugs</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Fahrzeug nicht gefunden"}
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button 
              onClick={() => navigate("/fahrzeuge")} 
              variant="outline"
              className="bg-white/50 hover:bg-white/80 border-gray-200/60 text-foreground hover:text-foreground shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Fahrzeugsuche
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/fahrzeuge")}
            className="mb-4 bg-white/50 hover:bg-white/80 border-gray-200/60 text-foreground hover:text-foreground shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Fahrzeugsuche
          </Button>
        </div>

        {/* Wie in main: 2 Spalten – links Bilder, Ähnliche, Ausstattung; rechts Preis, Kaufanfrage. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Left Column - Images, Similar, Ausstattung */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Image Gallery Container - Box with subtle background */}
            <div className="bg-gray-50/50 border border-gray-200/60 rounded-lg p-3 space-y-3">
              {/* Main Image with Navigation */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary group">
              {isLoadingImages ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : availableImages.length > 0 ? (
                <>
                  <img
                    key={selectedImageIndex}
                    src={availableImages[selectedImageIndex]}
                    alt={`${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)} - Bild ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading={selectedImageIndex === 0 ? "eager" : "lazy"}
                    fetchPriority={selectedImageIndex === 0 ? "high" : "auto"}
                    decoding="async"
                    style={{ imageRendering: 'auto' }}
                  />
                  {/* Calculate isNew based on arrivalDate or fallback indicators */}
                  {(() => {
                    // Priority 1: Use arrivalDate if available
                    if (vehicle.arrivalDate) {
                      try {
                        const arrival = new Date(vehicle.arrivalDate);
                        if (!isNaN(arrival.getTime())) {
                          const daysSinceArrival = Math.floor((new Date().getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
                          if (daysSinceArrival >= 0 && daysSinceArrival < 30) {
                            return true;
                          }
                        }
                      } catch {
                        // Continue to fallback
                      }
                    }
                    
                    // Priority 2: Fallback indicators - since arrivalDate is not available via scraping
                    const currentYear = new Date().getFullYear();
                    const isVeryNewYear = vehicle.year >= currentYear - 1;
                    const isVeryLowMileage = vehicle.mileage < 1000;
                    const isLowMileage = vehicle.mileage < 5000;
                    return (isVeryNewYear && isLowMileage) || isVeryLowMileage;
                  })() && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground z-10">
                      Neu eingetroffen
                    </Badge>
                  )}
                  
                  {/* Navigation Arrows */}
                  {availableImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : availableImages.length - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label="Vorheriges Bild"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev < availableImages.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label="Nächstes Bild"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
                        {selectedImageIndex + 1} / {availableImages.length}
                      </div>
                      
                      {/* Zoom Button - Top Right */}
                      <button
                        onClick={() => setIsZoomed(true)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center z-10 transition-all"
                        aria-label="Bild vergrößern"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <img
                    src={getPlaceholderImage()}
                    alt="GS Automobile Rheinland"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              </div>

              {/* Thumbnail Gallery - Show only 7 thumbnails centered around selected image */}
              {availableImages.length > 1 && (() => {
              // Calculate which 7 thumbnails to show (centered around selected image)
              const totalImages = availableImages.length;
              const thumbnailsToShow = 7;
              let startIndex = Math.max(0, selectedImageIndex - Math.floor(thumbnailsToShow / 2));
              let endIndex = Math.min(totalImages, startIndex + thumbnailsToShow);
              
              // Adjust if we're near the end
              if (endIndex - startIndex < thumbnailsToShow) {
                startIndex = Math.max(0, endIndex - thumbnailsToShow);
              }
              
              const visibleThumbnails = availableImages.slice(startIndex, endIndex);
              
              return (
                <div className="flex gap-2 justify-center">
                  {visibleThumbnails.map((url, localIndex) => {
                    const globalIndex = startIndex + localIndex;
                    return (
                      <button
                        key={globalIndex}
                        onClick={() => setSelectedImageIndex(globalIndex)}
                        className={`relative aspect-square w-20 h-20 overflow-hidden rounded-md bg-secondary cursor-pointer transition-all flex-shrink-0 ${
                          selectedImageIndex === globalIndex
                            ? 'ring-2 ring-primary ring-offset-2'
                            : 'hover:opacity-80 hover:ring-1 ring-border'
                        }`}
                        aria-label={`Bild ${globalIndex + 1} auswählen`}
                      >
                        <img
                          src={url}
                          alt={`${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)} - Bild ${globalIndex + 1}`}
                          className="w-full h-full object-cover"
                          loading={globalIndex === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      </button>
                    );
                  })}
                </div>
              );
              })()}
            </div>

            {/* Ähnliche Angebote – gleiche Box wie Bildbereich, 3 sichtbar, Carousel, Kanten bündig */}
            {similarVehicles.length > 0 && (
              <div className="bg-gray-50/50 border border-gray-200/60 rounded-lg p-3 mt-6">
                <h2 className="text-2xl font-bold mb-4">Ähnliche Angebote</h2>
                <div className="relative">
                  <Carousel
                    opts={{ align: "start", slidesToScroll: 1, loop: true }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2 flex">
                      {similarVehicles.map((similarVehicle) => {
                        const placeholderImageUrl = getPlaceholderImage();
                        const shouldUsePlaceholder = !similarVehicle.image || !similarVehicle.image.trim();
                        const displayImageUrl = shouldUsePlaceholder ? placeholderImageUrl : getVehicleImageWithFallback(similarVehicle.image, similarVehicle.id);
                        const isPlaceholderDisplay = shouldUsePlaceholder;
                        return (
                          <CarouselItem key={similarVehicle.id} className="pl-2 basis-[calc((100%-1rem)/3)] min-w-0 shrink-0">
                            <Link to={`/fahrzeuge/${similarVehicle.id}`}>
                              <div className="group relative bg-background rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                                  <img
                                    src={displayImageUrl}
                                    alt={getVehicleDisplayName(similarVehicle.brand, similarVehicle.model, similarVehicle.productionSeries)}
                                    className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${isPlaceholderDisplay ? "object-contain" : "object-cover"}`}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                                <div className="p-2 space-y-1">
                                  <div className="text-[10px] text-primary font-medium uppercase tracking-wide">
                                    {similarVehicle.brand}
                                  </div>
                                  <VehicleTitle
                                    brand={similarVehicle.brand}
                                    model={similarVehicle.model}
                                    productionSeries={similarVehicle.productionSeries}
                                    modelVariant={similarVehicle.modelVariant}
                                    variantClassName="text-[10px] font-normal text-muted-foreground tracking-wide line-clamp-2"
                                    className="text-xs font-semibold text-foreground"
                                    as="h3"
                                  />
                                  <div className="text-sm font-bold text-primary">
                                    {similarVehicle.price.toLocaleString("de-DE")} €
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    {similarVehicle.mileage > 0 && (
                                      <>
                                        <span>{similarVehicle.mileage.toLocaleString("de-DE")} km</span>
                                        <span>·</span>
                                      </>
                                    )}
                                    {similarVehicle.power && <span>{similarVehicle.power} PS</span>}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <CarouselPrevious className="-left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="-right-2 top-1/2 -translate-y-1/2" />
                  </Carousel>
                </div>
              </div>
            )}

            {/* Ausstattung – unter Ähnlichen Angeboten */}
            {vehicle.equipment && vehicle.equipment.length > 0 ? (
              <div className="mt-6 flex-1 min-h-0 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-[#0f2439] px-5 py-4 flex items-center gap-2 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Ausstattung</h2>
                </div>
                <div className="space-y-4 overflow-y-auto pr-1 min-h-0 flex-1 p-5 pt-4">
                  {(() => {
                    const grouped = groupEquipmentByCategory(vehicle.equipment);
                    const categoryLabels: Record<string, string> = {
                      Komfort: "Komfort", Sicherheit: "Sicherheit", Multimedia: "Multimedia",
                      "Licht & Sicht": "Licht & Sicht", Außen: "Außen", Innenausstattung: "Innenausstattung",
                      "Fahrwerk & Antrieb": "Fahrwerk & Antrieb", Sonstiges: "Weitere Ausstattung",
                    };
                    const categoryIcons: Record<string, React.ReactNode> = {
                      Komfort: <Armchair className="w-4 h-4" />, Sicherheit: <Shield className="w-4 h-4" />,
                      Multimedia: <Radio className="w-4 h-4" />, "Licht & Sicht": <Sun className="w-4 h-4" />,
                      Außen: <Car className="w-4 h-4" />, Innenausstattung: <Sofa className="w-4 h-4" />,
                      "Fahrwerk & Antrieb": <Settings className="w-4 h-4" />, Sonstiges: <Sparkles className="w-4 h-4" />,
                    };
                    return Array.from(grouped.entries()).map(([category, items]) => {
                      if (items.length === 0) return null;
                      return (
                        <section key={category} className="rounded-lg border border-border/80 bg-muted/30 p-4">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            {categoryIcons[category]}
                            {categoryLabels[category] ?? category}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item, idx) => (
                              <span key={idx} className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-xs border border-border/60">
                                {item}
                              </span>
                            ))}
                          </div>
                        </section>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex-1 min-h-0 rounded-xl border border-dashed border-border bg-muted/10 p-8 flex items-center justify-center text-sm text-muted-foreground">
                Keine Ausstattungsdaten vorhanden
              </div>
            )}
          </div>

          {/* Right Column - Details, Kaufanfrage unter Schnellinfos */}
          <div className="flex flex-col gap-6 min-h-0">
            {/* Premium Box - Header, Price, Quick Specs, CTA Buttons */}
            <div className="bg-gray-50/50 border border-gray-200/60 rounded-lg p-6 md:p-8 space-y-6">
              <div>
              <div className="mb-2">
                {(() => (
                  <VehicleTitle
                    brand={vehicle.brand}
                    model={vehicle.model}
                    productionSeries={vehicle.productionSeries}
                    modelVariant={vehicle.modelVariant}
                    fallbackTitle={vehicle.brand + " " + vehicle.model}
                    className="text-3xl md:text-4xl font-display font-bold text-foreground"
                    as="h1"
                  />
                ))()}
              </div>
              {vehicle.internalNumber && (
                <div className="mb-4">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium">
                    Kennnr. {vehicle.internalNumber}
                  </Badge>
                </div>
              )}
              <div className="mb-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Preis</span>
                    <div className="text-4xl font-display font-bold text-primary">
                      {vehicle.price.toLocaleString("de-DE")} €
                    </div>
                    {vehicle.vatDisplayable !== undefined && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {vehicle.vatDisplayable ? "MwSt. ausweisbar" : "MwSt. nicht ausweisbar"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="default"
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all group"
                      onClick={() => {
                        document.getElementById("kaufanfrage")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        window.history.replaceState(null, "", "#kaufanfrage");
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Kaufanfrage
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      className="flex-1 bg-white/80 hover:bg-white border-gray-300/60 text-foreground hover:text-foreground font-semibold shadow-sm hover:shadow-md transition-all group border-2"
                      asChild
                    >
                      <Link
                        to={(() => {
                          const digits = (vehicle.internalNumber || "").replace(/\D/g, "").slice(0, 3);
                          return digits ? `/fahrzeugankauf?kennnr=${encodeURIComponent(digits.padStart(3, "0"))}` : "/fahrzeugankauf";
                        })()}
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                        Inzahlungnahme
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            <Separator />
            <div className="bg-gray-100/60 border border-gray-300/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Baujahr</div>
                  <div className="font-semibold">{vehicle.year}</div>
                </div>
              </div>
              {vehicle.mileage > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Kilometerstand</div>
                    <div className="font-semibold">{vehicle.mileage.toLocaleString("de-DE")} km</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Kraftstoff</div>
                  <div className="font-semibold">{vehicle.fuel}</div>
                </div>
              </div>
              {vehicle.transmission && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Cog className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Getriebe</div>
                    <div className="font-semibold">{vehicle.transmission}</div>
                  </div>
                </div>
              )}
              {vehicle.power && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Leistung</div>
                    <div className="font-semibold">{vehicle.power} PS</div>
                    {vehicle.powerKw && (
                      <div className="text-xs text-muted-foreground">{vehicle.powerKw} kW</div>
                    )}
                  </div>
                </div>
              )}
              {(vehicle.exteriorColorFull || vehicle.exteriorColor) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Außenfarbe</div>
                    <div className="font-semibold text-sm">{vehicle.exteriorColorFull ?? vehicle.exteriorColor}</div>
                  </div>
                </div>
              )}
              {vehicle.productionSeries && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Baureihe</div>
                    <div className="font-semibold">{vehicle.productionSeries}</div>
                  </div>
                </div>
              )}
              {vehicle.previousOwners !== undefined && vehicle.previousOwners > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Vorbesitzer</div>
                    <div className="font-semibold">{vehicle.previousOwners}</div>
                  </div>
                </div>
              )}
              {vehicle.cubicCapacity && vehicle.cubicCapacity > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Box className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hubraum</div>
                    <div className="font-semibold">{vehicle.cubicCapacity.toLocaleString("de-DE")} cm³</div>
                  </div>
                </div>
              )}
              {vehicle.cylinders && vehicle.cylinders > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Zylinder</div>
                    <div className="font-semibold">{vehicle.cylinders}</div>
                  </div>
                </div>
              )}
              </div>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="default" variant="outline" className="flex-1" onClick={() => window.location.href = "tel:021519422262"}>
                <Phone className="w-4 h-4 mr-2" />
                Jetzt anrufen
              </Button>
              <Button size="default" variant="outline" className="flex-1" onClick={() => window.location.href = "mailto:info@gsauto.de?subject=Anfrage zu " + encodeURIComponent(getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries))}>
                <Mail className="w-4 h-4 mr-2" />
                Nachricht senden
              </Button>
              <Button
                size="default"
                variant="outline"
                className="flex-1"
                onClick={() => setShowExpose(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Exposé PDF
              </Button>
            </div>
          </div>

            {/* Kaufanfrage – unter Schnellinfos */}
            <div id="kaufanfrage" className="mt-6 bg-card border border-border rounded-2xl shadow-sm overflow-hidden scroll-mt-20 shrink-0">
              <div className="bg-[#0f2439] px-6 py-4">
                <h3 className="text-xl font-bold text-white tracking-tight">Kaufanfrage</h3>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Form submitted:", formData);
                }}
                className="p-6 lg:p-8 space-y-4"
              >
                <div>
                  <Label htmlFor="salutation">Anrede *</Label>
                  <Select
                    value={formData.salutation}
                    onValueChange={(value) => setFormData({ ...formData, salutation: value })}
                    required
                  >
                    <SelectTrigger id="salutation">
                      <SelectValue placeholder="Bitte wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herr">Herr</SelectItem>
                      <SelectItem value="Frau">Frau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company">Firma</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="street">Straße *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="houseNumber">Hausnr. *</Label>
                    <Input
                      id="houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">PLZ *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ort *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Geburtsdatum *</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="birthDay" className="text-xs text-muted-foreground">Tag</Label>
                      <Input
                        id="birthDay"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="TT"
                        value={formData.birthDay}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setFormData({ ...formData, birthDay: value });
                        }}
                        onBlur={(e) => {
                          const numValue = parseInt(e.target.value);
                          if (e.target.value && (isNaN(numValue) || numValue < 1 || numValue > 31)) {
                            setFormData({ ...formData, birthDay: '' });
                          }
                        }}
                        required
                        className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthMonth" className="text-xs text-muted-foreground">Monat</Label>
                      <Input
                        id="birthMonth"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="MM"
                        value={formData.birthMonth}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setFormData({ ...formData, birthMonth: value });
                        }}
                        onBlur={(e) => {
                          const numValue = parseInt(e.target.value);
                          if (e.target.value && (isNaN(numValue) || numValue < 1 || numValue > 12)) {
                            setFormData({ ...formData, birthMonth: '' });
                          }
                        }}
                        required
                        className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthYear" className="text-xs text-muted-foreground">Jahr</Label>
                      <Input
                        id="birthYear"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="JJJJ"
                        value={formData.birthYear}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({ ...formData, birthYear: value });
                        }}
                        onBlur={(e) => {
                          const numValue = parseInt(e.target.value);
                          if (e.target.value && (isNaN(numValue) || numValue < 1900 || numValue > new Date().getFullYear())) {
                            setFormData({ ...formData, birthYear: '' });
                          }
                        }}
                        required
                        className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Nachricht</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    placeholder="Ihre Nachricht an uns..."
                  />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) => setFormData({ ...formData, privacyAccepted: checked === true })}
                    required
                  />
                  <Label
                    htmlFor="privacy"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ich habe die{" "}
                    <a href="/datenschutz" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Datenschutzerklärung
                    </a>{" "}
                    gelesen und akzeptiert. *
                  </Label>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                  disabled={!formData.privacyAccepted}
                >
                  Kaufanfrage absenden
                </Button>
              </form>
            </div>

            {/* Kontakt – unter Fahrzeugankauf-Formular */}
            <div className="mt-6 bg-card border border-border rounded-lg shadow-sm overflow-hidden shrink-0">
              <div className="bg-[#0f2439] px-6 py-4">
                <h3 className="text-xl font-bold text-white tracking-tight">Kontakt</h3>
              </div>
              <div className="space-y-4 p-6 pt-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Telefon</div>
                  <a
                    href="tel:021519422262"
                    className="text-foreground font-semibold hover:text-primary transition-colors"
                  >
                    02151 94 222 62
                  </a>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">E-Mail</div>
                  <a
                    href="mailto:info@gsauto.de"
                    className="text-foreground font-semibold hover:text-primary transition-colors"
                  >
                    info@gsauto.de
                  </a>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Öffnungszeiten</div>
                  <div className="text-sm space-y-1">
                    <div>Mo - Fr: 9:00 - 18:00 Uhr</div>
                    <div>Sa: 9:00 - 14:00 Uhr</div>
                    <div>So: Geschlossen</div>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Fahrzeugstandort</div>
                  <div className="text-sm space-y-0.5 text-foreground">
                    <div className="font-medium">GS Automobile Rheinland GmbH</div>
                    <div>Kuhleshütte 149</div>
                    <div>47809 Krefeld</div>
                    <a
                      href="tel:021519422262"
                      className="inline-block mt-2 text-primary font-medium hover:underline"
                    >
                      Tel.: 02151 94 222 62
                    </a>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Kuhlesh%C3%BCtte+149+47809+Krefeld"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-3 py-4 px-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                    title="Standort in Google Maps anzeigen"
                  >
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">Standort in Google Maps anzeigen</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      </main>
      <Footer />
      
      {/* Zoom Dialog – Vollbild auf Desktop und Handy (iOS: -webkit-fill-available für korrekte Höhe) */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent 
          className="inset-0 left-0 top-0 right-0 bottom-0 w-[100vw] max-w-none max-h-none translate-x-0 translate-y-0 rounded-none p-0 bg-black border-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-95 [&>button]:hidden overflow-hidden flex flex-col"
          style={{ height: '100dvh', minHeight: '-webkit-fill-available' } as React.CSSProperties}
        >
          <div className="relative flex-1 min-h-0 flex items-center justify-center p-0 sm:p-6">
            {availableImages.length > 0 && (
              <>
                <img
                  src={availableImages[selectedImageIndex]}
                  alt={vehicle ? `${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)} - Bild ${selectedImageIndex + 1}` : "Fahrzeugbild"}
                  className="w-full sm:w-auto h-auto object-contain sm:max-w-[calc(100vw-3rem)]"
                  style={{ maxHeight: 'calc(100vh - 2rem)' }}
                />
                
                {/* Close Button with ZoomOut Icon */}
                <button
                  onClick={() => setIsZoomed(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center z-10 transition-all"
                  aria-label="Bild verkleinern"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                {/* Navigation Arrows in Zoom View – auf Mobil unauffälliger */}
                {availableImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : availableImages.length - 1))}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/15 hover:bg-black/35 sm:bg-black/50 sm:hover:bg-black/70 text-white/80 sm:text-white flex items-center justify-center z-10 transition-all"
                      aria-label="Vorheriges Bild"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev < availableImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/15 hover:bg-black/35 sm:bg-black/50 sm:hover:bg-black/70 text-white/80 sm:text-white flex items-center justify-center z-10 transition-all"
                      aria-label="Nächstes Bild"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                    
                    {/* Image Counter in Zoom View */}
                    <div className="absolute bottom-4 right-4 bg-black/30 sm:bg-black/50 text-white/90 sm:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm z-10">
                      {selectedImageIndex + 1} / {availableImages.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {vehicle && (
        <ExposeViewerDialog
          open={showExpose}
          onOpenChange={setShowExpose}
          exposeUrl={vehicle.exposeUrl}
          offerUrl={vehicle.offerUrl}
          vehicleId={vehicle.id}
          vehicleName={getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)}
        />
      )}
    </div>
  );
};

export default VehicleDetailPage;
