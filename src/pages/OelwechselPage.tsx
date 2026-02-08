import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Droplet, Gauge, Shield, Wrench } from "lucide-react";
import { generateTitle } from "@/utils/seo";

const heroImageUrl =
  "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/ChatGPT%20Image%20Feb%208,%202026,%2001_49_39%20AM.png";

const OelwechselPage = () => {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const seoData = {
    title: generateTitle("Ölwechsel"),
    description:
      "Professioneller Ölwechsel mit hochwertigen Ölen nach Herstellerfreigabe. Mehr Leistung, längere Lebensdauer, volle Sicherheit.",
    image: heroImageUrl,
    url: "https://www.gs-automobile-rheinland.de/oelwechsel",
    type: "website" as const,
  };

  const benefits = [
    {
      icon: Shield,
      title: "Herstellerfreigaben",
      text: "Wir verwenden ausschließlich geprüfte Öle mit passenden Spezifikationen.",
    },
    {
      icon: Gauge,
      title: "Mehr Leistung & Effizienz",
      text: "Frisches Öl reduziert Reibung und schützt den Motor zuverlässig.",
    },
    {
      icon: Droplet,
      title: "Saubere Motorkomponenten",
      text: "Gute Schmierung schützt vor Verschleiß und Ablagerungen.",
    },
  ];

  const included = [
    "Ölwechsel mit hochwertigem Markenöl",
    "Erneuerung des Ölfilters",
    "Sichtprüfung auf Undichtigkeiten",
    "Kontrolle der Füllstände",
    "Entsorgung Altöl nach Vorschrift",
    "Serviceeintrag auf Wunsch",
  ];

  const steps = [
    {
      icon: Wrench,
      title: "Fahrzeugdaten prüfen",
      text: "Wir ermitteln das passende Öl für Ihr Fahrzeug und Ihren Motor.",
    },
    {
      icon: Droplet,
      title: "Öl & Filter wechseln",
      text: "Öl ablassen, Filter ersetzen und mit dem richtigen Öl befüllen.",
    },
    {
      icon: CheckCircle2,
      title: "Sicherheitscheck",
      text: "Füllstände und Dichtheit prüfen – fertig und fahrbereit.",
    },
  ];

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
              alt="Ölwechsel bei GS Automobile Rheinland"
              className="h-full w-full object-cover blur-[4px] scale-[1.03] transform-gpu"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/20" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-black/10 to-black/25" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-background/20 to-background" />
          </div>

          <div className="relative z-10 flex flex-col justify-end min-h-[75vh] pb-0">
            <div className="container mx-auto px-6 md:px-10 pb-16 md:pb-24 pt-20">
              <div className="max-w-5xl">
                <p className="text-sm tracking-[0.4em] uppercase text-white/80 mb-5">
                  Ölwechsel
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-white mb-6 drop-shadow-lg">
                  Frisches Öl. Längere Lebensdauer.
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl">
                  Professioneller Ölwechsel nach Herstellerfreigabe – für maximale Performance und Sicherheit.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="hero"
                    size="lg"
                    className="justify-center"
                    onClick={() => setIsInquiryOpen(true)}
                  >
                    Termin anfragen
                  </Button>
                  <Button asChild variant="white" size="lg" className="justify-center">
                    <Link to="/fahrzeuge">Fahrzeuge ansehen</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-20 md:py-24 bg-muted/20">
          <div className="container mx-auto px-6 md:px-10 max-w-6xl">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 text-center">
              Ölwechsel mit <span className="text-primary">Qualitätsanspruch</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto leading-relaxed">
              Ein regelmäßiger Ölwechsel schützt Ihren Motor, verbessert die Effizienz und sorgt für
              dauerhaft ruhigen Lauf. Wir verwenden hochwertige Öle nach Herstellervorgaben.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="text-center bg-white rounded-xl p-8 md:p-9 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-primary mb-3 text-lg">{item.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50 mb-16">
              <h3 className="font-display text-2xl font-semibold text-primary mb-6 text-center">
                Unser Ölwechsel umfasst
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {included.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary/80 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="font-display text-2xl md:text-3xl font-semibold mb-8 text-center">
              So läuft der Ölwechsel ab
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="text-center bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50"
                  >
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-primary mb-3 text-lg">{step.title}</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 bg-primary">
          <div className="container mx-auto px-6 md:px-10 max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-8">
              <Droplet className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-5">
              Jetzt Ölwechsel terminieren
            </h2>
            <p className="text-white/90 mb-10 text-base md:text-lg leading-relaxed">
              Schnell, sauber, zuverlässig – wir kümmern uns um den gesamten Service.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={() => setIsInquiryOpen(true)}
            >
              Termin anfragen
            </Button>
          </div>
        </section>
      </main>

      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-[640px] p-8 sm:p-10 gap-6 border border-border/60 shadow-xl bg-background/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Termin anfragen</DialogTitle>
            <DialogDescription>
              Hinterlassen Sie Ihre Daten – wir melden uns schnellstmöglich bei Ihnen.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Vorname
                </label>
                <input
                  type="text"
                  className="w-full h-12 px-4 rounded-lg bg-muted/20 border border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground text-base placeholder:text-muted-foreground/70"
                  placeholder="Max"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nachname
                </label>
                <input
                  type="text"
                  className="w-full h-12 px-4 rounded-lg bg-muted/20 border border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground text-base placeholder:text-muted-foreground/70"
                  placeholder="Mustermann"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Telefonnummer
              </label>
              <input
                type="tel"
                className="w-full h-12 px-4 rounded-lg bg-muted/20 border border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground text-base placeholder:text-muted-foreground/70"
                placeholder="+49 123 456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                E-Mail
              </label>
              <input
                type="email"
                className="w-full h-12 px-4 rounded-lg bg-muted/20 border border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground text-base placeholder:text-muted-foreground/70"
                placeholder="max@beispiel.de"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nachricht
              </label>
              <textarea
                rows={5}
                className="w-full px-4 py-3 rounded-lg bg-muted/20 border border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground resize-none text-base placeholder:text-muted-foreground/70"
                placeholder="Wann möchten Sie den Termin?"
              />
            </div>
            <Button variant="hero" size="lg" className="w-full text-base">
              Anfrage senden
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OelwechselPage;
