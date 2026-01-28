import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { generateTitle } from "@/utils/seo";
import VehiclePurchaseForm from "@/components/VehiclePurchaseForm";

const heroImageUrl =
  "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/4ccb78a6-4be4-4836-b271-138491733554.jpg";

const steps = [
  {
    title: "Fahrzeugdaten senden",
    description: "Kurzformular mit Eckdaten und Bildern senden – wir melden uns umgehend.",
  },
  {
    title: "Transparente Bewertung",
    description: "Sie erhalten ein faires, marktgerechtes Angebot mit klarer Preisstruktur.",
  },
  {
    title: "Sofortige Auszahlung",
    description: "Schnelle Abwicklung vor Ort – inklusive Abmeldung und sicherer Zahlung.",
  },
];

const highlights = [
  "Kostenlose & unverbindliche Bewertung",
  "Schnelle Terminvergabe in Krefeld",
  "Faire Preise durch Marktanalyse",
];

const VehiclePurchasePage = () => {
  const location = useLocation();
  const seoData = {
    title: generateTitle("Fahrzeugankauf"),
    description:
      "Fahrzeugankauf bei GS Automobile Rheinland: schnelle Bewertung, faire Preise und sofortige Auszahlung in Krefeld.",
    image: heroImageUrl,
    url: "https://www.gs-automobile-rheinland.de/fahrzeugankauf",
    type: "website" as const,
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.key]);

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} />
      <Navbar />
      <main>
        <section className="relative min-h-[70vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImageUrl}
              alt="Fahrzeugankauf bei GS Automobile Rheinland"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-background/40 to-background/80 backdrop-blur-sm" />
          </div>

          <div className="relative z-10">
            <div className="container mx-auto px-6 py-24 lg:py-32">
              <div className="max-w-2xl text-white">
                <p className="text-xs tracking-[0.4em] uppercase text-white/70 mb-4">
                  Fahrzeugankauf
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Verkaufen Sie Ihr Fahrzeug schnell, fair und ohne Stress.
                </h1>
                <p className="text-lg text-white/80 leading-relaxed mb-8">
                  Wir bewerten Ihr Fahrzeug transparent und zahlen sofort aus. Persönlicher Service,
                  klare Abläufe und eine faire Preisgestaltung – direkt in Krefeld.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Button asChild variant="hero" size="lg" className="justify-center">
                    <a href="#vehicle-purchase-form">Kostenlose Bewertung starten</a>
                  </Button>
                  <Button asChild variant="white" size="lg" className="justify-center">
                    <a href="tel:021519422262">Direkt anrufen</a>
                  </Button>
                </div>

                <div className="grid gap-3">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-white/85">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ankauf-prozess" className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                So funktioniert der Ankauf
              </h2>
              <div className="w-20 h-0.5 bg-primary mx-auto mb-4" />
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ein klarer Prozess, der Ihnen Zeit spart und den Verkauf angenehm macht.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-xl border border-border bg-background p-6 shadow-soft"
                >
                  {index < steps.length - 1 && (
                    <span className="pointer-events-none absolute left-full top-1/2 hidden h-0.5 w-8 -translate-y-1/2 bg-primary/70 md:block" />
                  )}
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold mb-4">
                    0{index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <VehiclePurchaseForm />

        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="rounded-2xl bg-primary text-white p-10 md:p-14 shadow-glow">
              <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                    Jetzt unverbindlich anfragen
                  </h2>
                  <p className="text-white/85 text-lg leading-relaxed">
                    Senden Sie uns Fahrzeugdaten oder rufen Sie direkt an. Wir melden uns schnell
                    mit einem verbindlichen Angebot.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <Button asChild variant="white" size="lg" className="justify-center">
                    <a href="tel:021519422262">02151 94 222 62</a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="justify-center border-white text-white hover:bg-white hover:text-primary"
                  >
                    <a href="mailto:info@gsauto.de">info@gsauto.de</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default VehiclePurchasePage;
