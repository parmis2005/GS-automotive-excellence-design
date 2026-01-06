import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useVehicle } from "@/hooks/useVehicles";
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
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPlaceholderImage } from "@/lib/vehicleImage";
import { splitModelName } from "@/lib/vehicleNameUtils";

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

  // State for available images (only images that actually exist)
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

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
            <Button onClick={() => navigate("/fahrzeuge")} variant="outline">
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
            variant="ghost"
            onClick={() => navigate("/fahrzeuge")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Fahrzeugsuche
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
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
                    alt={`${vehicle.brand} ${vehicle.model} - Bild ${selectedImageIndex + 1}`}
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

            {/* Thumbnail Gallery - Show only available images */}
            {availableImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {availableImages.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-md bg-secondary cursor-pointer transition-all ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:opacity-80 hover:ring-1 ring-border'
                    }`}
                    aria-label={`Bild ${index + 1} auswählen`}
                  >
                    <img
                      src={url}
                      alt={`${vehicle.brand} ${vehicle.model} - Bild ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              {(() => {
                const { base, variant } = splitModelName(vehicle.model);
                return (
                  <div className="mb-2">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                      {vehicle.brand} {base}
                    </h1>
                    {variant && (
                      <p className="text-base text-muted-foreground mt-1">
                        {variant}
                      </p>
                    )}
                  </div>
                );
              })()}
              
              {/* Internal Number */}
              {vehicle.internalNumber && (
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">Interne Nummer: </span>
                  <span className="text-sm font-semibold text-foreground">{vehicle.internalNumber}</span>
                </div>
              )}
              
              {/* Price */}
              <div className="mb-6">
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
            </div>

            <Separator />

            {/* Quick Specs */}
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
                    <Zap className="w-5 h-5 text-primary" />
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

              {vehicle.exteriorColor && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Außenfarbe</div>
                    <div className="font-semibold text-sm">{vehicle.exteriorColor}</div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = "tel:021519422262"}
              >
                <Phone className="w-5 h-5 mr-2" />
                Jetzt anrufen
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = "mailto:info@gsauto.de?subject=Anfrage zu " + encodeURIComponent(vehicle.brand + " " + vehicle.model)}
              >
                <Mail className="w-5 h-5 mr-2" />
                Nachricht senden
              </Button>
              {vehicle.exposeUrl && (
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(vehicle.exposeUrl, '_blank')}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Exposé PDF
                </Button>
              )}
            </div>

            <Separator />

            {/* Purchase Inquiry Form */}
            <div id="kaufanfrage" className="bg-card border border-border rounded-lg p-6 scroll-mt-20">
              <h3 className="text-xl font-bold mb-4">Kaufanfrage</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: Implement form submission
                  console.log("Form submitted:", formData);
                }}
                className="space-y-4"
              >
                {/* Anrede */}
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

                {/* Vorname & Nachname */}
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

                {/* Firma (optional) */}
                <div>
                  <Label htmlFor="company">Firma</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                {/* Straße & Hausnummer */}
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
                    <Label htmlFor="houseNumber">Hausnummer *</Label>
                    <Input
                      id="houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* PLZ & Ort */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="zipCode">PLZ *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="city">Ort *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Email & Telefon */}
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

                {/* Geburtsdatum */}
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
                            // Reset if invalid
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
                            // Reset if invalid
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
                          if (e.target.value && (isNaN(numValue) || numValue < 1925 || numValue > 2026)) {
                            // Reset if invalid
                            setFormData({ ...formData, birthYear: '' });
                          }
                        }}
                        required
                        className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Nachricht */}
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

                {/* Datenschutzerklärung */}
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

                {/* Submit Button */}
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
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equipment List */}
          {vehicle.equipment && vehicle.equipment.length > 0 && (
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Ausstattung</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicle.equipment.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Kontakt</h3>
            <div className="space-y-4">
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
            </div>
          </div>
        </div>

        {/* Description */}
        {vehicle.description && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Beschreibung</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>{vehicle.description}</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default VehicleDetailPage;
