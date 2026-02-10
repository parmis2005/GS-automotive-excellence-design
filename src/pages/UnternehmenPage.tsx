import { useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BadgeCheck, CheckCircle2, Shield, Users } from "lucide-react";
import { generateTitle } from "@/utils/seo";
import { useVehicles } from "@/hooks/useVehicles";
import { brandLogos } from "@/lib/brandLogos";

const heroImageUrl =
  "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/ChatGPT%20Image%20Feb%208,%202026,%2002_18_40%20AM.png";

const UnternehmenPage = () => {
  const { data: vehicles } = useVehicles();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const seoData = {
    title: generateTitle("Unternehmen"),
    description:
      "GS Automobile Rheinland: fair, transparent, effizient. Schneller Bestand, attraktive Marktpreise und geprüfte Qualität.",
    image: heroImageUrl,
    url: "https://www.gs-automobile-rheinland.de/unternehmen",
    type: "website" as const,
  };

  const reasons = [
    {
      title: "Gepflegte Leasingfahrzeuge mit lückenloser Historie",
      text: "Überwiegend deutsche Leasingfahrzeuge mit dokumentierten Inspektionen in Vertragswerkstätten.",
    },
    {
      title: "Geprüfte Qualität durch unabhängige Gutachten",
      text: "Umfassende Begutachtung durch Prüforganisationen wie DEKRA – transparent und nachvollziehbar.",
    },
    {
      title: "Attraktive Auswahl führender Hersteller",
      text: "BMW, Mini, Mercedes, Volkswagen, Opel, Ford, Fiat und viele weitere – professionell aufbereitet.",
    },
    {
      title: "Kundenzufriedenheit als oberstes Ziel",
      text: "Persönliche Begleitung von der ersten Anfrage bis zur Schlüsselübergabe.",
    },
  ];

  const highlights = [
    "Schneller Bestand, zügig verkauft – ohne künstlich überhöhte Margen",
    "Transparente Kalkulation mit dauerhaft attraktiven Marktpreisen",
    "Aktueller Fahrzeugbestand ohne versteckte Aufschläge",
  ];

  const brandsWithLogo = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    const brandCounts = new Map<string, number>();
    vehicles.forEach((vehicle) => {
      if (vehicle.brand) {
        brandCounts.set(vehicle.brand, (brandCounts.get(vehicle.brand) || 0) + 1);
      }
    });

    const commonOrder = [
      "BMW",
      "Mercedes-Benz",
      "Audi",
      "Volkswagen",
      "Ford",
      "Opel",
      "Citroën",
      "Mini",
      "Nissan",
      "Jeep",
      "Fiat",
      "Polestar",
      "Hyundai",
      "Kia",
    ];

    return Array.from(brandCounts.entries())
      .map(([brand]) => {
        const normalizedBrand = brand.trim();
        let logoKey: string | null = null;

        if (brandLogos[normalizedBrand]) logoKey = normalizedBrand;
        else if (brandLogos[normalizedBrand.replace(/-/g, " ")]) logoKey = normalizedBrand.replace(/-/g, " ");
        else if (brandLogos[normalizedBrand.replace(/\s+/g, "-")]) logoKey = normalizedBrand.replace(/\s+/g, "-");
        else {
          const lowerBrand = normalizedBrand.toLowerCase();
          for (const key in brandLogos) {
            if (key.toLowerCase() === lowerBrand) {
              logoKey = key;
              break;
            }
          }
        }

        if (!logoKey) return null;

        return {
          brand: normalizedBrand,
          logoKey,
          count: brandCounts.get(brand) || 0,
        };
      })
      .filter((item): item is { brand: string; logoKey: string; count: number } => item !== null)
      .sort((a, b) => {
        const aIndex = commonOrder.indexOf(a.brand);
        const bIndex = commonOrder.indexOf(b.brand);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.brand.localeCompare(b.brand);
      });
  }, [vehicles]);

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative min-h-[75vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImageUrl}
              alt="Unternehmen GS Automobile Rheinland"
              className="h-full w-full object-cover blur-[4px] scale-[1.03] transform-gpu"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/25" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-black/15 to-black/30" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-background/20 to-background" />
          </div>

          <div className="relative z-10 flex flex-col justify-end min-h-[75vh] pb-0">
            <div className="container mx-auto px-6 md:px-10 pb-16 md:pb-24 pt-20">
              <div className="max-w-5xl">
                <p className="text-sm tracking-[0.4em] uppercase text-white/80 mb-5">
                  Unternehmen
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-white mb-6 drop-shadow-lg">
                  Fair. Transparent. Effizient.
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl">
                  Unser Konzept: Schnell im Bestand – zügig verkauft. Attraktive Marktpreise ohne versteckte Aufschläge.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild variant="hero" size="lg" className="justify-center">
                    <Link to="/fahrzeuge">Fahrzeuge ansehen</Link>
                  </Button>
                  <Button asChild variant="white" size="lg" className="justify-center">
                    <a href="tel:021519422262">Jetzt beraten lassen</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Konzept */}
        <section className="py-20 md:py-24 bg-muted/20">
          <div className="container mx-auto px-6 md:px-10 max-w-6xl">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 text-center">
              Unser Konzept: <span className="text-primary">schnell, fair, klar</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-10 max-w-3xl mx-auto leading-relaxed">
              Fahrzeuge sollen nicht lange stehen – und das aus gutem Grund. Dank schlanker Strukturen und
              effizienter Abläufe kalkulieren wir transparent und bewusst knapp.
            </p>

            <div className="bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50 mb-16">
              <h3 className="font-display text-2xl font-semibold text-primary mb-6 text-center">
                Das Ergebnis für Sie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {highlights.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary/80 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 md:p-14 shadow-lg border border-primary/10 mb-20 lg:mx-[-2rem]">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-start">
                <div>
                  <p className="text-base tracking-[0.35em] uppercase text-primary/80 mb-4">
                    Zahlen & Fakten
                  </p>
                  <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-5">
                    GS Automobile Rheinland: Kennzahlen
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
                    Erfahrung, Vertrauen und ein stetig aktualisierter Bestand – klar, greifbar,
                    nachvollziehbar.
                  </p>
                  <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 px-8">
                    <Link to="/fahrzeuge">Zum Fahrzeugbestand</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="border-t-2 border-border/70 pt-7">
                    <div className="text-5xl md:text-6xl font-semibold text-foreground">
                      25<span className="text-primary">+</span>
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground mt-3">Jahre Erfahrung</p>
                  </div>
                  <div className="border-t-2 border-border/70 pt-7">
                    <div className="text-5xl md:text-6xl font-semibold text-foreground">
                      450<span className="text-primary">+</span>
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground mt-3">verkaufte Autos pro Jahr</p>
                  </div>
                  <div className="border-t-2 border-border/70 pt-7">
                    <div className="text-5xl md:text-6xl font-semibold text-foreground">
                      10.000<span className="text-primary">+</span>
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground mt-3">verkaufte Fahrzeuge</p>
                  </div>
                  <div className="border-t-2 border-border/70 pt-7">
                    <div className="text-5xl md:text-6xl font-semibold text-foreground">
                      100<span className="text-primary">%</span>
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground mt-3">geprüfte Fahrzeuge</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-display text-2xl md:text-3xl font-semibold mb-8 text-center">
              Warum sich der Fahrzeugkauf bei uns lohnt
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {reasons.map((reason, index) => (
                <div
                  key={reason.title}
                  className="bg-white rounded-xl p-8 md:p-9 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <span className="text-primary font-semibold text-lg">
                      {index + 1}
                    </span>
                  </div>
                  <h4 className="font-semibold text-primary mb-3 text-lg">{reason.title}</h4>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {reason.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center max-w-3xl mx-auto mb-16">
              <h3 className="font-display text-2xl md:text-3xl font-semibold mb-4">
                Attraktive Auswahl führender Hersteller
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
                {brandsWithLogo.map(({ brand, logoKey }) => {
                  const LogoComponent = brandLogos[logoKey] || brandLogos[brand];
                  if (!LogoComponent) return null;
                  return (
                    <Link
                      key={brand}
                      to={`/fahrzeuge?brand=${encodeURIComponent(brand)}`}
                      className="group bg-white rounded-xl border border-border/60 p-4 flex items-center justify-center h-24 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div className="text-muted-foreground group-hover:text-primary transition-colors w-full h-full flex items-center justify-center">
                        <LogoComponent />
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <BadgeCheck className="h-4 w-4" />
                Professionell aufbereitet & kurzfristig verfügbar
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-primary mb-3">
                    Unser Team
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                    Ein eingespieltes Team aus erfahrenen Fachleuten – von Beratung über Einkauf bis zur Auslieferung.
                    Nicht ein einzelner Name steht im Vordergrund, sondern ein Team, das Verantwortung übernimmt.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 bg-primary">
          <div className="container mx-auto px-6 md:px-10 max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-8">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-5">
              GS Automobile Rheinland
            </h2>
            <p className="text-white/90 mb-10 text-base md:text-lg leading-relaxed">
              Ein Team. Ein Anspruch. Ihr Vertrauen. Wir freuen uns darauf, Sie bei der Suche nach Ihrem Wunschfahrzeug zu begleiten.
            </p>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
              <Link to="/fahrzeuge">Fahrzeuge entdecken</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UnternehmenPage;
