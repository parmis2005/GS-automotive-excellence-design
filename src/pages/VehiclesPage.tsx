import { useState, useMemo, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import VehicleListItem from "@/components/VehicleListItem";
import VehicleFilters from "@/components/VehicleFilters";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("price-desc");

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

  // Filter and sort vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    // First filter
    let filtered = vehicles.filter((vehicle) => {
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

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
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
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedVehicles.slice(startIndex, endIndex);
  }, [filteredAndSortedVehicles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedVehicles.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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
    setCurrentPage(1);
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Fahrzeugsuche
                </h1>
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
              </div>

              {/* Sort & Items per Page */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sortieren nach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-desc">Preis: Höchste zuerst</SelectItem>
                    <SelectItem value="price-asc">Preis: Niedrigste zuerst</SelectItem>
                    <SelectItem value="year-desc">Jahr: Neueste zuerst</SelectItem>
                    <SelectItem value="year-asc">Jahr: Älteste zuerst</SelectItem>
                    <SelectItem value="mileage-asc">Kilometerstand: Niedrigste zuerst</SelectItem>
                    <SelectItem value="mileage-desc">Kilometerstand: Höchste zuerst</SelectItem>
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
                {filteredAndSortedVehicles.length > 0 ? (
                  <>
                    <div className="space-y-4 mb-8">
                      {paginatedVehicles.map((vehicle, index) => (
                        <VehicleListItem key={vehicle.id} {...vehicle} isFirst={index === 0} />
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VehiclesPage;
