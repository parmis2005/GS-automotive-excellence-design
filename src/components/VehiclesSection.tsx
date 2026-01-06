import VehicleCard from "./VehicleCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, Shield, BadgeCheck } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import type { Vehicle } from "@/types/vehicle";

const VehiclesSection = () => {
  const { data: vehicles, isLoading, error } = useVehicles();

  // Get 6 vehicles in specific order: Sport, Familie, Elektro (top row), SUV, Kleinwagen, Elektro günstigstes (bottom row)
  // Only vehicles with photos, specific selection criteria per category
  const featuredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    // Filter: Only vehicles with photos (image URL exists and is valid)
    const vehiclesWithPhotos = vehicles.filter(v => 
      v.image && 
      v.image.trim() !== '' && 
      !v.image.includes('placeholder') &&
      v.image.startsWith('http')
    );
    
    if (vehiclesWithPhotos.length === 0) return [];
    
    const selectedVehicles: Vehicle[] = [];
    const usedIds = new Set<string>();
    
    // Helper: Check if vehicle is a sedan/limousine (not SUV, not Kombi)
    const isSedan = (vehicle: Vehicle): boolean => {
      const modelLower = vehicle.model.toLowerCase();
      const titleLower = `${vehicle.brand} ${vehicle.model}`.toLowerCase();
      
      // Exclude SUVs
      const suvKeywords = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'q3', 'q5', 'q7', 'q8', 'gle', 'glc', 'gla', 'glb', 'tiguan', 'touareg', 'kuga', 'sportage', 'tucson', 'rav4', 'cr-v', 'suv'];
      if (suvKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw))) {
        return false;
      }
      
      // Exclude Kombis
      const kombiKeywords = ['avant', 'touring', 'kombi', 'estate', 'wagon', 'break'];
      if (kombiKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw))) {
        return false;
      }
      
      // Exclude Vans
      const vanKeywords = ['multivan', 'transporter', 'crafter', 'sprinter', 'vivaro', 'trafic', 'master'];
      if (vanKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw))) {
        return false;
      }
      
      return true;
    };
    
    // Helper: Check if vehicle is a Van
    const isVan = (vehicle: Vehicle): boolean => {
      const modelLower = vehicle.model.toLowerCase();
      const titleLower = `${vehicle.brand} ${vehicle.model}`.toLowerCase();
      const vanKeywords = ['multivan', 'transporter', 'crafter', 'sprinter', 'vivaro', 'trafic', 'master', 't6', 't7', 'vito', 'v-class'];
      return vanKeywords.some(kw => modelLower.includes(kw) || titleLower.includes(kw));
    };
    
    // 1. SPORT: Teuerstes Sport-Auto, muss Limousine sein (kein SUV)
    const sportVehicles = vehiclesWithPhotos.filter(v => {
      if (usedIds.has(v.id)) return false;
      const category = v.category || "";
      const isSportCategory = category === "Sport";
      return isSportCategory && isSedan(v);
    });
    if (sportVehicles.length > 0) {
      const sportVehicle = [...sportVehicles].sort((a, b) => b.price - a.price)[0];
      selectedVehicles.push(sportVehicle);
      usedIds.add(sportVehicle.id);
    }
    
    // 2. FAMILIE: Größtes Auto (Van)
    const familyVehicles = vehiclesWithPhotos.filter(v => {
      if (usedIds.has(v.id)) return false;
      return isVan(v);
    });
    if (familyVehicles.length > 0) {
      // Sort by size indicators: price (higher = bigger), or year (newer = better)
      const familyVehicle = [...familyVehicles].sort((a, b) => {
        // Prefer higher price (usually bigger vehicles)
        if (Math.abs(a.price - b.price) > 5000) {
          return b.price - a.price;
        }
        // If similar price, prefer newer
        return b.year - a.year;
      })[0];
      selectedVehicles.push(familyVehicle);
      usedIds.add(familyVehicle.id);
    }
    
    // 3. ELEKTRO: Neuestes Elektro-Auto mit Foto
    const elektroVehicles = vehiclesWithPhotos.filter(v => {
      if (usedIds.has(v.id)) return false;
      const category = v.category || "";
      return category === "Elektro";
    });
    if (elektroVehicles.length > 0) {
      // Sort by year (newest first), then by arrival date if available
      const elektroVehicle = [...elektroVehicles].sort((a, b) => {
        // First by year (newer = better)
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        // Then by arrival date if available
        if (a.arrivalDate && b.arrivalDate) {
          return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
        }
        if (a.arrivalDate) return -1;
        if (b.arrivalDate) return 1;
        return 0;
      })[0];
      selectedVehicles.push(elektroVehicle);
      usedIds.add(elektroVehicle.id);
    }
    
    // 4. SUV: Teuerstes SUV
    const suvVehicles = vehiclesWithPhotos.filter(v => {
      if (usedIds.has(v.id)) return false;
      const category = v.category || "";
      return category === "SUV";
    });
    if (suvVehicles.length > 0) {
      const suvVehicle = [...suvVehicles].sort((a, b) => b.price - a.price)[0];
      selectedVehicles.push(suvVehicle);
      usedIds.add(suvVehicle.id);
    }
    
    // 5. KLEINWAGEN: Jüngstes EZ (Erstzulassung) - Mini, Fiat, oder andere Kleinwagen
    const kleinwagenVehicles = vehiclesWithPhotos.filter(v => {
      if (usedIds.has(v.id)) return false;
      const category = v.category || "";
      const brandLower = v.brand.toLowerCase();
      const modelLower = v.model.toLowerCase();
      
      // Explicitly include Mini and Fiat as Kleinwagen
      const isMiniOrFiat = brandLower === 'mini' || brandLower === 'fiat';
      
      // Also include vehicles explicitly categorized as Kleinwagen
      const isKleinwagenCategory = category === "Kleinwagen";
      
      return isKleinwagenCategory || isMiniOrFiat;
    });
    if (kleinwagenVehicles.length > 0) {
      // Sort by year (newest EZ first), then by arrival date if available
      const kleinwagenVehicle = [...kleinwagenVehicles].sort((a, b) => {
        // First by year (newest = best)
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        // Then by arrival date if available
        if (a.arrivalDate && b.arrivalDate) {
          return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
        }
        if (a.arrivalDate) return -1;
        if (b.arrivalDate) return 1;
        return 0;
      })[0];
      selectedVehicles.push(kleinwagenVehicle);
      usedIds.add(kleinwagenVehicle.id);
    }
    
    // 6. ELEKTRO (günstigstes): Günstigstes Elektro-Auto mit Foto
    const elektroGuenstigVehicles = vehiclesWithPhotos.filter(v => {
      if (usedIds.has(v.id)) return false;
      const category = v.category || "";
      return category === "Elektro";
    });
    if (elektroGuenstigVehicles.length > 0) {
      // Sort by price (cheapest first)
      const elektroGuenstigVehicle = [...elektroGuenstigVehicles].sort((a, b) => a.price - b.price)[0];
      selectedVehicles.push(elektroGuenstigVehicle);
      usedIds.add(elektroGuenstigVehicle.id);
    }
    
    // Mark vehicles as "new" for display (only if < 30 days based on arrivalDate from cargate)
    return selectedVehicles.map((vehicle) => {
      let isNew = false;
      if (vehicle.arrivalDate) {
        const arrivalDate = new Date(vehicle.arrivalDate);
        const daysSinceArrival = Math.floor((new Date().getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
        isNew = daysSinceArrival < 30; // 30 days based on cargate data
      }
      
      return {
        ...vehicle,
        isNew,
      };
    });
  }, [vehicles]);

  return (
    <section id="vehicles" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-primary mb-4">
            Sofort verfügbare Fahrzeuge
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Geprüfte Gebrauchtwagen – direkt bei uns in Krefeld verfügbar
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Fahrzeuge werden geladen...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler beim Laden der Fahrzeuge</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Unbekannter Fehler"}
            </AlertDescription>
          </Alert>
        )}

        {/* Vehicles Grid - Mobile: 2, Desktop: 3 top, 3 bottom */}
        {featuredVehicles && featuredVehicles.length > 0 && (
          <>
            {/* Mobile: Only show first 2 vehicles */}
            <div className="grid grid-cols-1 md:hidden gap-6 mb-6">
              {featuredVehicles.slice(0, 2).map((vehicle, index) => (
                <div 
                  key={vehicle.id} 
                  className="animate-fade-up h-full"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <VehicleCard {...vehicle} showCategory={true} />
                </div>
              ))}
            </div>
            
            {/* Desktop: Top row: Sport, Familie, Elektro (neuestes) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {featuredVehicles.slice(0, 3).map((vehicle, index) => (
                <div 
                  key={vehicle.id} 
                  className="animate-fade-up h-full"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <VehicleCard {...vehicle} showCategory={true} />
                </div>
              ))}
            </div>
            
            {/* Desktop: Bottom row: SUV, Kleinwagen, Elektro (günstigstes) */}
            {featuredVehicles.length > 3 && (
              <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredVehicles.slice(3, 6).map((vehicle, index) => (
                  <div 
                    key={vehicle.id} 
                    className="animate-fade-up h-full"
                    style={{ animationDelay: `${(index + 3) * 0.1}s` }}
                  >
                    <VehicleCard {...vehicle} showCategory={true} />
                  </div>
                ))}
              </div>
            )}

            {/* Trust Anchor - direkt unter dem Grid */}
            <div className="mt-8 mb-12">
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Geprüfte Fahrzeuge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Transparente Preise</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Sofort verfügbar</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-4">
              <Link to="/fahrzeuge">
                <Button variant="default" size="lg" className="group bg-primary hover:bg-primary/90 text-white shadow-md">
                  Alle Fahrzeuge ansehen
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* Empty State */}
        {featuredVehicles && featuredVehicles.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Aktuell sind keine Fahrzeuge verfügbar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VehiclesSection;
