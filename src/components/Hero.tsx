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
        {/* Nebel/Übergang – weicher Übergang zum Content darunter */}
        <div className="absolute inset-x-0 bottom-0 h-40 md:h-56 bg-gradient-to-b from-transparent via-background/20 to-background" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background/50" />

        {/* Text-Block – tiefer gesetzt, näher an der Schnellsuche */}
        <div 
          className="absolute z-10 left-1/2 transform -translate-x-1/2 text-center"
          style={{
            top: '32%',
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
