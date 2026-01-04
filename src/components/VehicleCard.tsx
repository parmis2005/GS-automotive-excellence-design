import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Calendar, ArrowRight, Download, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Vehicle } from "@/types/vehicle";

interface VehicleCardProps extends Vehicle {}

const VehicleCard = ({
  id,
  image,
  brand,
  model,
  price,
  year,
  mileage,
  fuel,
  isNew,
  power,
  powerKw,
  transmission,
  exteriorColor,
  interiorColor,
  exposeUrl,
  offerUrl,
}: VehicleCardProps) => {
  return (
    <div className="group relative bg-background rounded-lg overflow-hidden hover-lift border border-border shadow-soft">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={image}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badge */}
        {isNew && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
            Neu eingetroffen
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Brand & Model */}
        <div className="mb-3">
          <span className="text-xs text-primary font-semibold uppercase tracking-wider">
            {brand}
          </span>
          <h3 className="font-display text-xl text-foreground mt-1">
            {model}
          </h3>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {year}
          </div>
          {mileage > 0 && (
            <div className="flex items-center gap-1">
              <Gauge className="w-4 h-4" />
              {mileage.toLocaleString("de-DE")} km
            </div>
          )}
          <div className="flex items-center gap-1">
            <Fuel className="w-4 h-4" />
            {fuel}
          </div>
          {transmission && (
            <div className="flex items-center gap-1">
              {transmission}
            </div>
          )}
          {power && (
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {power} PS
            </div>
          )}
        </div>

        {/* Colors */}
        {(exteriorColor || interiorColor) && (
          <div className="mb-4 text-xs text-muted-foreground space-y-1">
            {exteriorColor && (
              <div>
                <span className="font-medium">Außen:</span> {exteriorColor}
              </div>
            )}
            {interiorColor && (
              <div>
                <span className="font-medium">Innen:</span> {interiorColor}
              </div>
            )}
          </div>
        )}

        {/* Price & Actions */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Preis ab</span>
              <div className="font-display text-2xl text-primary">
                {price.toLocaleString("de-DE")} €
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {exposeUrl && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(exposeUrl, '_blank');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exposé
              </Button>
            )}
            <Link to={`/fahrzeuge/${id}`} className={exposeUrl ? "flex-1" : "w-full"}>
              <Button
                variant="default"
                size="sm"
                className="w-full"
              >
                Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
