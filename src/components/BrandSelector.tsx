import { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";

const BrandSelector = () => {
  const { data: vehicles, isLoading } = useVehicles();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Extract unique brands from vehicles with count
  const brandsWithCount = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    const brandCounts = new Map<string, number>();
    vehicles.forEach((vehicle) => {
      if (vehicle.brand) {
        brandCounts.set(vehicle.brand, (brandCounts.get(vehicle.brand) || 0) + 1);
      }
    });

    // Sort brands alphabetically
    return Array.from(brandCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([brand, count]) => ({ brand, count }));
  }, [vehicles]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 300;
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
    if (scrollContainerRef.current && brandsWithCount.length > 0) {
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(() => {
        handleScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsWithCount.length]);

  if (isLoading) {
    return (
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-600">Marken werden geladen...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!brandsWithCount || brandsWithCount.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Du suchst eine bestimmte Marke?
          </h2>
          <div className="flex items-center gap-2">
            {showLeftArrow && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll("left")}
                className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                aria-label="Nach links scrollen"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {showRightArrow && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll("right")}
                className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                aria-label="Nach rechts scrollen"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {brandsWithCount.map(({ brand, count }) => (
            <Link
              key={brand}
              to={`/fahrzeuge?brand=${encodeURIComponent(brand)}`}
              className="flex-shrink-0 group"
            >
              <div className="flex flex-col items-center justify-center p-4 md:p-6 w-24 md:w-28 h-24 md:h-28 border-2 border-gray-200 rounded-lg bg-white hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-gray-700 group-hover:text-primary transition-colors mb-1">
                  {brand}
                </div>
                <div className="text-xs text-gray-500 group-hover:text-primary/80 transition-colors">
                  {count} {count === 1 ? "Fahrzeug" : "Fahrzeuge"}
                </div>
              </div>
            </Link>
          ))}
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
