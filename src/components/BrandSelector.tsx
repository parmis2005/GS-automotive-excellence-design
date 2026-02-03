import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { brandLogos } from "@/lib/brandLogos";

/** Einmal aktivieren, um die Logo-Leiste mit allen verfügbaren Logos zu testen. Danach wieder auf false setzen. */
const SHOW_ALL_LOGOS_FOR_TEST = false;

const BrandSelector = () => {
  const { data: vehicles, isLoading } = useVehicles();

  // Im Testmodus: alle Logos aus der Map anzeigen (jedes Logo einmal). Sonst: nur Marken aus dem Bestand.
  const brandsWithLogo = useMemo(() => {
    if (SHOW_ALL_LOGOS_FOR_TEST) {
      const commonOrder = ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Ford", "Opel", "Citroën", "Mini", "Nissan", "Jeep", "Fiat", "Polestar", "Hyundai", "Kia"];
      const byComponent = new Map<React.ComponentType, string>();
      for (const key of Object.keys(brandLogos)) {
        const comp = brandLogos[key];
        if (!byComponent.has(comp)) byComponent.set(comp, key);
      }
      return Array.from(byComponent.entries())
        .map(([, logoKey]) => ({ brand: logoKey, logoKey, count: 0 }))
        .sort((a, b) => {
          const aIndex = commonOrder.indexOf(a.brand);
          const bIndex = commonOrder.indexOf(b.brand);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.brand.localeCompare(b.brand);
        });
    }

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

  // Duplicate brands for seamless infinite scrolling animation
  // We duplicate 3 times to ensure smooth continuous loop
  const duplicatedBrands = useMemo(() => {
    if (!brandsWithLogo || brandsWithLogo.length === 0) return [];
    
    // Duplicate 3 times for seamless infinite scroll
    const duplicated = [];
    for (let i = 0; i < 3; i++) {
      duplicated.push(...brandsWithLogo);
    }
    
    return duplicated;
  }, [brandsWithLogo]);

  if (!SHOW_ALL_LOGOS_FOR_TEST && (isLoading || !brandsWithLogo || brandsWithLogo.length === 0)) {
    return null;
  }

  return (
    <section className="relative w-full bg-gradient-to-b from-gray-50 to-white border-y border-gray-200/50 overflow-hidden py-10 md:py-12">
      {/* Section Title */}
      <div className="text-center mb-8 px-4">
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground/90">
          Markenauswahl in unserem Bestand
        </h2>
      </div>

      {/* Infinite scrolling logo bar - full width */}
      <div className="relative w-full overflow-hidden">
        <div 
          className="flex w-max"
          style={{
            animation: "scroll-logos 180s linear infinite",
            willChange: "transform",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = "running";
          }}
        >
          {/* First set of logos */}
          {duplicatedBrands.map(({ brand, logoKey }, index) => {
            const LogoComponent = brandLogos[logoKey] || brandLogos[brand];
            if (!LogoComponent) return null;

            return (
              <div
                key={`first-${brand}-${index}`}
                className="flex-shrink-0 md:mr-[28px] mr-[15px]"
              >
                <Link
                  to={`/fahrzeuge?brand=${encodeURIComponent(brand)}`}
                  className="group flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 md:h-[120px] md:min-h-[120px] md:w-[120px] md:pt-5 md:pb-5 h-[70px] min-h-[70px] w-[70px] pt-3 pb-3"
                >
                  <div className="text-gray-600 group-hover:text-primary transition-colors w-full h-full flex items-center justify-center md:scale-[1.1] scale-[1.0]" style={{ overflow: "visible" }}>
                    <LogoComponent />
                  </div>
                </Link>
              </div>
            );
          })}
          {/* Duplicate for seamless loop */}
          {duplicatedBrands.map(({ brand, logoKey }, index) => {
            const LogoComponent = brandLogos[logoKey] || brandLogos[brand];
            if (!LogoComponent) return null;

            return (
              <div
                key={`second-${brand}-${index}`}
                className="flex-shrink-0 md:mr-[28px] mr-[15px]"
              >
                <Link
                  to={`/fahrzeuge?brand=${encodeURIComponent(brand)}`}
                  className="group flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 md:h-[120px] md:min-h-[120px] md:w-[120px] md:pt-5 md:pb-5 h-[70px] min-h-[70px] w-[70px] pt-3 pb-3"
                >
                  <div className="text-gray-600 group-hover:text-primary transition-colors w-full h-full flex items-center justify-center md:scale-[1.1] scale-[1.0]" style={{ overflow: "visible" }}>
                    <LogoComponent />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="text-center mt-6 px-4">
        <p className="text-xs text-muted-foreground max-w-4xl mx-auto leading-relaxed">
          <span className="font-medium">Rechtlicher Hinweis:</span>
          Alle genannten Marken und Logos sind Eigentum der jeweiligen Hersteller.
          Wir sind kein Vertragshändler und stehen in keiner wirtschaftlichen Verbindung zu den genannten Marken.
          Die Logos dienen ausschließlich zur Filterung und Markenidentifikation.
        </p>
      </div>
    </section>
  );
};

export default BrandSelector;
