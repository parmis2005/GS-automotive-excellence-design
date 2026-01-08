import { useMemo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { Button } from "@/components/ui/button";
import { brandLogos } from "@/lib/brandLogos";

const BrandSelector = () => {
  const { data: vehicles, isLoading } = useVehicles();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

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

  // Create duplicated array for infinite scrolling (3 sets: original + 2 duplicates)
  const duplicatedBrands = useMemo(() => {
    if (brandsWithLogo.length === 0) return [];
    return [...brandsWithLogo, ...brandsWithLogo, ...brandsWithLogo];
  }, [brandsWithLogo]);

  // Calculate scroll amount: one logo width + gap
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current || isScrolling) return;

    const container = scrollContainerRef.current;
    const firstChild = container.firstElementChild as HTMLElement;
    if (!firstChild) return;

    // Get logo width + gap (40px = 2.5rem = gap-10)
    const logoWidth = firstChild.offsetWidth;
    const gap = 40; // gap-10 in pixels
    const scrollAmount = logoWidth + gap;

    const { scrollLeft } = container;
    
    setIsScrolling(true);

    if (direction === "left") {
      container.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    } else {
      container.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }

    // Reset scrolling state after animation
    setTimeout(() => {
      setIsScrolling(false);
      checkAndResetScroll();
    }, 500);
  };

  // Check if we need to reset scroll position for infinite scroll
  const checkAndResetScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const singleSetWidth = scrollWidth / 3;

    // If we've scrolled past the second set, reset to the first set
    if (scrollLeft >= singleSetWidth * 2) {
      container.scrollLeft = scrollLeft - singleSetWidth;
    }
    // If we've scrolled before the first set, reset to the second set
    else if (scrollLeft < singleSetWidth) {
      container.scrollLeft = scrollLeft + singleSetWidth;
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current || isScrolling) return;

    checkAndResetScroll();

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Always show arrows since we have infinite scroll
    setShowLeftArrow(true);
    setShowRightArrow(true);
  };

  // Initialize scroll position to middle set
  useEffect(() => {
    if (scrollContainerRef.current && brandsWithLogo.length > 0) {
      const container = scrollContainerRef.current;
      const singleSetWidth = container.scrollWidth / 3;
      
      // Start in the middle set
      container.scrollLeft = singleSetWidth;
      
      // Set arrows after initialization
      setTimeout(() => {
        setShowLeftArrow(true);
        setShowRightArrow(true);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsWithLogo.length]);

  if (isLoading || !brandsWithLogo || brandsWithLogo.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-gradient-to-b from-gray-50 to-white border-y border-gray-200/50 overflow-hidden">
      {/* Navigation Arrows - always visible for infinite scroll */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          disabled={isScrolling}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-primary shadow-xl border border-gray-200/50 rounded-full disabled:opacity-50"
          aria-label="Nach links scrollen"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          disabled={isScrolling}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-primary shadow-xl border border-gray-200/50 rounded-full disabled:opacity-50"
          aria-label="Nach rechts scrollen"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Viewport Container */}
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
          {duplicatedBrands.map(({ brand, logoKey }, index) => {
            const LogoComponent = brandLogos[logoKey] || brandLogos[brand];
            if (!LogoComponent) return null;

            return (
              <Link
                key={`${brand}-${index}`}
                to={`/fahrzeuge?brand=${encodeURIComponent(brand)}`}
                className="group flex-shrink-0 transition-all duration-300 hover:scale-110"
                style={{
                  width: "80px", // Fixed width for consistency
                  minWidth: "80px",
                }}
              >
                <div className="flex flex-col items-center justify-center w-full aspect-square">
                  <div className="text-gray-600 group-hover:text-primary transition-colors w-full h-full flex items-center justify-center">
                    <LogoComponent />
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
