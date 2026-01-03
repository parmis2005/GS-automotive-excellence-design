import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Calendar, ArrowRight } from "lucide-react";

interface VehicleCardProps {
  image: string;
  brand: string;
  model: string;
  price: number;
  year: number;
  mileage: number;
  fuel: string;
  isNew?: boolean;
}

const VehicleCard = ({
  image,
  brand,
  model,
  price,
  year,
  mileage,
  fuel,
  isNew,
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
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {year}
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            {mileage.toLocaleString("de-DE")} km
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="w-4 h-4" />
            {fuel}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <span className="text-xs text-muted-foreground">Preis ab</span>
            <div className="font-display text-2xl text-primary">
              {price.toLocaleString("de-DE")} €
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
