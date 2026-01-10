import slider1 from "@/assets/slider-1.jpg";
import autohausPlaceholder from "@/assets/autohaus-placeholder.jpeg";

const ImageGallery = () => {
  return (
    <section className="w-full bg-background py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 md:gap-8">
          {/* Left: Large portrait image (hochkant) */}
          <div className="relative w-full overflow-hidden rounded-xl lg:rounded-2xl shadow-xl">
            <div className="aspect-[2/3] lg:aspect-[3/4]">
              <img
                src={slider1}
                alt="Premium Fahrzeug im Autohaus"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: Two horizontal images stacked (waagerecht) */}
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Top horizontal image */}
            <div className="relative w-full overflow-hidden rounded-xl lg:rounded-2xl shadow-xl">
              <div className="aspect-[16/9]">
                <img
                  src={autohausPlaceholder}
                  alt="Autohaus Ausstellungsfläche"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Bottom horizontal image */}
            <div className="relative w-full overflow-hidden rounded-xl lg:rounded-2xl shadow-xl">
              <div className="aspect-[16/9]">
                <img
                  src={slider1}
                  alt="Fahrzeugdetail"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;
