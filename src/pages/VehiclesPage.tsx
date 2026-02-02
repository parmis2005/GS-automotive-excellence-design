import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import VehicleListItem from "@/components/VehicleListItem";
import VehicleFilters from "@/components/VehicleFilters";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Vehicle } from "@/types/vehicle";
import { normalizeColorToBasic, BASIC_COLORS } from "@/lib/colorUtils";
import { getBaseModelName, groupModelsBySeries, getVehicleType, isKleinwagenModel, START_PAGE_VEHICLE_TYPES } from "@/lib/vehicleNameUtils";
import SEO from "@/components/SEO";
import { getVehiclesPageSEO } from "@/utils/seo";

export interface VehicleFiltersState {
  internalNumber: string; // 3-stellige Kennnummer (Angebotsnummer)
  brands: string[];
  models: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  fuelTypes: string[];
  transmissionTypes: string[];
  vehicleTypes: string[];
  exteriorColors: string[];
  equipment: string[];
  vatDisplayable?: boolean | null; // null = alle, true = nur ausweisbar, false = nur nicht ausweisbar
  searchQuery: string;
}

const VehiclesPage = () => {
  const { data: vehicles, isLoading, error } = useVehicles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Initialize filters from URL parameters
  const initialVehicleType = searchParams.get("vehicleType");
  const initialBrand = searchParams.get("brand");
  
  // Calculate min/max price and year from vehicles
  const { minPrice, maxPrice, minYear, maxYear } = useMemo(() => {
    if (!vehicles || vehicles.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 200000,
        minYear: 2000,
        maxYear: new Date().getFullYear() + 1,
      };
    }

    const prices = vehicles.map(v => v.price).filter(p => p > 0);
    const years = vehicles.map(v => v.year).filter(y => y > 0);

    const calculatedMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const calculatedMaxPrice = prices.length > 0 ? Math.max(...prices) : 200000;
    const calculatedMinYear = years.length > 0 ? Math.min(...years) : 2000;
    const calculatedMaxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear() + 1;

    return {
      minPrice: calculatedMinPrice,
      maxPrice: calculatedMaxPrice,
      minYear: calculatedMinYear,
      maxYear: calculatedMaxYear,
    };
  }, [vehicles]);

  const [filters, setFilters] = useState<VehicleFiltersState>({
    internalNumber: "",
    brands: initialBrand ? [initialBrand] : [],
    models: [],
    priceRange: [minPrice, maxPrice],
    yearRange: [minYear, maxYear],
    fuelTypes: [],
    transmissionTypes: [],
    vehicleTypes: initialVehicleType ? [initialVehicleType] : [],
    exteriorColors: [],
    equipment: [],
    vatDisplayable: null, // null = alle anzeigen
    searchQuery: "",
  });
  
  // Update filter ranges when vehicles data changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [minPrice, maxPrice],
      yearRange: [minYear, maxYear],
    }));
  }, [minPrice, maxPrice, minYear, maxYear]);

  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("price-desc");

  // Get available filter options from vehicles
  // This MUST be defined before the useEffect that uses it
  const filterOptions = useMemo(() => {
    if (!vehicles) return { 
      brands: [], 
      models: [],
      brandCounts: new Map<string, number>(),
      modelCounts: new Map<string, number>(),
      modelToBrand: new Map<string, string>(),
      fuelTypes: [], 
      transmissionTypes: [],
      vehicleTypes: [],
      exteriorColors: [],
      equipment: [],
    };
    
    // Calculate brand counts
    const brandCounts = new Map<string, number>();
    vehicles.forEach(v => {
      brandCounts.set(v.brand, (brandCounts.get(v.brand) || 0) + 1);
    });
    
    const brands = Array.from(new Set(vehicles.map(v => v.brand))).sort();
    
    // Extract base models only (e.g., "i4" instead of "i4 eDrive40 GC M-SPORT-PRO")
    // Only show models for selected brands, or all models if no brand is selected
    let vehiclesToUse = vehicles;
    if (filters.brands.length > 0) {
      vehiclesToUse = vehicles.filter(v => filters.brands.includes(v.brand));
    }
    
    // Calculate model counts (for the filtered vehicles) and map models to brands
    const modelCounts = new Map<string, number>();
    const modelToBrand = new Map<string, string>(); // Map base model to brand
    vehiclesToUse.forEach(v => {
      const baseModel = getBaseModelName(v.model);
      modelCounts.set(baseModel, (modelCounts.get(baseModel) || 0) + 1);
      // Store the brand for this model (if multiple brands have same model name, use the first one)
      if (!modelToBrand.has(baseModel)) {
        modelToBrand.set(baseModel, v.brand);
      }
    });
    
    const baseModels = Array.from(
      new Set(
        vehiclesToUse.map(v => getBaseModelName(v.model))
      )
    ).sort();
    const models = baseModels;
    const fuelTypes = Array.from(new Set(vehicles.map(v => v.fuel))).filter(Boolean).sort();
    const transmissionTypes = Array.from(new Set(vehicles.map(v => v.transmission).filter(Boolean))).sort();
    
    // Fahrzeugtypen: aus getVehicleType und aus Kategorie ableiten (Startseiten-Typen: Sportwagen, Limousine, …)
    const allVehicleTypes = new Set<string>();
    const categoryToStartPageType: Record<string, string> = {
      Sport: "Sportwagen",
      Familienwagen: "Limousine",
      Mittelklasse: "Limousine",
      Kleinwagen: "Kleinwagen",
      Kombi: "Kombi",
      Van: "Van",
      SUV: "SUV",
    };
    vehicles.forEach(v => {
      const vehicleType = getVehicleType(v.model, v.vehicleType);
      if (vehicleType) allVehicleTypes.add(vehicleType);
      const categoryType = v.category ? categoryToStartPageType[v.category] : undefined;
      if (categoryType) allVehicleTypes.add(categoryType);
    });
    const vehicleTypes = Array.from(allVehicleTypes).filter((t) => START_PAGE_VEHICLE_TYPES.includes(t as typeof START_PAGE_VEHICLE_TYPES[number])).sort();
    
    // Normalize exterior colors to basic colors for filter options
    const allExteriorColors = new Set<string>();
    vehicles.forEach(v => {
      if (v.exteriorColor) {
        allExteriorColors.add(normalizeColorToBasic(v.exteriorColor));
      }
    });
    const exteriorColors = BASIC_COLORS.filter(color => allExteriorColors.has(color)).sort((a, b) => {
      const indexA = BASIC_COLORS.indexOf(a);
      const indexB = BASIC_COLORS.indexOf(b);
      return indexA - indexB;
    });
    
    // Collect all equipment items
    const allEquipment = new Set<string>();
    vehicles.forEach(v => {
      if (v.equipment) {
        v.equipment.forEach(eq => allEquipment.add(eq));
      }
    });
    const equipment = Array.from(allEquipment).sort();
    
    return { brands, models, brandCounts, modelCounts, modelToBrand, fuelTypes, transmissionTypes, vehicleTypes, exteriorColors, equipment };
  }, [vehicles, filters.brands]);

  // Apply vehicleType, brand, and model from URL on mount
  // This needs to run after filterOptions is available for BMW series validation
  useEffect(() => {
    try {
      const vehicleTypeParam = searchParams.get("vehicleType");
      const brandParam = searchParams.get("brand");
      const modelParam = searchParams.get("model");
      const maxPriceParam = searchParams.get("maxPrice");
      
      if (vehicleTypeParam || brandParam || modelParam || maxPriceParam) {
        // Only apply if we have vehicles loaded (so filterOptions is ready)
        if (vehicles && vehicles.length > 0 && filterOptions) {
          // filterOptions is a value from useMemo, not a function
          const opts = filterOptions;
          setFilters((prev) => {
            try {
              const updates: Partial<VehicleFiltersState> = {};
              
              if (vehicleTypeParam) updates.vehicleTypes = [vehicleTypeParam];
              if (brandParam) updates.brands = [brandParam];
              
              // For model, we need to validate it exists in filterOptions
              if (modelParam) {
                const isBMW = brandParam === "BMW";
                
                // Check if it's a BMW series selection like "1er (alle)"
                if (isBMW && modelParam.endsWith(" (alle)")) {
                  const series = modelParam.replace(" (alle)", "");
                  const grouped = groupModelsBySeries(opts.models);
                  if (grouped.has(series)) {
                    updates.models = [modelParam];
                  }
                } else if (opts.models && Array.isArray(opts.models) && opts.models.includes(modelParam)) {
                  updates.models = [modelParam];
                }
              }
              
              // Apply maxPrice to priceRange only if maxPriceParam exists and is valid
              if (maxPriceParam && maxPriceParam.trim() !== "" && maxPriceParam !== "all") {
                const maxPriceNum = parseInt(maxPriceParam);
                if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
                  // Ensure we don't exceed the maximum possible price
                  const maxAllowedPrice = Math.max(prev.priceRange[1], maxPriceNum);
                  updates.priceRange = [prev.priceRange[0], maxPriceNum];
                }
              }
              
              return { ...prev, ...updates };
            } catch (err) {
              console.error('Error updating filters:', err);
              // Return previous state if there's an error
              return prev;
            }
          });
          
          // Clean up URL parameters after applying filters
          const newSearchParams = new URLSearchParams(searchParams);
          if (vehicleTypeParam) newSearchParams.delete("vehicleType");
          if (brandParam) newSearchParams.delete("brand");
          if (modelParam) newSearchParams.delete("model");
          if (maxPriceParam) newSearchParams.delete("maxPrice");
          setSearchParams(newSearchParams, { replace: true });
        }
      }
    } catch (err) {
      console.error('Error applying URL parameters:', err);
      // Continue normally - page should still load without filters
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, filterOptions, searchParams]); // Re-run when vehicles and filterOptions are loaded

  // Remove selected models that are no longer available after brand filter changes
  useEffect(() => {
    if (filters.models.length > 0 && filterOptions.models.length > 0) {
      const availableModels = new Set(filterOptions.models);
      const isBMW = filters.brands.length > 0 && filters.brands.includes("BMW");
      
      // For BMW, check if series selections (like "1er (alle)") are valid
      const validModels = filters.models.filter(model => {
        // Check if it's a series selection like "1er (alle)" (only for BMW)
        if (isBMW && model.endsWith(" (alle)")) {
          const series = model.replace(" (alle)", "");
          // Group available models by series and check if this series exists
          const grouped = groupModelsBySeries(filterOptions.models);
          return grouped.has(series);
        }
        // For regular models, check if they exist in availableModels
        return availableModels.has(model);
      });
      
      if (validModels.length !== filters.models.length) {
        setFilters(prev => ({
          ...prev,
          models: validModels,
        }));
      }
    } else if (filters.models.length > 0 && filterOptions.models.length === 0 && filters.brands.length > 0) {
      // If brands are selected but no models are available, clear model selection
      setFilters(prev => ({
        ...prev,
        models: [],
      }));
    }
  }, [filterOptions.models, filters.brands.length, filters.brands]);

  // Filter and sort vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    if (!vehicles) return [];
    
            // First filter
            let filtered = vehicles.filter((vehicle) => {
              // Brand filter
              if (filters.brands.length > 0 && !filters.brands.includes(vehicle.brand)) {
                return false;
              }
              
              // Model filter (compare base model names)
              // Support for "X (alle)" series selections (only for BMW)
              if (filters.models.length > 0) {
                const vehicleBaseModel = getBaseModelName(vehicle.model);
                const isBMW = filters.brands.length > 0 && filters.brands.includes("BMW");
                let matches = false;
                
                for (const selectedModel of filters.models) {
                  // Check if it's a series selection like "1er (alle)" (only for BMW)
                  if (isBMW && selectedModel.endsWith(" (alle)")) {
                    const series = selectedModel.replace(" (alle)", "");
                    // Get all models in this series from filterOptions
                    const grouped = groupModelsBySeries(filterOptions.models);
                    const modelsInSeries = grouped.get(series) || [];
                    // Check if vehicle's base model matches any model in the series
                    if (modelsInSeries.some(m => getBaseModelName(m) === vehicleBaseModel)) {
                      matches = true;
                      break;
                    }
                  } else if (selectedModel === vehicleBaseModel) {
                    matches = true;
                    break;
                  }
                }
                
                if (!matches) {
                  return false;
                }
              }
      
      // Price filter
      if (vehicle.price < filters.priceRange[0] || vehicle.price > filters.priceRange[1]) {
        return false;
      }
      
      // Year filter
      if (vehicle.year < filters.yearRange[0] || vehicle.year > filters.yearRange[1]) {
        return false;
      }
      
      // Fuel type filter
      if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(vehicle.fuel)) {
        return false;
      }
      
      // Transmission filter
      if (filters.transmissionTypes.length > 0 && vehicle.transmission && !filters.transmissionTypes.includes(vehicle.transmission)) {
        return false;
      }
      
      // Vehicle type filter (Startseiten-Typen: Sportwagen, Limousine, Kleinwagen, Kombi, Van, Cabrio, SUV)
      if (filters.vehicleTypes.length > 0) {
        const vehicleType = getVehicleType(vehicle.model, vehicle.vehicleType);
        const category = vehicle.category || "";
        let matchesFilter = false;
        
        for (const filterType of filters.vehicleTypes) {
          if (vehicleType === filterType) {
            matchesFilter = true;
            break;
          }
          // Kategorie zuordnen – Sportwagen nur wenn Modell kein Kleinwagen (z. B. Corsa ausschließen)
          if (filterType === "Sportwagen" && category === "Sport" && !isKleinwagenModel(vehicle.model)) { matchesFilter = true; break; }
          if (filterType === "Kleinwagen" && category === "Kleinwagen") { matchesFilter = true; break; }
          if (filterType === "Kombi" && category === "Kombi") { matchesFilter = true; break; }
          if (filterType === "Van" && category === "Van") { matchesFilter = true; break; }
          if (filterType === "SUV" && category === "SUV") { matchesFilter = true; break; }
        }
        
        if (!matchesFilter) {
          return false;
        }
      }
      
      // Exterior color filter (normalize to basic colors for comparison)
      if (filters.exteriorColors.length > 0 && vehicle.exteriorColor) {
        const normalizedVehicleColor = normalizeColorToBasic(vehicle.exteriorColor);
        if (!filters.exteriorColors.includes(normalizedVehicleColor)) {
          return false;
        }
      }
      
      // Equipment filter (vehicle must have all selected equipment items)
      if (filters.equipment.length > 0) {
        const vehicleEquipment = vehicle.equipment || [];
        const eqMatchKeywords: Record<string, string[]> = {
          "ACC": ["acc", "abstandstempomat"],
        };
        const hasAllEquipment = filters.equipment.every(eq => {
          const keywords = eqMatchKeywords[eq] ?? [eq.toLowerCase()];
          return vehicleEquipment.some(veq => {
            const veqLower = veq.toLowerCase();
            return keywords.some(kw => veqLower.includes(kw));
          });
        });
        if (!hasAllEquipment) {
          return false;
        }
      }
      
      // VAT (MwSt.) filter
      if (filters.vatDisplayable !== null && filters.vatDisplayable !== undefined) {
        if (vehicle.vatDisplayable !== filters.vatDisplayable) {
          return false;
        }
      }
      
      // 3-stellige Kennnummer: exakter Match auf (normierte) Angebotsnummer
      if (filters.internalNumber && filters.internalNumber.trim()) {
        const filterDigits = (filters.internalNumber || "").replace(/\D/g, "").slice(0, 10);
        if (filterDigits.length > 0) {
          const vehicleDigits = (vehicle.internalNumber || "").replace(/\D/g, "");
          if (!vehicleDigits || !vehicleDigits.startsWith(filterDigits)) {
            return false;
          }
        }
      }

      // Search query filter - searches in brand, model, year, internal number
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchText = `${vehicle.brand} ${vehicle.model} ${vehicle.year} ${vehicle.internalNumber || ''}`.toLowerCase();
        if (!searchText.includes(query)) {
          return false;
        }
      }
      
      return true;
    });

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "arrival-desc":
          // Neueste Zugänge zuerst = wenigste Standtage oben (Standtage aufsteigend)
          const daysA = a.standtage ?? (a.arrivalDate ? Math.max(0, Math.floor((Date.now() - new Date(a.arrivalDate).getTime()) / 86400000)) : null);
          const daysB = b.standtage ?? (b.arrivalDate ? Math.max(0, Math.floor((Date.now() - new Date(b.arrivalDate).getTime()) / 86400000)) : null);
          if (daysA == null && daysB == null) return 0;
          if (daysA == null) return 1;   // a ohne Standtage nach hinten
          if (daysB == null) return -1;   // b ohne Standtage nach hinten
          return daysA - daysB;          // wenigste Tage zuerst
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "year-desc":
          return b.year - a.year;
        case "year-asc":
          return a.year - b.year;
        case "mileage-asc":
          return a.mileage - b.mileage;
        case "mileage-desc":
          return b.mileage - a.mileage;
        case "power-desc":
          // Sort by PS (power), fallback to kW if PS not available
          // Vehicles without power info go to the end
          const powerA = a.power || a.powerKw || 0;
          const powerB = b.power || b.powerKw || 0;
          if (powerA === 0 && powerB === 0) return 0;
          if (powerA === 0) return 1; // a goes to end
          if (powerB === 0) return -1; // b goes to end
          return powerB - powerA;
        case "power-asc":
          // Sort by PS (power), fallback to kW if PS not available
          // Vehicles without power info go to the end
          const powerA_asc = a.power || a.powerKw || 0;
          const powerB_asc = b.power || b.powerKw || 0;
          if (powerA_asc === 0 && powerB_asc === 0) return 0;
          if (powerA_asc === 0) return 1; // a goes to end
          if (powerB_asc === 0) return -1; // b goes to end
          return powerA_asc - powerB_asc;
        case "brand-asc":
          return a.brand.localeCompare(b.brand);
        default:
          return b.price - a.price;
      }
    });

    return sorted;
  }, [vehicles, filters, sortBy]);

  // Paginate
  const paginatedVehicles = useMemo(() => {
    if (!filteredAndSortedVehicles || filteredAndSortedVehicles.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedVehicles.slice(startIndex, endIndex);
  }, [filteredAndSortedVehicles, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!filteredAndSortedVehicles || filteredAndSortedVehicles.length === 0) return 1;
    return Math.ceil(filteredAndSortedVehicles.length / itemsPerPage);
  }, [filteredAndSortedVehicles, itemsPerPage]);

  // Reset to page 1 when filters or sort order change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.internalNumber,
    filters.brands,
    filters.models,
    filters.priceRange,
    filters.yearRange,
    filters.fuelTypes,
    filters.transmissionTypes,
    filters.vehicleTypes,
    filters.exteriorColors,
    filters.equipment,
    filters.vatDisplayable,
    filters.searchQuery,
    sortBy
  ]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.internalNumber && filters.internalNumber.trim()) count++;
    if (filters.brands.length > 0) count++;
    if (filters.models.length > 0) count++;
    // Calculate dynamic min/max for comparison
    const prices = vehicles?.map(v => v.price).filter(p => p > 0) || [];
    const years = vehicles?.map(v => v.year).filter(y => y > 0) || [];
    const currentMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const currentMaxPrice = prices.length > 0 ? Math.max(...prices) : 200000;
    const currentMinYear = years.length > 0 ? Math.min(...years) : 2000;
    const currentMaxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear() + 1;
    
    if (filters.priceRange[0] > currentMinPrice || filters.priceRange[1] < currentMaxPrice) count++;
    if (filters.yearRange[0] > currentMinYear || filters.yearRange[1] < currentMaxYear) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.transmissionTypes.length > 0) count++;
    if (filters.vehicleTypes.length > 0) count++;
    if (filters.exteriorColors.length > 0) count++;
    if (filters.equipment.length > 0) count++;
    if (filters.vatDisplayable !== null && filters.vatDisplayable !== undefined) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({
      internalNumber: "",
      brands: [],
      models: [],
      priceRange: [minPrice, maxPrice],
      yearRange: [minYear, maxYear],
      fuelTypes: [],
      transmissionTypes: [],
      vehicleTypes: [],
      exteriorColors: [],
      equipment: [],
      vatDisplayable: null,
      searchQuery: "",
    });
    setCurrentPage(1);
  };
  
  const seoData = getVehiclesPageSEO();

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} breadcrumbs={[{ name: "Startseite", url: "/" }, { name: "Fahrzeugsuche", url: "/fahrzeuge" }]} />
      <Navbar />
      <main className="pt-8 pb-20">
        <div className="max-w-[1560px] mx-auto px-6 lg:px-8">
          {/* Header – nur Titel, wenn (noch) keine Fahrzeuge geladen */}
          {(!vehicles || isLoading) && (
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Fahrzeugsuche
              </h1>
            </div>
          )}


          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Fahrzeuge werden geladen...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fehler beim Laden der Fahrzeuge</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Unbekannter Fehler"}
              </AlertDescription>
            </Alert>
          )}

          {/* Content */}
          {vehicles && !isLoading && (
            <div className="flex flex-col">
              {/* Zeige-Info (oben) */}
              {filteredAndSortedVehicles.length > 0 && (
                <div className="text-center text-sm text-muted-foreground mb-4">
                  Zeige {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedVehicles.length)} von {filteredAndSortedVehicles.length} Fahrzeugen
                </div>
              )}

              {/* Titel | Pagination | Sortierung – alle auf gleicher Höhe */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                {/* Links: Titel + Fahrzeuganzahl */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Fahrzeugsuche
                  </h1>
                  {vehicles && (
                    <p className="text-muted-foreground">
                      {filteredAndSortedVehicles.length} {filteredAndSortedVehicles.length === 1 ? "Fahrzeug" : "Fahrzeuge"} gefunden
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="ml-2 text-primary hover:underline"
                        >
                          Filter zurücksetzen
                        </button>
                      )}
                    </p>
                  )}
                </div>

                {/* Mitte: Pagination (Seitenauswahl) */}
                {filteredAndSortedVehicles.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Zurück
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="min-w-[40px]"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Weiter
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                )}

                {/* Rechts: Sortierung + Items per Page + Mobile Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="lg:hidden w-full sm:w-auto flex items-center justify-center gap-2"
                      >
                        <Filter className="w-4 h-4" />
                        Filtern
                        {activeFilterCount > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filter</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <VehicleFilters
                          filters={filters}
                          setFilters={setFilters}
                          filterOptions={filterOptions}
                          vehicles={vehicles}
                        />
                      </div>
                      <div className="mt-6 pt-6 border-t sticky bottom-0 bg-background">
                        <Button
                          onClick={() => setIsMobileFiltersOpen(false)}
                          className="w-full"
                          size="lg"
                        >
                          Speichern
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Sortieren nach" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrival-desc">Neueste Zugänge</SelectItem>
                      <SelectItem value="price-desc">Preis: Höchste zuerst</SelectItem>
                      <SelectItem value="price-asc">Preis: Niedrigste zuerst</SelectItem>
                      <SelectItem value="year-desc">Jahr: Neueste zuerst</SelectItem>
                      <SelectItem value="year-asc">Jahr: Älteste zuerst</SelectItem>
                      <SelectItem value="mileage-asc">Kilometerstand: Niedrigste zuerst</SelectItem>
                      <SelectItem value="mileage-desc">Kilometerstand: Höchste zuerst</SelectItem>
                      <SelectItem value="power-desc">Leistung: Höchste zuerst</SelectItem>
                      <SelectItem value="power-asc">Leistung: Niedrigste zuerst</SelectItem>
                      <SelectItem value="brand-asc">Marke: A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Pro Seite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 pro Seite</SelectItem>
                      <SelectItem value="20">20 pro Seite</SelectItem>
                      <SelectItem value="50">50 pro Seite</SelectItem>
                      <SelectItem value="100">100 pro Seite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar – Desktop only, startet auf gleicher Höhe wie erste Fahrzeugkarte */}
                <aside className="hidden lg:block lg:w-72 flex-shrink-0">
                  <VehicleFilters
                    filters={filters}
                    setFilters={setFilters}
                    filterOptions={filterOptions}
                    vehicles={vehicles}
                  />
                </aside>

                {/* Vehicles List */}
                <div className="flex-1">
                  {filteredAndSortedVehicles.length > 0 ? (
                    <>
                    <div className="space-y-4 mb-8">
                      {paginatedVehicles.map((vehicle, index) => (
                        <div key={vehicle.id} className="h-full">
                          <VehicleListItem {...vehicle} isFirst={index === 0} />
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Zurück
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="min-w-[40px]"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Weiter
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}

                    {/* Page Info */}
                    <div className="text-center text-sm text-muted-foreground mt-4">
                      Zeige {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedVehicles.length)} von {filteredAndSortedVehicles.length} Fahrzeugen
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-muted/50 rounded-lg">
                    <X className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Keine Fahrzeuge gefunden
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Versuchen Sie, Ihre Filter anzupassen.
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-primary hover:underline font-medium"
                      >
                        Alle Filter zurücksetzen
                      </button>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VehiclesPage;
