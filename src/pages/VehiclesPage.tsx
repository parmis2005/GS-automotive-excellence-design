import { useState, useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import VehicleCard from "@/components/VehicleCard";
import VehicleFilters from "@/components/VehicleFilters";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Vehicle } from "@/types/vehicle";

export interface VehicleFiltersState {
  brands: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  fuelTypes: string[];
  transmissionTypes: string[];
  exteriorColors: string[];
  equipment: string[];
  searchQuery: string;
}

const VehiclesPage = () => {
  const { data: vehicles, isLoading, error } = useVehicles();
  
  const [filters, setFilters] = useState<VehicleFiltersState>({
    brands: [],
    priceRange: [0, 200000],
    yearRange: [2000, new Date().getFullYear() + 1],
    fuelTypes: [],
    transmissionTypes: [],
    exteriorColors: [],
    equipment: [],
    searchQuery: "",
  });

  // Get available filter options from vehicles
  const filterOptions = useMemo(() => {
    if (!vehicles) return { 
      brands: [], 
      fuelTypes: [], 
      transmissionTypes: [],
      exteriorColors: [],
      equipment: [],
    };
    
    const brands = Array.from(new Set(vehicles.map(v => v.brand))).sort();
    const fuelTypes = Array.from(new Set(vehicles.map(v => v.fuel))).sort();
    const transmissionTypes = Array.from(new Set(vehicles.map(v => v.transmission).filter(Boolean))).sort();
    const exteriorColors = Array.from(new Set(vehicles.map(v => v.exteriorColor).filter(Boolean))).sort();
    
    // Collect all equipment items
    const allEquipment = new Set<string>();
    vehicles.forEach(v => {
      if (v.equipment) {
        v.equipment.forEach(eq => allEquipment.add(eq));
      }
    });
    const equipment = Array.from(allEquipment).sort();
    
    return { brands, fuelTypes, transmissionTypes, exteriorColors, equipment };
  }, [vehicles]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    return vehicles.filter((vehicle) => {
      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(vehicle.brand)) {
        return false;
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
      
      // Exterior color filter
      if (filters.exteriorColors.length > 0 && vehicle.exteriorColor && !filters.exteriorColors.includes(vehicle.exteriorColor)) {
        return false;
      }
      
      // Equipment filter (vehicle must have all selected equipment items)
      if (filters.equipment.length > 0) {
        const vehicleEquipment = vehicle.equipment || [];
        const hasAllEquipment = filters.equipment.every(eq => 
          vehicleEquipment.some(veq => veq.toLowerCase().includes(eq.toLowerCase()))
        );
        if (!hasAllEquipment) {
          return false;
        }
      }
      
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchText = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.toLowerCase();
        if (!searchText.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [vehicles, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.brands.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000) count++;
    if (filters.yearRange[0] > 2000 || filters.yearRange[1] < new Date().getFullYear() + 1) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.transmissionTypes.length > 0) count++;
    if (filters.exteriorColors.length > 0) count++;
    if (filters.equipment.length > 0) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({
      brands: [],
      priceRange: [0, 200000],
      yearRange: [2000, new Date().getFullYear() + 1],
      fuelTypes: [],
      transmissionTypes: [],
      exteriorColors: [],
      equipment: [],
      searchQuery: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Fahrzeugsuche
            </h1>
            <p className="text-muted-foreground">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? "Fahrzeug" : "Fahrzeuge"} gefunden
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="ml-2 text-primary hover:underline"
                >
                  Filter zurücksetzen
                </button>
              )}
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
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <aside className="lg:w-80 flex-shrink-0">
                <VehicleFilters
                  filters={filters}
                  setFilters={setFilters}
                  filterOptions={filterOptions}
                />
              </aside>

              {/* Vehicles List */}
              <div className="flex-1">
                {filteredVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredVehicles.map((vehicle) => (
                      <VehicleCard key={vehicle.id} {...vehicle} />
                    ))}
                  </div>
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VehiclesPage;
