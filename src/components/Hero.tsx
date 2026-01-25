const Hero = () => {
  const backgroundImage =
    "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/Screenshot%202026-01-07%20at%2010.39.00.png";

  return (
    <section
      id="home"
      className="relative overflow-hidden"
      aria-label="Hero Section"
    >
      {/* Background Image */}
      <div className="relative z-0 w-full overflow-hidden">
        <img
          src={backgroundImage}
          alt="GS Automobile Rheinland Autohaus mit Fahrzeugen"
          className="w-full h-auto block"
          style={{ 
            width: '100%', 
            height: 'auto',
            display: 'block',
            clipPath: 'inset(60px 0 10px 0)',
            marginTop: '-60px',
            marginBottom: '-10px'
          }}
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Text-Block (center-top) */}
      <div 
        className="absolute z-10 left-1/2 transform -translate-x-1/2 text-center"
        style={{
          top: 'clamp(245px, calc(12vh + 155px), 305px)',
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
    </section>
  );
};

export default Hero;
