import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { brandLogos } from "@/lib/brandLogos";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const BrandSelector = () => {
  const { data: vehicles, isLoading } = useVehicles();

  // Extract unique brands from vehicles with count, only if logo is available
  const brandsWithLogo = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    const brandCounts = new Map<string, number>();
    vehicles.forEach((vehicle) => {
      if (vehicle.brand) {
        brandCounts.set(vehicle.brand, (brandCounts.get(vehicle.brand) || 0) + 1);
      }
    });

    // Filter to only include brands with available logos
    return Array.from(brandCounts.entries())
      .map(([brand]) => {
        const normalizedBrand = brand.trim();
        // Try different variations to find matching logo
        let logoKey: string | null = null;
        
        if (brandLogos[normalizedBrand]) {
          logoKey = normalizedBrand;
        } else if (brandLogos[normalizedBrand.replace(/-/g, " ")]) {
          logoKey = normalizedBrand.replace(/-/g, " ");
        } else if (brandLogos[normalizedBrand.replace(/\s+/g, "-")]) {
          logoKey = normalizedBrand.replace(/\s+/g, "-");
        } else {
          // Try case-insensitive match
          const lowerBrand = normalizedBrand.toLowerCase();
          for (const key in brandLogos) {
            if (key.toLowerCase() === lowerBrand) {
              logoKey = key;
              break;
            }
          }
        }
        
        // Only include if logo was found
        if (!logoKey) return null;
        
        return {
          brand: normalizedBrand,
          logoKey,
          count: brandCounts.get(brand) || 0,
        };
      })
      .filter((item): item is { brand: string; logoKey: string; count: number } => item !== null)
      .sort((a, b) => {
        // Sort by brand name, but prioritize common brands
        const commonBrands = ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Ford"];
        const aIndex = commonBrands.indexOf(a.brand);
        const bIndex = commonBrands.indexOf(b.brand);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.brand.localeCompare(b.brand);
      });
  }, [vehicles]);

  if (isLoading || !brandsWithLogo || brandsWithLogo.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-gradient-to-b from-gray-50 to-white border-y border-gray-200/50 overflow-hidden py-10 md:py-12">
      <div className="relative px-12">
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 1,
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {brandsWithLogo.map(({ brand, logoKey }) => {
              const LogoComponent = brandLogos[logoKey] || brandLogos[brand];
              if (!LogoComponent) return null;

              return (
                <CarouselItem 
                  key={brand} 
                  className="pl-2 md:pl-4 basis-[calc((100vw-5rem-17.5rem)/8)] min-w-[100px]"
                >
                  <Link
                    to={`/fahrzeuge?brand=${encodeURIComponent(brand)}`}
                    className="group flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:scale-110"
                  >
                    <div className="text-gray-600 group-hover:text-primary transition-colors w-full h-full flex items-center justify-center">
                      <LogoComponent />
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-0 h-12 w-12 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-primary shadow-xl border border-gray-200/50 rounded-full" />
          <CarouselNext className="right-0 h-12 w-12 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-primary shadow-xl border border-gray-200/50 rounded-full" />
        </Carousel>
      </div>
    </section>
  );
};

export default BrandSelector;
