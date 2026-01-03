import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-showroom.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="GS Automobile Rheinland Showroom"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl">
          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 animate-fade-up text-background">
            Jahreswagen & junge Gebrauchtwagen
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-background/90 max-w-xl mb-8 animate-fade-up stagger-1">
            GS Automobile Rheinland steht seit vielen Jahren für Kompetenz, 
            Verlässlichkeit und ein ausgezeichnetes Preis-Leistungs-Verhältnis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up stagger-2">
            <Button variant="hero" size="xl" className="group">
              Zur Fahrzeugsuche
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
