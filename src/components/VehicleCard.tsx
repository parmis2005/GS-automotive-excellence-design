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
    <div className="group relative bg-card rounded-xl overflow-hidden hover-lift border border-border/50">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        
        {/* Badge */}
        {isNew && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
            Neu eingetroffen
          </div>
        )}

        {/* Quick View Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button variant="hero" size="sm" className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            Details ansehen
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Brand & Model */}
        <div className="mb-3">
          <span className="text-xs text-primary font-semibold uppercase tracking-wider">
            {brand}
          </span>
          <h3 className="font-display text-2xl text-foreground mt-1">
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
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div>
            <span className="text-xs text-muted-foreground">Preis ab</span>
            <div className="font-display text-3xl text-primary">
              {price.toLocaleString("de-DE")} €
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
