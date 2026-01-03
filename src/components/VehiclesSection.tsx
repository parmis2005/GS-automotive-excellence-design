import VehicleCard from "./VehicleCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";
import car5 from "@/assets/car-5.jpg";
import car6 from "@/assets/car-6.jpg";

const vehicles = [
  {
    image: car1,
    brand: "BMW",
    model: "520d Luxury Line",
    price: 34990,
    year: 2023,
    mileage: 18500,
    fuel: "Diesel",
    isNew: true,
  },
  {
    image: car2,
    brand: "Mercedes-Benz",
    model: "C 300 Coupé AMG",
    price: 42990,
    year: 2022,
    mileage: 25000,
    fuel: "Benzin",
    isNew: true,
  },
  {
    image: car3,
    brand: "Audi",
    model: "A4 Avant 40 TDI",
    price: 38500,
    year: 2023,
    mileage: 15000,
    fuel: "Diesel",
    isNew: false,
  },
  {
    image: car4,
    brand: "Volkswagen",
    model: "Golf GTI",
    price: 28990,
    year: 2023,
    mileage: 12000,
    fuel: "Benzin",
    isNew: false,
  },
  {
    image: car5,
    brand: "BMW",
    model: "X3 xDrive30d",
    price: 52990,
    year: 2022,
    mileage: 35000,
    fuel: "Diesel",
    isNew: false,
  },
  {
    image: car6,
    brand: "Mercedes-Benz",
    model: "GLC 300 4MATIC",
    price: 48500,
    year: 2023,
    mileage: 22000,
    fuel: "Benzin",
    isNew: true,
  },
];

const VehiclesSection = () => {
  return (
    <section id="vehicles" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-semibold uppercase tracking-wider text-sm mb-4">
            Unsere Fahrzeuge
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            Aktuelle Angebote
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Entdecken Sie unsere handverlesene Auswahl an Premium-Gebrauchtwagen 
            und Jahreswagen zu attraktiven Konditionen.
          </p>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle, index) => (
            <div 
              key={index} 
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <VehicleCard {...vehicle} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button variant="hero" size="xl" className="group">
            Alle Fahrzeuge anzeigen
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VehiclesSection;
