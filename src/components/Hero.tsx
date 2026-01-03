import { Button } from "@/components/ui/button";
import { ChevronRight, Play } from "lucide-react";
import heroImage from "@/assets/hero-showroom.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="GS Automobile Rheinland Showroom"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Ihr Partner für Premium-Gebrauchtwagen
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-none mb-6 animate-fade-up stagger-1">
            <span className="text-foreground">Jahreswagen &</span>
            <br />
            <span className="gradient-text">Junge Gebrauchtwagen</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 animate-fade-up stagger-2">
            GS Automobile Rheinland steht seit vielen Jahren für Kompetenz, 
            Verlässlichkeit und ein ausgezeichnetes Preis-Leistungs-Verhältnis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up stagger-3">
            <Button variant="hero" size="xl" className="group">
              Fahrzeuge entdecken
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="glass" size="xl" className="group">
              <Play className="w-5 h-5" />
              Showroom Video
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-up stagger-4">
            <div className="text-center sm:text-left">
              <div className="font-display text-4xl md:text-5xl text-primary">15+</div>
              <div className="text-sm text-muted-foreground mt-1">Jahre Erfahrung</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="font-display text-4xl md:text-5xl text-primary">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Zufriedene Kunden</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="font-display text-4xl md:text-5xl text-primary">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Geprüfte Qualität</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
