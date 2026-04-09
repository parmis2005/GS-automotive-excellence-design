const Hero = () => {
  const backgroundImage =
    "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/Screenshot%202026-01-07%20at%2010.39.00.png";

  return (
    <section
      id="home"
      className="relative overflow-hidden"
      aria-label="Hero Section"
    >
      {/* Bild bestimmt die Höhe (width/height am img gegen CLS) — kein fester 21:9-Kasten, daher keine Letterbox-Streifen */}
      <div className="relative z-0 w-full overflow-hidden bg-background">
        <img
          src={backgroundImage}
          alt="GS Automobile Rheinland Autohaus mit Fahrzeugen"
          width={1920}
          height={828}
          className="block h-auto w-full max-w-none border-0 outline-none ring-0 [vertical-align:top] origin-center scale-[1.006] transform-gpu motion-reduce:scale-100"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {/* Nur dezenter Verlauf unten für Lesbarkeit über dem Bild (nicht bis zur grauen Seitenfarbe) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-black/35 md:h-36 md:to-black/40"
          aria-hidden
        />

        {/* Text-Block – tiefer gesetzt, näher an der Schnellsuche */}
        <div 
          className="absolute z-10 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 lg:top-[32%] lg:translate-y-0 text-center"
          style={{
            maxWidth: '90%',
            padding: '0 clamp(16px, 2vw, 24px)',
            width: '100%'
          }}
        >
        <h1 
          className="text-white font-extrabold leading-tight mb-3 md:mb-4"
          style={{
            fontSize: 'clamp(28px, 4.5vw, 64px)',
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
            fontSize: 'clamp(12px, 1.4vw, 18px)',
            opacity: 0.9,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          Jahreswagen & junge Gebrauchtwagen
        </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
