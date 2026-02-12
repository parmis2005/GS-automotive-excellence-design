import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, ChevronDown, Check, ChevronsUpDown, SlidersHorizontal } from "lucide-react";
import type { VehicleFiltersState } from "@/pages/VehiclesPage";
import { getColorHex } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";
import { groupModelsBySeries } from "@/lib/vehicleNameUtils";
import { getVehicleTypeIcon } from "@/lib/vehicleTypeIcons";

import type { Vehicle } from "@/types/vehicle";

// Keywords für Equipment-Match (Anzeige in Filterliste)
const EQUIPMENT_MATCH_KEYWORDS: Record<string, string[]> = {
  ACC: ["acc", "abstandstempomat"],
};

const equipmentMatchesOptions = (allowed: string, equipmentList: string[]): boolean => {
  const keywords = EQUIPMENT_MATCH_KEYWORDS[allowed] ?? [allowed.toLowerCase()];
  return equipmentList.some((eq) => {
    const eqLower = eq.toLowerCase();
    return keywords.some((kw) => eqLower.includes(kw));
  });
};

// Erlaubte Ausstattungsfilter, kategorisch sortiert
const EQUIPMENT_FILTER_CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: "Infotainment & Konnektivität",
    items: ["Apple CarPlay", "Android Auto", "Navi", "Bluetooth", "Freisprecheinrichtung", "USB-Anschluss", "Induktionsladen"],
  },
  {
    label: "Klima & Komfort",
    items: ["Klima", "Klimaautomatik", "Sitzheizung", "Lenkradheizung", "Standheizung"],
  },
  {
    label: "Sicherheit & Fahrassistenz",
    items: ["Einparkhilfe", "Rückfahrkamera", "360 Grad Kamera", "Totwinkelassistent", "Müdigkeitserkennung", "Fernlichtassistent", "ACC", "Tempomat"],
  },
  {
    label: "Beleuchtung",
    items: ["LED", "AHK"],
  },
  {
    label: "Innenausstattung",
    items: ["Sportsitze", "Stoff", "Teilleder", "Leder", "Lederlenkrad", "Panoramadach", "Schiebedach"],
  },
  {
    label: "Komfort & Zugang",
    items: ["Keyless Go", "Keyless Entry", "Isofix"],
  },
  {
    label: "Pakete & Sonstiges",
    items: ["Alufelgen", "Sportpaket", "Garantie", "Regensensor"],
  },
];

interface VehicleFiltersProps {
  filters: VehicleFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<VehicleFiltersState>>;
  filterOptions: {
    brands: string[];
    models: string[];
    brandCounts: Map<string, number>;
    modelCounts: Map<string, number>;
    modelToBrand: Map<string, string>;
    fuelTypes: string[];
    transmissionTypes: string[];
    vehicleTypes: string[];
    exteriorColors: string[];
    equipment: string[];
  };
  vehicles?: Vehicle[];
}

const VehicleFilters = ({ filters, setFilters, filterOptions, vehicles }: VehicleFiltersProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [showFuelTypes, setShowFuelTypes] = useState(true);
  const [showVehicleTypes, setShowVehicleTypes] = useState(true);
  const currentYear = new Date().getFullYear();
  
  // Calculate min/max price and year from vehicles
  const { minPrice, maxPrice, minYear, maxYear } = useMemo(() => {
    if (!vehicles || vehicles.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 200000,
        minYear: 2000,
        maxYear: currentYear + 1,
      };
    }

    const prices = vehicles.map(v => v.price).filter(p => p > 0);
    const years = vehicles.map(v => v.year).filter(y => y > 0);

    const calculatedMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const calculatedMaxPrice = prices.length > 0 ? Math.max(...prices) : 200000;
    const calculatedMinYear = years.length > 0 ? Math.min(...years) : 2000;
    const calculatedMaxYear = years.length > 0 ? Math.max(...years) : currentYear + 1;

    return {
      minPrice: calculatedMinPrice,
      maxPrice: calculatedMaxPrice,
      minYear: calculatedMinYear,
      maxYear: calculatedMaxYear,
    };
  }, [vehicles, currentYear]);

  const updateFilters = (updates: Partial<VehicleFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const toggleBrand = (brand: string) => {
    setFilters((prev) => {
      const newBrands = prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand];
      
      // Wenn alle Marken abgewählt werden, auch Modelle zurücksetzen
      if (newBrands.length === 0) {
        return {
          ...prev,
          brands: newBrands,
          models: [],
        };
      }
      
      // Wenn eine Marke abgewählt wird, Modelle entfernen, die nicht mehr zu den verbleibenden Marken gehören
      // Dies wird durch die filterOptions-Logik in VehiclesPage.tsx gehandhabt,
      // aber wir können hier auch präventiv Modelle entfernen, die nicht mehr verfügbar sind
      // Die tatsächliche Filterung erfolgt in VehiclesPage.tsx basierend auf filterOptions
      
      return {
        ...prev,
        brands: newBrands,
      };
    });
  };

  const toggleModel = (model: string) => {
    setFilters((prev) => {
      // Only handle series selection for BMW
      const isBMW = prev.brands.length > 0 && prev.brands.includes("BMW");
      
      // Check if it's a series selection like "1er (alle)" (only for BMW)
      if (isBMW && model.endsWith(" (alle)")) {
        const series = model.replace(" (alle)", "");
        const grouped = groupModelsBySeries(filterOptions.models);
        const modelsInSeries = grouped.get(series) || [];
        
        // If series is already selected, remove all models in that series
        if (prev.models.some(m => m === model)) {
          return {
            ...prev,
            models: prev.models.filter(m => m !== model && !modelsInSeries.includes(m)),
          };
        } else {
          // Add series selection and all models in that series
          return {
            ...prev,
            models: [...prev.models.filter(m => !m.endsWith(` ${series} (alle)`)), model, ...modelsInSeries],
          };
        }
      } else {
        // Regular model selection
        return {
          ...prev,
          models: prev.models.includes(model)
            ? prev.models.filter((m) => m !== model)
            : [...prev.models, model],
        };
      }
    });
  };

  const toggleFuelType = (fuel: string) => {
    setFilters((prev) => ({
      ...prev,
      fuelTypes: prev.fuelTypes.includes(fuel)
        ? prev.fuelTypes.filter((f) => f !== fuel)
        : [...prev.fuelTypes, fuel],
    }));
  };

  const toggleTransmission = (transmission: string) => {
    setFilters((prev) => ({
      ...prev,
      transmissionTypes: prev.transmissionTypes.includes(transmission)
        ? prev.transmissionTypes.filter((t) => t !== transmission)
        : [...prev.transmissionTypes, transmission],
    }));
  };

  const toggleVehicleType = (vehicleType: string) => {
    setFilters((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(vehicleType)
        ? prev.vehicleTypes.filter((vt) => vt !== vehicleType)
        : [...prev.vehicleTypes, vehicleType],
    }));
  };

  const toggleExteriorColor = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      exteriorColors: prev.exteriorColors.includes(color)
        ? prev.exteriorColors.filter((c) => c !== color)
        : [...prev.exteriorColors, color],
    }));
  };

  const toggleEquipment = (equipment: string) => {
    setFilters((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }));
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-[#0f2439] px-5 py-4 flex items-center gap-2 shrink-0">
        <SlidersHorizontal className="w-5 h-5 text-white" />
        <h2 className="text-xl font-bold text-white tracking-tight">Filter</h2>
      </div>
      <div className="p-6">

      {/* Suche (oben) */}
      <div className="mb-6">
        <Label htmlFor="search" className="mb-2 block">
          Suche
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Marke, Modell, Jahr..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      {/* Kennnummer (3-stellig) */}
      <div className="mb-6">
        <Label htmlFor="internalNumber" className="mb-2 block">
          Kennnummer (3-stellig)
        </Label>
        <Input
          id="internalNumber"
          type="text"
          inputMode="numeric"
          placeholder="z. B. 597"
          maxLength={3}
          value={filters.internalNumber}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 3);
            updateFilters({ internalNumber: v });
          }}
          className="font-mono"
        />
      </div>

      <Separator className="mb-6" />

      {/* Price Range - PRIMARY FILTER */}
      <div className="mb-6">
        <Label className="mb-4 block font-medium">
          Preis: {filters.priceRange[0].toLocaleString("de-DE")} € - {filters.priceRange[1].toLocaleString("de-DE")} €
        </Label>
        <Slider
          value={filters.priceRange}
          onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
          min={minPrice}
          max={maxPrice}
          step={1000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{minPrice.toLocaleString("de-DE")} €</span>
          <span>{maxPrice.toLocaleString("de-DE")} €</span>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Brands - PRIMARY FILTER */}
      <div className="mb-6">
        <Label className="mb-3 block font-medium">Marke</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                !filters.brands.length && "text-muted-foreground"
              )}
            >
              {filters.brands.length > 0
                ? filters.brands.length === 1
                  ? filters.brands[0]
                  : `${filters.brands.length} Marken ausgewählt`
                : "Alle Marken"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Marke suchen..." />
              <CommandList>
                <CommandEmpty>Keine Marke gefunden.</CommandEmpty>
                <CommandGroup>
                  {filterOptions.brands && filterOptions.brands.map((brand) => {
                    const count = filterOptions.brandCounts.get(brand) || 0;
                    return (
                      <CommandItem
                        key={brand}
                        value={brand}
                        onSelect={() => toggleBrand(brand)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.brands.includes(brand) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {brand} ({count})
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {filters.brands.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.brands.map((brand) => (
              <Button
                key={brand}
                variant="secondary"
                size="sm"
                onClick={() => toggleBrand(brand)}
                className="h-7 text-xs"
              >
                {brand}
                <span className="ml-1">×</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Models - PRIMARY FILTER */}
      <div className="mb-6">
        <Label className="mb-3 block font-medium">Modell</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={filters.brands.length === 0}
              className={cn(
                "w-full justify-between",
                !filters.models.length && "text-muted-foreground",
                filters.brands.length === 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              {filters.brands.length === 0
                ? "Bitte zuerst Marke wählen"
                : filters.models.length > 0
                ? filters.models.length === 1
                  ? filters.models[0]
                  : `${filters.models.length} Modelle ausgewählt`
                : "Alle Modelle"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Modell suchen..." />
              <CommandList>
                <CommandEmpty>Kein Modell gefunden.</CommandEmpty>
                {(() => {
                  const multipleBrands = filters.brands.length > 1;
                  const isBMW = filters.brands.length > 0 && filters.brands.includes("BMW");
                  
                  if (!filterOptions.models || filterOptions.models.length === 0) {
                    return null;
                  }
                  
                  // If multiple brands selected, group by brand first
                  if (multipleBrands) {
                    // Group models by brand
                    const modelsByBrand = new Map<string, string[]>();
                    filterOptions.models.forEach(model => {
                      const brand = filterOptions.modelToBrand.get(model) || "Sonstige";
                      if (!modelsByBrand.has(brand)) {
                        modelsByBrand.set(brand, []);
                      }
                      modelsByBrand.get(brand)!.push(model);
                    });
                    
                    // Sort brands alphabetically
                    const sortedBrands = Array.from(modelsByBrand.keys()).sort();
                    
                    return sortedBrands.map((brand) => {
                      const brandModels = modelsByBrand.get(brand) || [];
                      const isBrandBMW = brand === "BMW";
                      
                      // For BMW, group by series; for others, just sort alphabetically
                      if (isBrandBMW) {
                        const groupedModels = groupModelsBySeries(brandModels);
                        const seriesArray = Array.from(groupedModels.entries());
                        
                        return (
                          <CommandGroup key={brand} heading={brand}>
                            {seriesArray.map(([series, models]) => {
                              const seriesCount = models.reduce((sum, model) => {
                                return sum + (filterOptions.modelCounts.get(model) || 0);
                              }, 0);
                              
                              const allModelsSelected = models.every(model => filters.models.includes(model));
                              const seriesKey = `${series} (alle)`;
                              const isSeriesSelected = filters.models.includes(seriesKey);
                              
                              return (
                                <div key={series}>
                                  <CommandItem
                                    value={seriesKey}
                                    onSelect={() => toggleModel(seriesKey)}
                                    className="pl-4"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSeriesSelected || allModelsSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="font-semibold">{series} (alle)</span> ({seriesCount})
                                  </CommandItem>
                                  {models.map((model) => {
                                    const count = filterOptions.modelCounts.get(model) || 0;
                                    return (
                                      <CommandItem
                                        key={model}
                                        value={model}
                                        onSelect={() => toggleModel(model)}
                                        className="pl-12"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.models.includes(model) ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {model} ({count})
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </CommandGroup>
                        );
                      } else {
                        // Non-BMW brand: flat list
                        return (
                          <CommandGroup key={brand} heading={brand}>
                            {brandModels.map((model) => {
                              const count = filterOptions.modelCounts.get(model) || 0;
                              return (
                                <CommandItem
                                  key={model}
                                  value={model}
                                  onSelect={() => toggleModel(model)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      filters.models.includes(model) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {model} ({count})
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        );
                      }
                    });
                  } else {
                    // Single brand (or no brand selected)
                    if (isBMW && filterOptions.models.length > 0) {
                      // Group models by series for BMW
                      const groupedModels = groupModelsBySeries(filterOptions.models);
                      const seriesArray = Array.from(groupedModels.entries());
                      
                      return seriesArray.map(([series, models]) => {
                        const seriesCount = models.reduce((sum, model) => {
                          return sum + (filterOptions.modelCounts.get(model) || 0);
                        }, 0);
                        
                        const allModelsSelected = models.every(model => filters.models.includes(model));
                        const seriesKey = `${series} (alle)`;
                        const isSeriesSelected = filters.models.includes(seriesKey);
                        
                        return (
                          <CommandGroup key={series} heading={series}>
                            <CommandItem
                              value={seriesKey}
                              onSelect={() => toggleModel(seriesKey)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSeriesSelected || allModelsSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="font-semibold">{series} (alle)</span> ({seriesCount})
                            </CommandItem>
                            {models.map((model) => {
                              const count = filterOptions.modelCounts.get(model) || 0;
                              return (
                                <CommandItem
                                  key={model}
                                  value={model}
                                  onSelect={() => toggleModel(model)}
                                  className="pl-8"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      filters.models.includes(model) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {model} ({count})
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        );
                      });
                    } else {
                      // Flat list for non-BMW brands
                      return (
                        <CommandGroup>
                          {filterOptions.models.map((model) => {
                            const count = filterOptions.modelCounts.get(model) || 0;
                            return (
                              <CommandItem
                                key={model}
                                value={model}
                                onSelect={() => toggleModel(model)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    filters.models.includes(model) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {model} ({count})
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      );
                    }
                  }
                })()}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {filters.models.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.models.map((model) => (
              <Button
                key={model}
                variant="secondary"
                size="sm"
                onClick={() => toggleModel(model)}
                className="h-7 text-xs"
              >
                {model}
                <span className="ml-1">×</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Fuel Types - Collapsible */}
      {filterOptions.fuelTypes && filterOptions.fuelTypes.length > 0 && (
        <Collapsible open={showFuelTypes} onOpenChange={setShowFuelTypes} className="mb-6">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-medium text-sm hover:text-foreground mb-3"
            >
              <span>Kraftstoff</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showFuelTypes ? "transform rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3">
              {filterOptions.fuelTypes.map((fuel) => (
                <div key={fuel} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fuel-${fuel}`}
                    checked={filters.fuelTypes.includes(fuel)}
                    onCheckedChange={() => toggleFuelType(fuel)}
                  />
                  <Label
                    htmlFor={`fuel-${fuel}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {fuel.replace(/^Plugin Hybrid-Benzin$/i, "Plugin Hybrid")}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Vehicle Type - Collapsible */}
      {filterOptions.vehicleTypes && filterOptions.vehicleTypes.length > 0 && (
        <>
          <Separator className="mb-6" />
          <Collapsible open={showVehicleTypes} onOpenChange={setShowVehicleTypes} className="mb-6">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-medium text-sm hover:text-foreground mb-3"
              >
                <span>Fahrzeugtyp</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showVehicleTypes ? "transform rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3">
                {filterOptions.vehicleTypes.map((vehicleType) => (
                  <div key={vehicleType} className="flex items-center space-x-2">
                    <Checkbox
                      id={`vehicleType-${vehicleType}`}
                      checked={filters.vehicleTypes.includes(vehicleType)}
                      onCheckedChange={() => toggleVehicleType(vehicleType)}
                    />
                    <Label
                      htmlFor={`vehicleType-${vehicleType}`}
                      className="text-sm font-normal cursor-pointer flex-1 flex items-center space-x-2"
                    >
                      <span className="text-primary flex-shrink-0">
                        {getVehicleTypeIcon(vehicleType)}
                      </span>
                      <span>{vehicleType}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      {/* Advanced Filters - Collapsible */}
      <Separator className="mb-4" />
      <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto font-normal text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <span>Weitere Filter anzeigen</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showAdvancedFilters ? "transform rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6">
          {/* Year Range */}
          <div className="mb-6">
            <Label className="mb-4 block">
              Baujahr: {filters.yearRange[0]} - {filters.yearRange[1]}
            </Label>
            <Slider
              value={filters.yearRange}
              onValueChange={(value) => updateFilters({ yearRange: value as [number, number] })}
              min={minYear}
              max={maxYear}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{minYear}</span>
              <span>{maxYear}</span>
            </div>
          </div>

              {/* Transmission */}
              {filterOptions.transmissionTypes && filterOptions.transmissionTypes.length > 0 && (
                <>
                  <Separator className="mb-6" />
                  <div className="mb-6">
                    <Label className="mb-3 block">Getriebe</Label>
                    <div className="space-y-3">
                      {filterOptions.transmissionTypes.map((transmission) => (
                        <div key={transmission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`transmission-${transmission}`}
                            checked={filters.transmissionTypes.includes(transmission)}
                            onCheckedChange={() => toggleTransmission(transmission)}
                          />
                          <Label
                            htmlFor={`transmission-${transmission}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {transmission}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}


              {/* MwSt. (VAT) Filter */}
              <div>
                <Separator className="mb-6" />
                <Label className="mb-3 block font-medium">MwSt.</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vat-displayable"
                      checked={filters.vatDisplayable === true}
                      onCheckedChange={(checked) => {
                        updateFilters({
                          vatDisplayable: checked ? true : null,
                        });
                      }}
                    />
                    <Label
                      htmlFor="vat-displayable"
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      MwSt. ausweisbar
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vat-not-displayable"
                      checked={filters.vatDisplayable === false}
                      onCheckedChange={(checked) => {
                        updateFilters({
                          vatDisplayable: checked ? false : null,
                        });
                      }}
                    />
                    <Label
                      htmlFor="vat-not-displayable"
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      MwSt. nicht ausweisbar
                    </Label>
                  </div>
                </div>
              </div>

          {/* Exterior Colors */}
          {filterOptions.exteriorColors && filterOptions.exteriorColors.length > 0 && (
            <>
              <Separator className="mb-6" />
              <div className="mb-6">
                <Label className="mb-3 block">Außenfarbe</Label>
                <div className="space-y-3">
                  {filterOptions.exteriorColors.map((color) => (
                    <div key={color} className="flex items-center space-x-2">
                      <Checkbox
                        id={`color-${color}`}
                        checked={filters.exteriorColors.includes(color)}
                        onCheckedChange={() => toggleExteriorColor(color)}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      <Label
                        htmlFor={`color-${color}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {color}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Equipment - kategorisch sortiert */}
          {filterOptions.equipment && filterOptions.equipment.length > 0 && (() => {
            const categoriesWithItems = EQUIPMENT_FILTER_CATEGORIES
              .map((cat) => ({
                ...cat,
                items: cat.items.filter((allowed) =>
                  equipmentMatchesOptions(allowed, filterOptions.equipment)
                ),
              }))
              .filter((cat) => cat.items.length > 0);

            if (categoriesWithItems.length === 0) return null;

            return (
              <>
                <Separator className="mb-6" />
                <div className="mb-6 space-y-5">
                  <Label className="mb-3 block">Ausstattung</Label>
                  {categoriesWithItems.map((category) => (
                    <div key={category.label}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {category.label}
                      </p>
                      <div className="space-y-2">
                        {category.items.map((eq) => (
                          <div key={eq} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipment-${eq}`}
                              checked={filters.equipment.includes(eq)}
                              onCheckedChange={() => toggleEquipment(eq)}
                            />
                            <Label
                              htmlFor={`equipment-${eq}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {eq}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </CollapsibleContent>
      </Collapsible>
      </div>
    </div>
  );
};

export default VehicleFilters;
