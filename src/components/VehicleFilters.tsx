import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Search, X } from "lucide-react";
import type { VehicleFiltersState } from "@/pages/VehiclesPage";

interface VehicleFiltersProps {
  filters: VehicleFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<VehicleFiltersState>>;
  filterOptions: {
    brands: string[];
    fuelTypes: string[];
    transmissionTypes: string[];
    exteriorColors: string[];
    equipment: string[];
  };
}

const VehicleFilters = ({ filters, setFilters, filterOptions }: VehicleFiltersProps) => {
  const currentYear = new Date().getFullYear();
  const maxPrice = 200000;
  const minPrice = 0;
  const minYear = 2000;
  const maxYear = currentYear + 1;

  const updateFilters = (updates: Partial<VehicleFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const toggleBrand = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
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
    <div className="bg-card border border-border rounded-lg p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-6">Filter</h2>

      {/* Search */}
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

      <Separator className="mb-6" />

      {/* Price Range */}
      <div className="mb-6">
        <Label className="mb-4 block">
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

      <Separator className="mb-6" />

      {/* Brands */}
      <div className="mb-6">
        <Label className="mb-3 block">Marke</Label>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {filterOptions.brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={filters.brands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label
                htmlFor={`brand-${brand}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Fuel Types */}
      <div className="mb-6">
        <Label className="mb-3 block">Kraftstoff</Label>
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
                {fuel}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Transmission */}
      {filterOptions.transmissionTypes.length > 0 && (
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

      {/* Exterior Colors */}
      {filterOptions.exteriorColors.length > 0 && (
        <>
          <Separator className="mb-6" />
          <div className="mb-6">
            <Label className="mb-3 block">Außenfarbe</Label>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {filterOptions.exteriorColors.map((color) => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={`color-${color}`}
                    checked={filters.exteriorColors.includes(color)}
                    onCheckedChange={() => toggleExteriorColor(color)}
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

      {/* Equipment - Show top 20 most common items */}
      {filterOptions.equipment.length > 0 && (
        <>
          <Separator className="mb-6" />
          <div className="mb-6">
            <Label className="mb-3 block">Ausstattung</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filterOptions.equipment.slice(0, 50).map((eq) => (
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
            {filterOptions.equipment.length > 50 && (
              <p className="text-xs text-muted-foreground mt-2">
                + {filterOptions.equipment.length - 50} weitere Ausstattungen
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VehicleFilters;
