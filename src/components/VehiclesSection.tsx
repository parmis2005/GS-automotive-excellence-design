import VehicleCard from "./VehicleCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, Shield, BadgeCheck, Search } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import type { Vehicle } from "@/types/vehicle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBaseModelName, groupModelsBySeries } from "@/lib/vehicleNameUtils";

const VehiclesSection = () => {
  const { data: vehicles, isLoading, error } = useVehicles();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  // Quick search state
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  
  // Calculate available price options based on actual vehicle prices
  // Only show prices that are at least as high as the cheapest vehicle
  const availablePriceOptions = useMemo(() => {
    if (!vehicles || vehicles.length === 0) {
      return [
        { value: "15000", label: "bis 15.000 €" },
        { value: "20000", label: "bis 20.000 €" },
        { value: "30000", label: "bis 30.000 €" },
        { value: "40000", label: "bis 40.000 €" },
        { value: "50000", label: "bis 50.000 €" },
        { value: "60000", label: "bis 60.000 €" },
      ];
    }
    
    const prices = vehicles.map(v => v.price).filter(p => p > 0);
    if (prices.length === 0) {
      return [
        { value: "15000", label: "bis 15.000 €" },
        { value: "20000", label: "bis 20.000 €" },
        { value: "30000", label: "bis 30.000 €" },
        { value: "40000", label: "bis 40.000 €" },
        { value: "50000", label: "bis 50.000 €" },
        { value: "60000", label: "bis 60.000 €" },
      ];
    }
    
    const minPrice = Math.min(...prices);
    const allPriceOptions = [
      { value: "15000", label: "bis 15.000 €", threshold: 15000 },
      { value: "20000", label: "bis 20.000 €", threshold: 20000 },
      { value: "30000", label: "bis 30.000 €", threshold: 30000 },
      { value: "40000", label: "bis 40.000 €", threshold: 40000 },
      { value: "50000", label: "bis 50.000 €", threshold: 50000 },
      { value: "60000", label: "bis 60.000 €", threshold: 60000 },
    ];
    
    // Only include prices that are at least as high as the cheapest vehicle
    return allPriceOptions
      .filter(option => option.threshold >= minPrice)
      .map(({ value, label }) => ({ value, label }));
  }, [vehicles]);

  // Extract unique brands and models for quick search
  const availableBrands = useMemo(() => {
    try {
      if (!vehicles || !Array.isArray(vehicles)) return [];
      const brands = new Set<string>();
      vehicles.forEach(v => {
        if (v && v.brand && typeof v.brand === 'string') {
          brands.add(v.brand);
        }
      });
      return Array.from(brands).sort();
    } catch (err) {
      console.error('Error extracting brands:', err);
      return [];
    }
  }, [vehicles]);

  const availableModels = useMemo(() => {
    try {
      if (!vehicles || !Array.isArray(vehicles)) return [];
      
      // Filter vehicles by selected brand if one is selected
      let vehiclesToUse = vehicles;
      if (selectedBrand) {
        vehiclesToUse = vehicles.filter(v => v && v.brand === selectedBrand);
      }
      
      // For BMW: show series (Oberkategorien) instead of individual models
      const isBMW = selectedBrand === "BMW";
      
      if (isBMW) {
        // Extract base models first
        const baseModels = Array.from(
          new Set(
            vehiclesToUse
              .filter(v => v && v.model && typeof v.model === 'string')
              .map(v => getBaseModelName(v.model))
              .filter(model => model && model.trim() !== '')
          )
        );
        
        // Group by series and return series names
        const grouped = groupModelsBySeries(baseModels);
        const series = Array.from(grouped.keys()).sort((a, b) => {
          // Sort order: 1er, 2er, 3er, 4er, 5er, 6er, 7er, 8er, X-Reihe, i-Modelle, Sonstige
          const seriesOrder = ["1er", "2er", "3er", "4er", "5er", "6er", "7er", "8er", "X-Reihe", "i-Modelle", "Sonstige"];
          const indexA = seriesOrder.indexOf(a);
          const indexB = seriesOrder.indexOf(b);
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
        });
        
        return series;
      }
      
      // For other brands: extract base models only (e.g., "i4" instead of "i4 eDrive40 GC M-SPORT-PRO")
      // Same logic as in VehiclesPage.tsx
      const baseModels = Array.from(
        new Set(
          vehiclesToUse
            .filter(v => v && v.model && typeof v.model === 'string')
            .map(v => getBaseModelName(v.model))
            .filter(model => model && model.trim() !== '')
        )
      ).sort();
      
      return baseModels;
    } catch (err) {
      console.error('Error extracting models:', err);
      return [];
    }
  }, [vehicles, selectedBrand]);

  // Calculate matching vehicles count
  const matchingCount = useMemo(() => {
    try {
      if (!vehicles || !Array.isArray(vehicles)) return 0;
      const isBMW = selectedBrand === "BMW";
      
      return vehicles.filter(v => {
        try {
          if (selectedBrand && v.brand !== selectedBrand) return false;
          if (selectedModel) {
            if (isBMW) {
              // For BMW: selectedModel is a series name (e.g., "1er")
              // Same logic as in VehiclesPage.tsx for "X (alle)" series selections
              // Get all available base models for BMW from vehicles
              const allBaseModels = Array.from(
                new Set(
                  vehicles
                    .filter(v2 => v2 && v2.brand === "BMW" && v2.model)
                    .map(v2 => getBaseModelName(v2.model))
                    .filter(model => model && model.trim() !== '')
                )
              );
              
              // Group by series (same as filterOptions.models logic in VehiclesPage)
              // allBaseModels already contains base model names like ["118", "120", "116"]
              const grouped = groupModelsBySeries(allBaseModels);
              const modelsInSeries = grouped.get(selectedModel) || [];
              
              // Check if vehicle's base model matches any model in the series
              // Same check as in VehiclesPage.tsx line 253
              // We use getBaseModelName on m for consistency, even though modelsInSeries 
              // should already contain base models
              const vehicleBaseModel = getBaseModelName(v.model);
              if (!modelsInSeries.some(m => getBaseModelName(m) === vehicleBaseModel)) {
                return false;
              }
            } else {
              // For other brands: Use base model name for comparison (same as in VehiclesPage.tsx)
              const vehicleBaseModel = getBaseModelName(v.model);
              if (vehicleBaseModel !== selectedModel) return false;
            }
          }
          // Price filter - only apply if maxPrice is set and not empty
          if (maxPrice && typeof maxPrice === 'string' && maxPrice.trim() !== "" && maxPrice !== "all") {
            const price = parseFloat(maxPrice);
            if (!isNaN(price) && v.price && v.price > price) return false;
          }
          return true;
        } catch (err) {
          console.error('Error filtering vehicle:', err);
          // If there's an error, include the vehicle to ensure we show something
          return true;
        }
      }).length;
    } catch (err) {
      console.error('Error calculating matching count:', err);
      // Return total vehicle count as fallback
      return vehicles && Array.isArray(vehicles) ? vehicles.length : 0;
    }
  }, [vehicles, selectedBrand, selectedModel, maxPrice]);

  // Handle search button click - navigate to vehicles page with filters
  const handleSearch = () => {
    try {
      const params = new URLSearchParams();
      if (selectedBrand) params.set("brand", selectedBrand);
      if (selectedModel) {
        // For BMW: convert series name to "X (alle)" format for VehiclesPage compatibility
        const isBMW = selectedBrand === "BMW";
        if (isBMW) {
          params.set("model", `${selectedModel} (alle)`);
        } else {
          params.set("model", selectedModel);
        }
      }
      // Only set maxPrice if it's actually set and not empty or "all"
      if (maxPrice && typeof maxPrice === 'string' && maxPrice.trim() !== "" && maxPrice !== "all") {
        params.set("maxPrice", maxPrice);
      }
      // Always navigate - even if no params (shows all vehicles)
      window.location.href = `/fahrzeuge?${params.toString()}`;
    } catch (err) {
      console.error('Error in handleSearch:', err);
      // Fallback: navigate to vehicles page without filters
      window.location.href = '/fahrzeuge';
    }
  };

  // Reset model when brand changes - always show all models when brand changes
  useEffect(() => {
    setSelectedModel("");
  }, [selectedBrand]);

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

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Disconnect after first trigger to prevent re-animation
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of the section is visible
        rootMargin: "0px 0px -200px 0px", // Trigger later - need to scroll deeper
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} id="vehicles" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Schnellsuche Section */}
        {!isLoading && vehicles && vehicles.length > 0 && availableBrands && availableBrands.length > 0 && (
          <>
            {/* Schnellsuche Überschrift */}
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl md:text-3xl text-primary mb-2">
                Schnellsuche
              </h2>
            </div>

            {/* Quick Search Box */}
          <div className="mb-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Hersteller Select */}
                <div className="space-y-2">
                  <Label htmlFor="brand-select" className="text-sm font-medium text-foreground">
                    Hersteller
                  </Label>
                  <Select value={selectedBrand || undefined} onValueChange={(value) => setSelectedBrand(value === "all" ? "" : value)}>
                    <SelectTrigger id="brand-select" className="w-full">
                      <SelectValue placeholder="Alle Hersteller" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Hersteller</SelectItem>
                      {availableBrands && availableBrands.length > 0 && availableBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Modell Select */}
                <div className="space-y-2">
                  <Label htmlFor="model-select" className="text-sm font-medium text-foreground">
                    Modell
                  </Label>
                  <Select 
                    value={selectedModel ? selectedModel : "all"} 
                    onValueChange={(value) => setSelectedModel(value === "all" ? "" : value)} 
                    disabled={!selectedBrand}
                  >
                    <SelectTrigger id="model-select" className="w-full">
                      <SelectValue placeholder="Alle Modelle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Modelle</SelectItem>
                      {availableModels && availableModels.length > 0 && availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preis bis Select */}
                <div className="space-y-2">
                  <Label htmlFor="max-price" className="text-sm font-medium text-foreground">
                    Preis bis
                  </Label>
                  <Select 
                    value={maxPrice && maxPrice !== "" ? maxPrice : "all"} 
                    onValueChange={(value) => {
                      try {
                        setMaxPrice(value === "all" ? "" : value);
                      } catch (err) {
                        console.error('Error setting max price:', err);
                        setMaxPrice("");
                      }
                    }}
                  >
                    <SelectTrigger id="max-price" className="w-full">
                      <SelectValue placeholder="Keine Obergrenze" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Keine Obergrenze</SelectItem>
                      {availablePriceOptions && Array.isArray(availablePriceOptions) && availablePriceOptions.length > 0 ? (
                        availablePriceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        // Fallback options if availablePriceOptions is not ready
                        <>
                          <SelectItem value="15000">bis 15.000 €</SelectItem>
                          <SelectItem value="20000">bis 20.000 €</SelectItem>
                          <SelectItem value="30000">bis 30.000 €</SelectItem>
                          <SelectItem value="40000">bis 40.000 €</SelectItem>
                          <SelectItem value="50000">bis 50.000 €</SelectItem>
                          <SelectItem value="60000">bis 60.000 €</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  disabled={matchingCount === 0}
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-semibold h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {matchingCount > 0 ? `${matchingCount} Treffer` : "Keine Treffer"}
                </Button>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Section Header */}
        <div className="text-center mb-12 mt-12">
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
                  className={`h-full transition-all duration-1000 ease-out ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 200}ms`,
                    willChange: 'opacity, transform'
                  }}
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
                  className={`h-full transition-all duration-1000 ease-out ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 200}ms`,
                    willChange: 'opacity, transform'
                  }}
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
                    className={`h-full transition-all duration-700 ease-out ${
                      isVisible 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{ 
                      transitionDelay: `${(index + 3) * 150}ms`,
                      willChange: 'opacity, transform'
                    }}
                  >
                    <VehicleCard {...vehicle} showCategory={true} />
                  </div>
                ))}
              </div>
            )}

            {/* Trust Anchor - direkt unter dem Grid */}
            <div 
              className={`mt-8 mb-12 transition-all duration-1000 ease-out ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                transitionDelay: '1200ms',
                willChange: 'opacity, transform'
              }}
            >
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
            <div 
              className={`text-center mt-4 transition-all duration-1000 ease-out ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                transitionDelay: '1500ms',
                willChange: 'opacity, transform'
              }}
            >
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
