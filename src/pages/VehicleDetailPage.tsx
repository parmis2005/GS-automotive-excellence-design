import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useVehicle, useVehicles } from "@/hooks/useVehicles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getVehicleSEO, generateVehicleSchema } from "@/utils/seo";
import { formatPrice } from "@/lib/utils";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SantanderKreditWidget from "@/components/SantanderKreditWidget";
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

/** Figur = Text inkl. €; Block = Preis-Spalte — max(rechts) für Santander-Sync. */
const VDP_SANTANDER_TEASER_CLEAR_IDS = ["vehicle-price-figure", "vehicle-price-block"];

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
  const [isSmUp, setIsSmUp] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 640px)").matches : true,
  );
  const [isLgUp, setIsLgUp] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true,
  );
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const mobileCarouselApiRef = useRef<CarouselApi | null>(null);
  const mobileCarouselOffRef = useRef<(() => void) | null>(null);
  const selectedImageIndexRef = useRef(0);
  const lastWheelScrollTimeRef = useRef(0);
  const zoomTouchStartXRef = useRef<number | null>(null);
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

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const update = () => setIsSmUp(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLgUp(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
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

  const [isKaufanfrageOpen, setIsKaufanfrageOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
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

  useEffect(() => {
    if (location.hash === "#kaufanfrage" && !isLoading && vehicle) {
      setIsKaufanfrageOpen(true);
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

        {/* Zwei Spalten: links Galerie & ähnliche Fahrzeuge; rechts Preis & Infos. Ausstattung und Kontakt darunter volle Breite. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Left Column - Images, Similar */}
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
                                    {formatPrice(similarVehicle.price)} €
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
          </div>

          {/* Right Column - Preis, Schnellinfos, CTAs */}
          <div className="flex flex-col gap-6 min-h-0 overflow-visible">
            {/* Premium Box - Header, Price, Quick Specs, CTA Buttons */}
            <div id="vehicle-detail-card" className="bg-gray-50/50 border border-gray-200/60 rounded-lg p-6 md:p-8 space-y-6 overflow-visible">
              <div>
              <div className="mb-2 relative">
                <div id="vehicle-title-block" className="min-w-0 max-w-full">
                  {(() => (
                    <VehicleTitle
                      brand={vehicle.brand}
                      model={vehicle.model}
                      productionSeries={vehicle.productionSeries}
                      modelVariant={vehicle.modelVariant}
                      fallbackTitle={vehicle.brand + " " + vehicle.model}
                      className="text-3xl md:text-4xl font-display font-bold text-foreground break-words"
                      variantClassName="text-sm font-normal text-muted-foreground tracking-wide break-words [overflow-wrap:anywhere]"
                      as="h1"
                    />
                  ))()}
                </div>
              </div>
              {vehicle.internalNumber && (
                <div id="vehicle-kennzeichen" className="mb-4">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium">
                    Kennnr. {vehicle.internalNumber}
                  </Badge>
                </div>
              )}
              <div className="mb-0">
                <div className="flex flex-col gap-0">
                  {/* Zwei Spalten auch mobil: Preis links, Santander rechts — keine extra Vollbreiten-Zeile darunter. */}
                  <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0 sm:gap-x-5 lg:items-start lg:gap-x-6">
                    <div id="vehicle-price-block" className="min-w-0 self-start flex flex-col gap-0.5 lg:gap-1">
                      <span className="block text-sm text-muted-foreground leading-tight">Preis</span>
                      <div
                        id="vehicle-price-figure"
                        className="inline-block max-w-full pr-2 sm:pr-6 text-3xl font-display font-bold text-primary whitespace-nowrap leading-none sm:text-4xl lg:pr-8"
                      >
                        {formatPrice(vehicle.price)} €
                      </div>
                      {vehicle.vatDisplayable !== undefined && (
                        <div className="text-sm text-muted-foreground leading-tight">
                          {vehicle.vatDisplayable ? "MwSt. ausweisbar" : "MwSt. nicht ausweisbar"}
                        </div>
                      )}
                    </div>
                    <div className="pointer-events-auto min-w-0 w-full max-w-full justify-self-stretch self-center lg:self-start">
                      <div className={isLgUp ? "flex h-[96px] w-full min-h-[72px] min-w-[280px] max-w-[560px] items-stretch lg:min-w-[300px]" : "flex min-h-[48px] h-auto w-full max-w-full min-w-0 items-stretch"}>
                        <SantanderKreditWidget
                          key={`santander-${vehicle.id}`}
                          vehicle={vehicle}
                          mobileInlineButton={!isLgUp}
                          teaserRightOfElementIds={VDP_SANTANDER_TEASER_CLEAR_IDS}
                          teaserRightOfGapPx={12}
                          teaserRightExtraBufferPx={8}
                          teaserClampRightToElementId="vehicle-detail-card"
                          teaserMaxWidthPx={560}
                        />
                      </div>
                    </div>
                  </div>
                  <div id="vehicle-cta-row" className="mt-3 lg:mt-1 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <Button
                      size="default"
                      className="w-full sm:flex-1 sm:min-w-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all group"
                      onClick={() => setIsKaufanfrageOpen(true)}
                    >
                      <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Kaufanfrage
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      className="w-full sm:flex-1 sm:min-w-0 bg-white/80 hover:bg-white border-gray-300/60 text-foreground hover:text-foreground font-semibold shadow-sm hover:shadow-md transition-all group border-2"
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
          </div>
        </div>

        {/* Ausstattung – volle Breite, Titelzeile wie Fahrzeugbeschreibung */}
        {vehicle.equipment && vehicle.equipment.length > 0 ? (
          <section className="mt-10 lg:mt-14" aria-labelledby="vehicle-equipment-heading">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-[#0f2439] px-6 py-4">
                <h2 id="vehicle-equipment-heading" className="text-xl font-bold text-white tracking-tight">
                  Ausstattung
                </h2>
              </div>
              <div className="p-6 md:p-8 text-foreground">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 text-sm text-muted-foreground">
                  <p>Serien- und Sonderausstattung nach Kategorie</p>
                  <div className="flex items-center gap-2 text-primary shrink-0 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                    <span>{vehicle.equipment.length} Positionen</span>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {(() => {
                    const grouped = groupEquipmentByCategory(vehicle.equipment);
                    const categoryLabels: Record<string, string> = {
                      Komfort: "Komfort",
                      Sicherheit: "Sicherheit",
                      Multimedia: "Multimedia",
                      "Licht & Sicht": "Licht & Sicht",
                      Außen: "Außen",
                      Innenausstattung: "Innenausstattung",
                      "Fahrwerk & Antrieb": "Fahrwerk & Antrieb",
                      Sonstiges: "Weitere Ausstattung",
                    };
                    const categoryIcons: Record<string, React.ReactNode> = {
                      Komfort: <Armchair className="w-4 h-4 text-primary" />,
                      Sicherheit: <Shield className="w-4 h-4 text-primary" />,
                      Multimedia: <Radio className="w-4 h-4 text-primary" />,
                      "Licht & Sicht": <Sun className="w-4 h-4 text-primary" />,
                      Außen: <Car className="w-4 h-4 text-primary" />,
                      Innenausstattung: <Sofa className="w-4 h-4 text-primary" />,
                      "Fahrwerk & Antrieb": <Settings className="w-4 h-4 text-primary" />,
                      Sonstiges: <Sparkles className="w-4 h-4 text-primary" />,
                    };
                    return Array.from(grouped.entries()).map(([category, items]) => {
                      if (items.length === 0) return null;
                      return (
                        <section
                          key={category}
                          className="rounded-xl bg-background/90 p-4 min-w-0 ring-1 ring-border/70 shadow-sm"
                        >
                          <h3 className="text-[11px] font-bold text-foreground uppercase tracking-[0.14em] mb-3 flex items-center gap-2 border-b border-border/60 pb-2">
                            {categoryIcons[category]}
                            {categoryLabels[category] ?? category}
                          </h3>
                          <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
                            {items.map((item, idx) => (
                              <li key={idx}>
                                <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1.5 text-[11px] sm:text-xs text-foreground/90 leading-snug border border-transparent hover:border-border/80 transition-colors">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-10 lg:mt-14">
            <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-8 flex items-center justify-center text-sm text-muted-foreground">
              Keine Ausstattungsdaten vorhanden
            </div>
          </section>
        )}

        {/* Kontakt – volle Breite, Primary-Banner + weiche Karten (unterscheidet sich von Ausstattung) */}
        <section className="mt-10 lg:mt-12" aria-labelledby="vehicle-contact-heading">
          <div className="rounded-3xl overflow-hidden border border-primary/20 shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.25)] ring-1 ring-primary/10 bg-card">
            <div className="bg-gradient-to-r from-primary to-primary/90 px-5 py-5 md:px-8 md:py-6 text-primary-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                    <Phone className="w-5 h-5" aria-hidden />
                  </span>
                  <div>
                    <h2 id="vehicle-contact-heading" className="font-display text-xl md:text-2xl font-bold tracking-tight">
                      Kontakt & Anfahrt
                    </h2>
                    <p className="mt-0.5 text-sm text-primary-foreground/85 max-w-xl">
                      Wir freuen uns auf Ihre Nachricht — telefonisch, per E-Mail oder vor Ort in Krefeld.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 bg-gradient-to-b from-primary/5 to-background">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                <div className="rounded-2xl border border-primary/15 bg-background p-5 min-w-0 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                    Direktkontakt
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Telefon</div>
                      <a
                        href="tel:021519422262"
                        className="text-lg font-bold text-primary hover:underline underline-offset-2"
                      >
                        02151 94 222 62
                      </a>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">E-Mail</div>
                      <a
                        href="mailto:info@gsauto.de"
                        className="font-semibold text-foreground hover:text-primary transition-colors break-all"
                      >
                        info@gsauto.de
                      </a>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/15 bg-background p-5 min-w-0 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                    Öffnungszeiten
                  </h3>
                  <ul className="text-sm space-y-2.5 text-foreground list-none p-0 m-0">
                    <li className="flex justify-between gap-4 border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Mo – Fr</span>
                      <span className="font-medium tabular-nums">10:00 – 17:30</span>
                    </li>
                    <li className="flex justify-between gap-4 border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Samstag</span>
                      <span className="font-medium tabular-nums">10:00 – 13:00</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Sonntag</span>
                      <span className="font-medium">Geschlossen</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-primary/15 bg-background p-5 min-w-0 shadow-sm md:col-span-2 lg:col-span-1">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    Fahrzeugstandort
                  </h3>
                  <div className="text-sm space-y-1 text-foreground mb-4">
                    <div className="font-semibold">GS Automobile Rheinland GmbH</div>
                    <div className="text-muted-foreground">Kuhleshütte 149 · 47809 Krefeld</div>
                    <a
                      href="tel:021519422262"
                      className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
                    >
                      Tel.: 02151 94 222 62
                    </a>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Kuhlesh%C3%BCtte+149+47809+Krefeld"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-colors group"
                    title="Standort in Google Maps anzeigen"
                  >
                    <MapPin className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="text-center">Route in Google Maps</span>
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

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

      <Dialog
        open={isKaufanfrageOpen && !!vehicle}
        onOpenChange={(open) => {
          setIsKaufanfrageOpen(open);
          if (!open) {
            setInquiryError("");
            setInquirySuccess(false);
            setFormData({
              firstName: "",
              lastName: "",
              company: "",
              email: "",
              phone: "",
              message: "",
              privacyAccepted: false,
            });
            if (location.hash === "#kaufanfrage") {
              navigate({ pathname: location.pathname, search: location.search, hash: "" }, { replace: true });
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] p-6 sm:p-8 gap-5 border border-border/60 shadow-xl bg-background/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Kaufanfrage</DialogTitle>
            <DialogDescription>
              {vehicle
                ? `${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)}${vehicle.internalNumber ? ` · Kennnr. ${vehicle.internalNumber}` : ""}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {vehicle && (
            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setInquiryError("");
                setInquirySuccess(false);

                if (
                  !formData.firstName.trim() ||
                  !formData.lastName.trim() ||
                  !formData.email.trim() ||
                  !formData.phone.trim()
                ) {
                  setInquiryError("Bitte Vorname, Nachname, E-Mail und Telefon ausfüllen.");
                  return;
                }

                try {
                  setIsSubmittingInquiry(true);
                  const vehicleLabel = `${getVehicleDisplayName(vehicle.brand, vehicle.model, vehicle.productionSeries)}${vehicle.internalNumber ? ` (Kennnr. ${vehicle.internalNumber})` : ` (${vehicle.id})`}`;
                  const response = await fetch("/api/inquiries", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: "Kaufanfrage",
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      company: formData.company.trim() || undefined,
                      email: formData.email,
                      phone: formData.phone,
                      subject: "Kaufanfrage",
                      message: formData.message,
                      vehicle: vehicleLabel,
                      page: vehicle.internalNumber
                        ? `Fahrzeugdetail Kennnr. ${vehicle.internalNumber}`
                        : `Fahrzeugdetail ${vehicle.id}`,
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
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vdp-inq-firstName">Vorname *</Label>
                  <Input
                    id="vdp-inq-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <Label htmlFor="vdp-inq-lastName">Nachname *</Label>
                  <Input
                    id="vdp-inq-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="vdp-inq-company">Firma</Label>
                <Input
                  id="vdp-inq-company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  autoComplete="organization"
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="vdp-inq-email">E-Mail *</Label>
                <Input
                  id="vdp-inq-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="vdp-inq-phone">Telefon *</Label>
                <Input
                  id="vdp-inq-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  autoComplete="tel"
                />
              </div>
              <div>
                <Label htmlFor="vdp-inq-message">Nachricht</Label>
                <Textarea
                  id="vdp-inq-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="Ihre Fragen oder Wünsche zum Fahrzeug…"
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="vdp-inq-privacy"
                  checked={formData.privacyAccepted}
                  onCheckedChange={(checked) => setFormData({ ...formData, privacyAccepted: checked === true })}
                  required
                />
                <Label htmlFor="vdp-inq-privacy" className="text-sm leading-snug font-normal">
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
                className="w-full font-semibold"
                disabled={!formData.privacyAccepted || isSubmittingInquiry}
              >
                {isSubmittingInquiry ? "Sende…" : "Kaufanfrage absenden"}
              </Button>
              {inquiryError && <p className="text-sm text-destructive">{inquiryError}</p>}
              {inquirySuccess && <p className="text-sm text-emerald-600">Vielen Dank! Wir melden uns zeitnah.</p>}
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />

      {/* Zoom Dialog – Vollbild auf Desktop und Handy (iOS: -webkit-fill-available für korrekte Höhe) */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent 
          className="inset-0 left-0 top-0 right-0 bottom-0 w-[100vw] max-w-none max-h-none translate-x-0 translate-y-0 rounded-none p-0 bg-black border-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-95 [&>button]:hidden overflow-hidden flex flex-col"
          style={{ height: '100dvh', minHeight: '-webkit-fill-available' } as React.CSSProperties}
        >
          <div
            className="relative flex-1 min-h-0 flex items-center justify-center p-0 sm:p-6 touch-pan-y"
            onTouchStart={(e) => {
              if (availableImages.length <= 1) return;
              zoomTouchStartXRef.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (availableImages.length <= 1 || zoomTouchStartXRef.current === null) return;
              const now = Date.now();
              if (now - lastWheelScrollTimeRef.current < 1200) return;
              const endX = e.changedTouches[0].clientX;
              const startX = zoomTouchStartXRef.current;
              zoomTouchStartXRef.current = null;
              const deltaX = endX - startX;
              const minSwipe = 50;
              if (Math.abs(deltaX) < minSwipe) return;
              lastWheelScrollTimeRef.current = now;
              const n = availableImages.length;
              if (deltaX < 0) setSelectedImageIndex((i) => (i < n - 1 ? i + 1 : 0));
              else setSelectedImageIndex((i) => (i > 0 ? i - 1 : n - 1));
            }}
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
