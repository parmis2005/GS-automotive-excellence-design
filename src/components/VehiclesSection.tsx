import VehicleCard from "./VehicleCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useMemo } from "react";

const VehiclesSection = () => {
  const { data: vehicles, isLoading, error } = useVehicles();

  // Get 6 most expensive vehicles for homepage
  const featuredVehicles = useMemo(() => {
    if (!vehicles) return [];
    return [...vehicles]
      .sort((a, b) => b.price - a.price)
      .slice(0, 6);
  }, [vehicles]);

  return (
    <section id="vehicles" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-primary mb-4">
            Aktuelle Fahrzeugangebote
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Entdecken Sie unsere handverlesene Auswahl an Premium-Gebrauchtwagen 
            und Jahreswagen zu attraktiven Konditionen.
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
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler beim Laden der Fahrzeuge</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Unbekannter Fehler"}
            </AlertDescription>
          </Alert>
        )}

        {/* Vehicles Grid - Show only 6 most expensive */}
        {featuredVehicles && featuredVehicles.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((vehicle, index) => (
                <div 
                  key={vehicle.id} 
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <VehicleCard {...vehicle} />
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Link to="/fahrzeuge">
                <Button variant="default" size="lg" className="group bg-primary hover:bg-primary/90 text-white shadow-md">
                  Alle Fahrzeuge anzeigen
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* Empty State */}
        {featuredVehicles && featuredVehicles.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Aktuell sind keine Fahrzeuge verfügbar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VehiclesSection;
