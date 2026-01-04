import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Calendar, ArrowRight, Download, Zap, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import type { Vehicle } from "@/types/vehicle";
import { Badge } from "@/components/ui/badge";

interface VehicleListItemProps extends Vehicle {
  isFirst?: boolean; // Optional prop to mark first item
}

const VehicleListItem = ({
  id,
  image,
  brand,
  model,
  price,
  year,
  mileage,
  fuel,
  power,
  powerKw,
  transmission,
  exteriorColor,
  interiorColor,
  exposeUrl,
  offerUrl,
  internalNumber,
  isFirst = false,
}: VehicleListItemProps) => {
  return (
    <div className="group bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col md:flex-row">
        {/* Image - Left Side */}
        <div className="relative w-full md:w-96 lg:w-[32rem] flex-shrink-0 bg-secondary overflow-hidden">
          <div className="relative w-full aspect-[4/3] p-1">
            <img
              src={image}
              alt={`${brand} ${model}`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                  {brand}
                </span>
                {internalNumber && (
                  <Badge variant="outline" className="text-xs">
                    {internalNumber}
                  </Badge>
                )}
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                {model}
              </h3>
            </div>
            
            {/* Price */}
            <div className="text-right">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">
                {price.toLocaleString("de-DE")} €
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {year && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Erstzulassung</span>
                  <span className="font-semibold text-sm">{year}</span>
                </div>
              </div>
            )}

            {mileage > 0 && (
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Kilometerstand</span>
                  <span className="font-semibold text-sm">{mileage.toLocaleString("de-DE")} km</span>
                </div>
              </div>
            )}

            {fuel && (
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Kraftstoff</span>
                  <span className="font-semibold text-sm">{fuel}</span>
                </div>
              </div>
            )}

            {transmission && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Getriebe</span>
                  <span className="font-semibold text-sm">{transmission}</span>
                </div>
              </div>
            )}

            {power && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Leistung</span>
                  <span className="font-semibold text-sm">
                    {powerKw ? `${powerKw} kW / ` : ''}{power} PS
                  </span>
                </div>
              </div>
            )}

            {exteriorColor && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Außenfarbe</span>
                  <span className="font-semibold text-sm">{exteriorColor}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-border">
            <Link to={`/fahrzeuge/${id}`} className="flex-1">
              <Button variant="default" className="w-full">
                Details ansehen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            {exposeUrl && (
              <Button
                variant="outline"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(exposeUrl, '_blank');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exposé
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "tel:021519422262";
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Anrufen
            </Button>
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:info@gsauto.de?subject=Anfrage zu ${encodeURIComponent(brand + " " + model)}`;
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              E-Mail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleListItem;
