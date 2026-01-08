import { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { brandLogos } from "@/lib/brandLogos";

const BrandSelector = () => {
  const { data: vehicles, isLoading } = useVehicles();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

  // Calculate scroll amount: one logo width + gap
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const firstChild = container.firstElementChild as HTMLElement;
    if (!firstChild) return;

    // Get logo width + gap (40px = 2.5rem = gap-10)
    const logoWidth = firstChild.offsetWidth;
    const gap = 40; // gap-10 in pixels
    const scrollAmount = logoWidth + gap;

    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Check scroll position on mount and when brands change
  useEffect(() => {
    if (scrollContainerRef.current && brandsWithLogo.length > 0) {
      const timer = setTimeout(() => {
        handleScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsWithLogo.length]);

  if (isLoading || !brandsWithLogo || brandsWithLogo.length === 0) {
    return null;
  }

  // Calculate if we need arrows (more than 5 logos)
  const hasMoreThan5 = brandsWithLogo.length > 5;

  return (
    <section className="relative w-full bg-gradient-to-b from-gray-50 to-white border-y border-gray-200/50 overflow-hidden">
      {/* Navigation Arrows - only show if more than 5 logos */}
      {hasMoreThan5 && showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-primary shadow-xl border border-gray-200/50 rounded-full"
          aria-label="Nach links scrollen"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}
      {hasMoreThan5 && showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-primary shadow-xl border border-gray-200/50 rounded-full"
          aria-label="Nach rechts scrollen"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Viewport Container - shows exactly 5 logos */}
      <div className="w-full overflow-hidden relative">
        {/* Brands Container - scrollable with padding equal to gap */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-10 items-center overflow-x-auto scrollbar-hide py-10 md:py-12"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingLeft: "2.5rem", // gap-10 = 40px (same as gap between logos)
            paddingRight: "2.5rem", // gap-10 = 40px (same as gap between logos)
          }}
        >
          {brandsWithLogo.map(({ brand, logoKey }) => {
            const LogoComponent = brandLogos[logoKey] || brandLogos[brand];
            if (!LogoComponent) return null;

            return (
              <Link
                key={brand}
                to={`/fahrzeuge?brand=${encodeURIComponent(brand)}`}
                className="group flex-shrink-0 transition-all duration-300 hover:scale-110"
                style={{
                  // Calculate width: (viewport width - 2*padding - 4*gaps) / 5
                  // Viewport is 100vw, padding is 2.5rem each side (40px), gap is 2.5rem (40px)
                  width: "calc((100vw - 5rem - 10rem) / 5)", // 5rem (2*2.5rem padding) + 10rem (4*2.5rem gaps) = 15rem total spacing, divided by 5
                  minWidth: "96px", // Minimum width for mobile (slightly smaller)
                }}
              >
                <div className="flex flex-col items-center justify-center w-full aspect-square">
                  <div className="w-full h-full p-3 md:p-4 lg:p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex items-center justify-center">
                    <div className="text-gray-600 group-hover:text-primary transition-colors w-full h-full">
                      <LogoComponent />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default BrandSelector;
