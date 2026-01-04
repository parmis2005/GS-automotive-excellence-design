import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useVehicle } from "@/hooks/useVehicles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

/**
 * Helper function to build cargate360 image URL
 */
function cargateImage(vid: string, ino: number = 1, format: string = "xlrm"): string {
  return `https://img.cargate360.de/default.aspx?vid=${vid}&bid=1790&format=${format}&ino=${ino}&app=Kiste-Default`;
}

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading, error } = useVehicle(id || "");

  // Generate image URLs - try up to 30 images (cargate360 typically has 10-30 images per vehicle)
  const imageUrls = vehicle ? Array.from({ length: 30 }, (_, i) => 
    cargateImage(vehicle.id, i + 1, "xlrm")
  ) : [];
  
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

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
              <img
                key={selectedImageIndex}
                src={imageUrls[selectedImageIndex] || vehicle.image}
                alt={`${vehicle.brand} ${vehicle.model} - Bild ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide image if it doesn't exist (404)
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {vehicle.isNew && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground z-10">
                  Neu eingetroffen
                </Badge>
              )}
              
              {/* Navigation Arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Vorheriges Bild"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Nächstes Bild"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
                    {selectedImageIndex + 1} / {imageUrls.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery - Show all available images */}
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {imageUrls.map((url, index) => (
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
                      onError={(e) => {
                        // Hide thumbnail if image doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.style.display = 'none';
                      }}
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
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-primary font-semibold uppercase tracking-wider">
                  {vehicle.brand}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                {vehicle.model}
              </h1>
              
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
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
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
