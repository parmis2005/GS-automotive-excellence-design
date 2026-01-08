import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image-new.png";

const Hero = () => {
  const backgroundImage = heroImage;

  return (
    <section
      id="home"
      className="relative overflow-hidden"
      aria-label="Hero Section"
    >
      {/* Background Image */}
      <div className="relative z-0 w-full">
        <img
          src={backgroundImage}
          alt="GS Automobile Rheinland Autohaus mit Fahrzeugen"
          className="w-full h-auto block"
          style={{ 
            width: '100%', 
            height: 'auto',
            display: 'block'
          }}
          loading="eager"
          fetchPriority="high"
        />
        
        {/* Overlay - nur Himmelbereich oben abdunkeln */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 50% 18%, rgba(0,0,0,0.45), rgba(0,0,0,0) 55%),
              radial-gradient(circle at 50% 92%, rgba(0,0,0,0.25), rgba(0,0,0,0) 55%),
              linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 55%)
            `
          }}
        />
        
        {/* Subtile Vignette an den Rändern */}
        <div 
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 150px rgba(0, 0, 0, 0.12), inset 0 0 80px rgba(0, 0, 0, 0.08)'
          }}
        />
      </div>

      {/* Text-Block (center-top) */}
      <div 
        className="absolute z-10 left-1/2 transform -translate-x-1/2 text-center"
        style={{
          top: 'clamp(15px, calc(12vh - 75px), 75px)',
          maxWidth: '900px',
          padding: '0 24px',
          width: '100%'
        }}
      >
        <h1 
          className="text-white font-extrabold leading-tight mb-3 md:mb-4"
          style={{
            fontSize: 'clamp(34px, 4.6vw, 64px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          Ihr Auto wartet auf Sie!
        </h1>
        
        <p 
          className="text-white"
          style={{
            fontSize: 'clamp(14px, 1.4vw, 18px)',
            opacity: 0.9,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          Premium Neu- & Gebrauchtwagen
        </p>
      </div>

      {/* CTA Button (center-bottom) */}
      <div 
        className="absolute z-10 left-1/2 transform -translate-x-1/2"
        style={{
          bottom: 'clamp(8px, 2vh, 60px)',
          width: '100%',
          maxWidth: '420px',
          padding: '0 24px'
        }}
      >
        <Link to="/fahrzeuge" className="block w-full">
          <button
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3"
            style={{
              padding: 'clamp(12px, 3vh, 18px) clamp(20px, 5vw, 32px)',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 16px 50px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)';
            }}
            aria-label="Fahrzeuge ansehen"
          >
            <span className="hidden md:inline">Fahrzeuge ansehen</span>
            <span className="md:hidden">Ansehen</span>
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </Link>
      </div>
    </section>
  );
};

export default Hero;
