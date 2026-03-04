import { useEffect, useState, useMemo, useRef } from "react";
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
import { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getPlaceholderImage, getVehicleImageWithFallback } from "@/lib/vehicleImage";
import { ShareVehicleButton } from "@/components/ShareVehicleButton";
import { getBaseModelName, getVehicleDisplayName, groupEquipmentByCategory } from "@/lib/vehicleNameUtils";
import { getVehicleDetailSlug, getVehicleIdFromSlug } from "@/lib/vehicleSlug";
import { VehicleTitle } from "@/components/VehicleTitle";

/**
 * Helper function to build cargate360 image URL
 */
function cargateImage(vid: string, ino: number = 1, format: string = "xl"): string {
  return `https://img.cargate360.de/default.aspx?vid=${vid}&bid=1790&format=${format}&ino=${ino}&app=Kiste-Default`;
}

/** Escape HTML for safe rendering in dangerouslySetInnerHTML */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Prüft, ob eine Zeile eine kommaseparierte Liste ist (mehrere Stichpunkte) */
function isCommaSeparatedList(s: string): boolean {
  if (!s.includes(",")) return false;
  const items = s.split(",").map((x) => x.trim()).filter(Boolean);
  return items.length >= 2;
}

/** CarGate-Beschreibung parsen: Abschnitte, Pakete, Stichpunkte (wie alte Website) */
function formatDescriptionAsHtml(description: string): string {
  const normalized = description
    .replace(/\\\s*$/gm, "")
    .replace(/\\+/g, "\n")
    .replace(/^\s*[*•]\s+/gm, "")
    .trim();
  const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const parts: string[] = [];
  let i = 0;
  const sectionHeaders = /^(Ausstattungspakete|Sonderausstattungen|Weitere Ausstattungen)\s*:?\s*$/i;
  const packageWithItems = /^(.+?):\s*(.+)$/;
  const isIntroLine = (s: string) =>
    /^(bei anfragen|besuchen sie unsere website|besuchen sie unsere seite|gsauto\.de)/i.test(s);

  const isSectionHeader = (s: string) => sectionHeaders.test(s);
  const isPackageLine = (s: string) => {
    const m = s.match(packageWithItems);
    return m && m[2] && !isSectionHeader(m[1].trim());
  };

  const renderCommaListAsBullets = (s: string): string => {
    const items = s.replace(/:\s*$/, "").split(",").map((x) => x.trim()).filter(Boolean);
    return items.map((it) => `<li class="mt-2">${escapeHtml(it)}</li>`).join("");
  };
  const renderParagraph = (s: string) =>
    `<p class="mb-4 leading-relaxed text-muted-foreground">${escapeHtml(s)}</p>`;

  while (i < lines.length) {
    const line = lines[i];
    if (isIntroLine(line)) {
      parts.push(
        `<div class="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">${escapeHtml(line)}</div>`
      );
      i++;
      continue;
    }
    if (isSectionHeader(line)) {
      const title = line.replace(/:?\s*$/, "").trim();
      const isPakete = /Ausstattungspakete/i.test(title);
      parts.push(`<h3 class="text-base font-semibold text-foreground mt-6 mb-3 uppercase tracking-wide">${escapeHtml(title)}</h3>`);
      i++;
      const listItems: string[] = [];
      while (i < lines.length && !isSectionHeader(lines[i])) {
        const ln = lines[i];
        const m = ln.match(packageWithItems);
        if (isPakete && m && m[2].includes(",")) {
          const pkg = m[1].trim();
          const items = m[2].split(",").map((s) => s.trim()).filter(Boolean);
          listItems.push(`<li class="mt-2"><span class="font-semibold text-foreground">${escapeHtml(pkg)}:</span><ul class="list-disc pl-6 mt-1 space-y-0.5 text-muted-foreground">${items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}</ul></li>`);
        } else if (m && m[2]) {
          listItems.push(`<li class="mt-2"><span class="font-semibold text-foreground">${escapeHtml(m[1].trim())}:</span> ${escapeHtml(m[2].trim())}</li>`);
        } else if (isCommaSeparatedList(ln)) {
          listItems.push(`<ul class="list-disc pl-5 text-muted-foreground">${renderCommaListAsBullets(ln)}</ul>`);
        } else if (/^[A-ZÄÖÜ0-9][A-Za-zÄÖÜäöüß0-9\s\-–—()]+$/.test(ln) && ln.length < 80) {
          listItems.push(`<li class="mt-2"><span class="font-semibold text-foreground">${escapeHtml(ln)}</span></li>`);
        } else {
          listItems.push(`<li class="mt-2 text-muted-foreground">${escapeHtml(ln)}</li>`);
        }
        i++;
      }
      if (listItems.length > 0) {
        parts.push(`<ul class="list-disc pl-6 space-y-1 text-sm leading-relaxed text-muted-foreground [&_ul]:list-[circle]">${listItems.join("")}</ul>`);
      }
      continue;
    }
    if (isPackageLine(line)) {
      const m = line.match(packageWithItems)!;
      if (m[2].includes(",")) {
        const pkg = m[1].trim();
        const items = m[2].split(",").map((s) => s.trim()).filter(Boolean);
        parts.push(`<p class="mb-2"><span class="font-semibold text-foreground">${escapeHtml(pkg)}:</span></p>`);
        parts.push(`<ul class="list-disc pl-6 space-y-0.5 text-sm mb-4 text-muted-foreground">${items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}</ul>`);
      } else {
        parts.push(`<p class="mb-4 leading-relaxed"><span class="font-semibold text-foreground">${escapeHtml(m[1].trim())}:</span> ${escapeHtml(m[2].trim())}</p>`);
      }
    } else if (isCommaSeparatedList(line)) {
      parts.push(`<ul class="list-disc pl-6 space-y-0.5 text-sm mb-4 text-muted-foreground">${renderCommaListAsBullets(line)}</ul>`);
    } else {
      parts.push(renderParagraph(line));
    }
    i++;
  }
  return parts.join("");
}

const VehicleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const vehicleId = getVehicleIdFromSlug(slug || "");
  const navigate = useNavigate();
  const location = useLocation();
  const { data: vehicle, isLoading, error } = useVehicle(vehicleId);
  const { data: allVehicles } = useVehicles();

  // State for available images (only images that actually exist)
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const mobileCarouselApiRef = useRef<CarouselApi | null>(null);
  const mobileCarouselOffRef = useRef<(() => void) | null>(null);
  const selectedImageIndexRef = useRef(0);
  const lastWheelScrollTimeRef = useRef(0);
  selectedImageIndexRef.current = selectedImageIndex;

  // Reset image index when vehicle ID changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setIsZoomed(false);
  }, [vehicleId]);

  // Mobile Carousel: Listener-Cleanup beim Unmount
  useEffect(() => {
    return () => {
      mobileCarouselOffRef.current?.();
    };
  }, []);

  // Thumbnail-Klick: Carousel auf gewählten Slide scrollen (nur wenn Index vom Carousel abweicht, also Nutzeraktion)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
    const api = mobileCarouselApiRef.current;
    if (!api || availableImages.length <= 1) return;
    if (api.selectedScrollSnap() !== selectedImageIndex) api.scrollTo(selectedImageIndex);
  }, [selectedImageIndex, availableImages.length]);

  // Bei Fenster-Resize (z. B. Desktop-Fenster verkleinert → mobile Ansicht): Carousel neu initialisieren, damit Scroll/Drag wieder funktioniert
  useEffect(() => {
    const api = mobileCarouselApiRef.current;
    if (!api || availableImages.length <= 1) return;
    const onResize = () => {
      if (window.innerWidth < 1024) {
        api.reInit();
        api.scrollTo(selectedImageIndexRef.current, true);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [availableImages.length]);

  // Thumbnail-Streifen so scrollen, dass das gewählte Thumbnail sichtbar ist (w-20 = 80px, gap-2 = 8px)
  useEffect(() => {
    const strip = thumbnailStripRef.current;
    if (!strip || availableImages.length <= 1) return;
    const thumbWidth = 80;
    const gap = 8;
    const scrollLeft = selectedImageIndex * (thumbWidth + gap) - strip.offsetWidth / 2 + (thumbWidth + gap) / 2;
    strip.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
  }, [selectedImageIndex, availableImages.length]);

  // Canonical URL: Redirect to slug format if user opened /fahrzeuge/123 (old link)
  useEffect(() => {
    if (!vehicle || !slug) return;
    const canonicalSlug = getVehicleDetailSlug(vehicle.id, vehicle.brand, vehicle.model);
    if (slug !== canonicalSlug) {
      navigate(`/fahrzeuge/${canonicalSlug}${location.hash || ""}`, { replace: true });
    }
  }, [vehicle, slug, navigate, location.hash]);

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
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Check which images actually exist (only if vehicle has a valid image already)
  useEffect(() => {
    if (!vehicle) {
      setAvailableImages([]);
      setIsLoadingImages(false);
      return;
    }

    let cancelled = false;
    setAvailableImages([]);
    setIsLoadingImages(true);

    // Check up to 30 images, but only add ones that exist
    // Use image loading approach instead of HEAD requests to avoid CORS issues
    // IMPORTANT: All images (including the first one) use the same "xl" format for consistent quality
    // This ensures the first image is not a thumbnail/small format that gets upscaled and looks blurry
    const checkImages = async () => {
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
          
          if (cancelled) return;
          if (imageExists) {
            validImages.push(url);
            setAvailableImages([...validImages]);
            setIsLoadingImages(false);
            consecutiveFailures = 0; // Reset counter on success
          } else {
            consecutiveFailures++;
          }
        } catch (e) {
          consecutiveFailures++;
        }
      }

      if (!cancelled) {
        setIsLoadingImages(false);
      }
    };

    checkImages();

    return () => {
      cancelled = true;
    };
  }, [vehicle]);

  useEffect(() => {
    if (availableImages.length <= 1) return;
    const prefetchTargets = availableImages.slice(1, Math.min(availableImages.length, 4));
    prefetchTargets.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  }, [availableImages]);

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

  const seoData = getVehicleSEO(
    vehicle.brand,
    vehicle.model,
    vehicle.year,
    vehicle.price,
    vehicle.mileage,
    vehicle.image,
    vehicle.id,
    { power: vehicle.power, powerKw: vehicle.powerKw, fuel: vehicle.fuel }
  );
  const vehicleSchema = generateVehicleSchema(
    vehicle.brand,
    vehicle.model,
    vehicle.year,
    vehicle.price,
    vehicle.mileage,
    vehicle.fuel,
    vehicle.image,
    vehicle.id,
    `${vehicle.brand} ${vehicle.model} ${vehicle.year}, ${vehicle.mileage.toLocaleString("de-DE")} km, ${vehicle.fuel} – Gebrauchtwagen bei GS Automobile Rheinland in Krefeld`
  );
  const breadcrumbs = [
    { name: "Startseite", url: "/" },
    { name: "Fahrzeugsuche", url: "/fahrzeuge" },
    { name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`, url: `/fahrzeuge/${getVehicleDetailSlug(vehicle.id, vehicle.brand, vehicle.model)}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} structuredData={vehicleSchema} breadcrumbs={breadcrumbs} />
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
                  {/* Mobile: Embla-Carousel mit Loop (wie Ähnliche Fahrzeuge), flüssiger Endlos-Übergang */}
                  <Carousel
                    opts={{ align: "start", slidesToScroll: 1, loop: true }}
                    setApi={(api) => {
                      mobileCarouselOffRef.current?.();
                      mobileCarouselApiRef.current = api;
                      if (!api || availableImages.length === 0) return;
                      const onSelect = () => setSelectedImageIndex(api.selectedScrollSnap());
                      api.on("select", onSelect);
                      mobileCarouselOffRef.current = () => api.off("select", onSelect);
                    }}
                    className="lg:hidden absolute inset-0 w-full h-full touch-pan-x select-none [&_.overflow-hidden]:h-full [&_.overflow-hidden]:pointer-events-auto [&_.overflow-hidden]:cursor-grab [&_.overflow-hidden]:active:cursor-grabbing"
                  >
                    <CarouselContent className="-ml-0 h-full min-h-0 pointer-events-none">
                      {availableImages.map((url, index) => (
                        <CarouselItem key={index} className="pl-0 basis-full h-full pointer-events-none">
                          <div
                            className="relative w-full h-full select-none pointer-events-none"
                            aria-hidden
                          >
                            <img
                              src={url}
                              alt={`${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)} - Bild ${index + 1}`}
                              className="w-full h-full object-cover pointer-events-none"
                              loading={index === 0 ? "eager" : "lazy"}
                              fetchPriority={index === 0 ? "high" : "auto"}
                              decoding="async"
                              style={{ imageRendering: "auto" }}
                              draggable={false}
                            />
                            {index === 0 && (() => {
                              if (vehicle.arrivalDate) {
                                try {
                                  const arrival = new Date(vehicle.arrivalDate);
                                  if (!isNaN(arrival.getTime())) {
                                    const daysSinceArrival = Math.floor((new Date().getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
                                    if (daysSinceArrival >= 0 && daysSinceArrival < 30) {
                                      return (
                                        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground z-10 pointer-events-none">
                                          Neu eingetroffen
                                        </Badge>
                                      );
                                    }
                                  }
                                } catch {
                                  /* fallback */
                                }
                              }
                              const currentYear = new Date().getFullYear();
                              const isVeryNewYear = vehicle.year >= currentYear - 1;
                              const isLowMileage = vehicle.mileage < 5000;
                              const isVeryLowMileage = vehicle.mileage < 1000;
                              if ((isVeryNewYear && isLowMileage) || isVeryLowMileage) {
                                return (
                                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground z-10 pointer-events-none">
                                    Neu eingetroffen
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>

                  {/* Overlay: Nur bei Maus (hover) – Mausrad = Bild wechseln, Klick = Vergrößern; bei Touch durchlässig für Finger-Scroll */}
                  {availableImages.length > 1 && (
                    <div
                      className="lg:hidden absolute inset-0 z-10 pointer-events-none [@media(hover:hover)]:pointer-events-auto [@media(hover:hover)]:cursor-pointer"
                      onClick={() => setIsZoomed(true)}
                      onWheel={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const now = Date.now();
                        if (now - lastWheelScrollTimeRef.current < 1200) return;
                        const api = mobileCarouselApiRef.current;
                        if (!api || availableImages.length <= 1) return;
                        const dx = e.deltaX;
                        const dy = e.deltaY;
                        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
                        lastWheelScrollTimeRef.current = now;
                        if (Math.abs(dx) >= Math.abs(dy)) {
                          if (dx > 0) api.scrollNext();
                          else api.scrollPrev();
                        } else {
                          if (dy > 0) api.scrollNext();
                          else api.scrollPrev();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Bild vergrößern (klicken), Mausrad zum Wechseln"
                      onKeyDown={(ev) => ev.key === "Enter" && setIsZoomed(true)}
                    />
                  )}

                  {/* Mobile: Pfeile nutzen Carousel-API für flüssigen Loop; Zoom-Button */}
                  {availableImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center z-20 transition-opacity touch-manipulation"
                        style={{ touchAction: "manipulation" }}
                        onClick={() => mobileCarouselApiRef.current?.scrollPrev()}
                        aria-label="Vorheriges Bild"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center z-20 transition-opacity touch-manipulation"
                        style={{ touchAction: "manipulation" }}
                        onClick={() => mobileCarouselApiRef.current?.scrollNext()}
                        aria-label="Nächstes Bild"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="lg:hidden absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-20 pointer-events-none">
                        {selectedImageIndex + 1} / {availableImages.length}
                      </div>
                      <button
                        type="button"
                        className="lg:hidden absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center z-20 transition-all touch-manipulation"
                        style={{ touchAction: "manipulation" }}
                        onClick={() => setIsZoomed(true)}
                        aria-label="Bild vergrößern"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Desktop: single image + arrows + zoom (z-10 so buttons are above mobile gallery in stacking order) */}
                  <div className="hidden lg:block absolute inset-0 z-10">
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
                    {(() => {
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
                          /* fallback */
                        }
                      }
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
                    {availableImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : availableImages.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center z-10 transition-opacity"
                          aria-label="Vorheriges Bild"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev < availableImages.length - 1 ? prev + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center z-10 transition-opacity"
                          aria-label="Nächstes Bild"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
                          {selectedImageIndex + 1} / {availableImages.length}
                        </div>
                        <button
                          onClick={() => setIsZoomed(true)}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center z-10 transition-all"
                          aria-label="Bild vergrößern"
                        >
                          <ZoomIn className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
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

              {/* Thumbnail Gallery - scrollbar immer, alle Thumbnails anklickbar (z-30 damit auf Mobil nichts darüber liegt) */}
              {availableImages.length > 1 && (
                <div className="relative z-30 flex items-center gap-2 isolate">
                  <button
                    type="button"
                    onClick={() => thumbnailStripRef.current?.scrollBy({ left: -120, behavior: "smooth" })}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-opacity touch-manipulation"
                    style={{ touchAction: "manipulation" }}
                    aria-label="Thumbnails nach links scrollen"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div
                    ref={thumbnailStripRef}
                    className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth py-1 flex-1 min-w-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-200/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 touch-pan-x"
                  >
                    {availableImages.map((url, globalIndex) => (
                      <button
                        key={globalIndex}
                        type="button"
                        className={`relative aspect-square w-20 h-20 overflow-hidden rounded-md bg-secondary cursor-pointer transition-all flex-shrink-0 select-none touch-manipulation ${
                          selectedImageIndex === globalIndex
                            ? "ring-2 ring-primary ring-offset-2"
                            : "hover:opacity-80 hover:ring-1 ring-border"
                        }`}
                        style={{ touchAction: "manipulation" }}
                        onClick={() => setSelectedImageIndex(globalIndex)}
                        aria-label={`Bild ${globalIndex + 1} auswählen`}
                        aria-pressed={selectedImageIndex === globalIndex}
                      >
                        <img
                          src={url}
                          alt={`${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)} - Bild ${globalIndex + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                          loading={globalIndex === 0 ? "eager" : "lazy"}
                          decoding="async"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => thumbnailStripRef.current?.scrollBy({ left: 120, behavior: "smooth" })}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-opacity touch-manipulation"
                    style={{ touchAction: "manipulation" }}
                    aria-label="Thumbnails nach rechts scrollen"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
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
                            <Link to={`/fahrzeuge/${getVehicleDetailSlug(similarVehicle.id, similarVehicle.brand, similarVehicle.model)}`}>
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
              <ShareVehicleButton
                vehicleUrl={`/fahrzeuge/${getVehicleDetailSlug(vehicle.id, vehicle.brand, vehicle.model)}`}
                label="Teilen"
                variant="outline"
                size="default"
                className="flex-1"
              />
            </div>
          </div>

            {/* Kaufanfrage – unter Schnellinfos */}
            <div id="kaufanfrage" className="mt-6 bg-card border border-border rounded-2xl shadow-sm overflow-hidden scroll-mt-20 shrink-0">
              <div className="bg-[#0f2439] px-6 py-4">
                <h3 className="text-xl font-bold text-white tracking-tight">Kaufanfrage</h3>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setInquiryError("");
                  setInquirySuccess(false);

                  if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
                    setInquiryError("Bitte Vorname, Nachname und E-Mail ausfüllen.");
                    return;
                  }

                  try {
                    setIsSubmittingInquiry(true);
                    const vehicleLabel = vehicle
                      ? `${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)} (${vehicle.id})`
                      : "";
                    const response = await fetch("/api/inquiries", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: "Kaufanfrage",
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: formData.phone,
                        subject: "Kaufanfrage",
                        message: formData.message,
                        vehicle: vehicleLabel,
                        page: vehicle ? `Fahrzeugdetail ${vehicle.id}` : "Fahrzeugdetail",
                      }),
                    });
                    if (!response.ok) {
                      throw new Error("Request failed");
                    }
                    setInquirySuccess(true);
                    navigate("/kontakt-erfolgreich", { replace: true });
                  } catch {
                    setInquiryError("Senden fehlgeschlagen. Bitte erneut versuchen.");
                  } finally {
                    setIsSubmittingInquiry(false);
                  }
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
                  disabled={!formData.privacyAccepted || isSubmittingInquiry}
                >
                  {isSubmittingInquiry ? "Sende..." : "Kaufanfrage absenden"}
                </Button>
                {inquiryError && (
                  <p className="text-sm text-destructive">{inquiryError}</p>
                )}
                {inquirySuccess && (
                  <p className="text-sm text-emerald-600">Vielen Dank! Wir melden uns zeitnah.</p>
                )}
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

        {/* Fahrzeugbeschreibung – Freie Gestaltung (Custom Description) von CarGate GetVehicle */}
        {(vehicle.description && vehicle.description.trim()) && (
          <section className="mt-12 lg:mt-16">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-[#0f2439] px-6 py-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Fahrzeugbeschreibung</h2>
              </div>
              <div className="p-6 md:p-8 text-foreground">
                <div
                  className="max-w-none [&_h3]:first:mt-0 [&_ul]:marker:text-primary/60 [&_a]:text-primary [&_a]:hover:underline"
                  dangerouslySetInnerHTML={{ __html: formatDescriptionAsHtml(vehicle.description) }}
                />
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer />
      
      {/* Zoom Dialog – Vollbild auf Desktop und Handy (iOS: -webkit-fill-available für korrekte Höhe) */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent 
          className="inset-0 left-0 top-0 right-0 bottom-0 w-[100vw] max-w-none max-h-none translate-x-0 translate-y-0 rounded-none p-0 bg-black border-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-95 [&>button]:hidden overflow-hidden flex flex-col"
          style={{ height: '100dvh', minHeight: '-webkit-fill-available' } as React.CSSProperties}
        >
          <div
            className="relative flex-1 min-h-0 flex items-center justify-center p-0 sm:p-6"
            onWheel={(e) => {
              if (availableImages.length <= 1) return;
              e.preventDefault();
              e.stopPropagation();
              const now = Date.now();
              if (now - lastWheelScrollTimeRef.current < 1200) return;
              const dx = e.deltaX;
              const dy = e.deltaY;
              if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
              lastWheelScrollTimeRef.current = now;
              const n = availableImages.length;
              if (Math.abs(dx) >= Math.abs(dy)) {
                if (dx > 0) setSelectedImageIndex((i) => (i < n - 1 ? i + 1 : 0));
                else setSelectedImageIndex((i) => (i > 0 ? i - 1 : n - 1));
              } else {
                if (dy > 0) setSelectedImageIndex((i) => (i < n - 1 ? i + 1 : 0));
                else setSelectedImageIndex((i) => (i > 0 ? i - 1 : n - 1));
              }
            }}
          >
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

    </div>
  );
};

export default VehicleDetailPage;
