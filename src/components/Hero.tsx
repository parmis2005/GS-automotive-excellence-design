import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, Clock, ChevronDown, ArrowRight } from "lucide-react";
import slider1 from "@/assets/slider-1.jpg";
import slider2 from "@/assets/slider-2.jpg";
import slider3 from "@/assets/slider-3.jpg";

const Hero = () => {
  // Use the first slider image as background
  const backgroundImage = slider1;

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImage}
          alt="GS Automobile Rheinland"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e13] via-[#0a0e13]/85 to-[#0a0e13]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e13] via-transparent to-transparent" />
      </div>

      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 100%)",
        }}
      />

      {/* Main Container */}
      <div className="container mx-auto px-6 max-w-6xl relative z-10 py-24 lg:py-32">
        <div className="max-w-4xl text-white">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium mb-8 backdrop-blur-sm">
            <Shield className="w-4 h-4" />
            Ihr vertrauensvoller Partner im Rheinland
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 tracking-tight">
            Finden Sie Ihr{" "}
            <span className="text-primary">perfektes</span> Fahrzeug
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/75 mb-12 leading-relaxed max-w-2xl font-light">
            Geprüfte Gebrauchtwagen zu fairen Preisen. Transparente Beratung
            und schnelle Abwicklung.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              variant="default"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white border-0 transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-primary/25 text-base px-8 py-7 h-auto font-semibold rounded-lg"
            >
              Fahrzeuge ansehen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-2 border-white/20 text-white hover:bg-white/5 hover:border-white/30 transition-all duration-200 hover:scale-[1.02] text-base px-8 py-7 h-auto font-semibold rounded-lg backdrop-blur-sm"
            >
              Auto verkaufen
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-8 text-sm">
            <div className="flex items-center gap-3 text-white/70">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Geprüfte Qualität</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">10+ Jahre Erfahrung</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Schnelle Abwicklung</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-white/30 hover:text-white/50 transition-colors z-10">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce" />
        </div>
        <span className="text-xs uppercase tracking-widest font-medium">Scrollen</span>
      </div>
    </section>
  );
};

export default Hero;
