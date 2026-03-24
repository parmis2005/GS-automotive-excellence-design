import { useState, useMemo, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getBaseModelName, groupModelsBySeries } from "@/lib/vehicleNameUtils";

const QuickSearch = () => {
  const { data: vehicles, isLoading } = useVehicles();
  
  // Quick search state
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  
  // Calculate available price options based on actual vehicle prices
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
    
    return allPriceOptions
      .filter(option => option.threshold >= minPrice)
      .map(({ value, label }) => ({ value, label }));
  }, [vehicles]);

  // Extract unique brands
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

  // Extract models (BMW series for BMW, base models for others)
  const availableModels = useMemo(() => {
    try {
      if (!vehicles || !Array.isArray(vehicles)) return [];
      
      let vehiclesToUse = vehicles;
      if (selectedBrand) {
        vehiclesToUse = vehicles.filter(v => v && v.brand === selectedBrand);
      }
      
      const isBMW = selectedBrand === "BMW";
      
      if (isBMW) {
        const baseModels = Array.from(
          new Set(
            vehiclesToUse
              .filter(v => v && v.model && typeof v.model === 'string')
              .map(v => getBaseModelName(v.model))
              .filter(model => model && model.trim() !== '')
          )
        );
        
        const grouped = groupModelsBySeries(baseModels);
        const series = Array.from(grouped.keys()).sort((a, b) => {
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
              const allBaseModels = Array.from(
                new Set(
                  vehicles
                    .filter(v2 => v2 && v2.brand === "BMW" && v2.model)
                    .map(v2 => getBaseModelName(v2.model))
                    .filter(model => model && model.trim() !== '')
                )
              );
              
              const grouped = groupModelsBySeries(allBaseModels);
              const modelsInSeries = grouped.get(selectedModel) || [];
              
              const vehicleBaseModel = getBaseModelName(v.model);
              if (!modelsInSeries.some(m => getBaseModelName(m) === vehicleBaseModel)) {
                return false;
              }
            } else {
              const vehicleBaseModel = getBaseModelName(v.model);
              if (vehicleBaseModel !== selectedModel) return false;
            }
          }
          if (maxPrice && typeof maxPrice === 'string' && maxPrice.trim() !== "" && maxPrice !== "all") {
            const price = parseFloat(maxPrice);
            if (!isNaN(price) && v.price && v.price > price) return false;
          }
          return true;
        } catch (err) {
          console.error('Error filtering vehicle:', err);
          return true;
        }
      }).length;
    } catch (err) {
      console.error('Error calculating matching count:', err);
      return vehicles && Array.isArray(vehicles) ? vehicles.length : 0;
    }
  }, [vehicles, selectedBrand, selectedModel, maxPrice]);

  // Handle search button click
  const handleSearch = () => {
    try {
      const params = new URLSearchParams();
      if (selectedBrand) params.set("brand", selectedBrand);
      if (selectedModel) {
        const isBMW = selectedBrand === "BMW";
        if (isBMW) {
          params.set("model", `${selectedModel} (alle)`);
        } else {
          params.set("model", selectedModel);
        }
      }
      if (maxPrice && typeof maxPrice === 'string' && maxPrice.trim() !== "" && maxPrice !== "all") {
        params.set("maxPrice", maxPrice);
      }
      window.location.href = `/fahrzeuge?${params.toString()}`;
    } catch (err) {
      console.error('Error in handleSearch:', err);
      window.location.href = '/fahrzeuge';
    }
  };

  // Reset model when brand changes
  useEffect(() => {
    setSelectedModel("");
  }, [selectedBrand]);

  if (isLoading || !vehicles || vehicles.length === 0 || !availableBrands || availableBrands.length === 0) {
    return null;
  }

  return (
    <section className="pt-0 pb-8 lg:py-4 mb-8 lg:mb-0">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-primary/20 p-4 md:p-6" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
              {/* Hersteller Select */}
              <div className="space-y-2">
                <Label htmlFor="quick-search-brand-select" className="text-sm font-medium text-foreground">
                  Hersteller
                </Label>
                <Select
                  value={selectedBrand ? selectedBrand : "all"}
                  onValueChange={(value) => setSelectedBrand(value === "all" ? "" : value)}
                >
                  <SelectTrigger id="quick-search-brand-select" className="w-full">
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
                <Label htmlFor="quick-search-model-select" className="text-sm font-medium text-foreground">
                  Modell
                </Label>
                <Select 
                  value={selectedModel ? selectedModel : "all"} 
                  onValueChange={(value) => setSelectedModel(value === "all" ? "" : value)} 
                  disabled={!selectedBrand}
                >
                  <SelectTrigger id="quick-search-model-select" className="w-full">
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
                <Label htmlFor="quick-search-max-price" className="text-sm font-medium text-foreground">
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
                  <SelectTrigger id="quick-search-max-price" className="w-full">
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
      </div>
    </section>
  );
};

export default QuickSearch;
