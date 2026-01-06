import slider1 from "@/assets/slider-1.jpg";

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
          style={{ objectPosition: 'left center' }}
        />
        {/* Light overlay with gradient - reduced opacity for brighter background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e13]/25 via-[#0a0e13]/20 to-[#0a0e13]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e13]/20 via-transparent to-transparent" />
      </div>

    </section>
  );
};

export default Hero;
