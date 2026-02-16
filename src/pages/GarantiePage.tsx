import { useEffect, useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, ArrowRight, CheckCircle2, Wrench } from "lucide-react";
import { generateTitle } from "@/utils/seo";

const heroImageUrl =
  "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/ChatGPT%20Image%20Feb%208,%202026,%2012_32_17%20AM.png";

const GarantiePage = () => {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setSubmitError("Bitte Vorname, Nachname und E-Mail ausfüllen.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Garantie",
          ...formData,
          page: "Garantie",
        }),
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      setSubmitSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch {
      setSubmitError("Senden fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const seoData = {
    title: generateTitle("Garantie"),
    description:
      "Gebrauchtwagengarantie mit 12–24 Monaten Laufzeit – GS Automobile Rheinland. Umfassender Schutz für zentrale Fahrzeugkomponenten in Krefeld.",
    image: heroImageUrl,
    url: "https://www.gsauto.de/garantie",
    type: "website" as const,
  };

  const guaranteedParts = [
    "ABS-System, Airbag, Anlasser, Antriebswelle",
    "Bremszylinder, Bremssattel, Hauptbremszylinder",
    "Differenzial, Drosselklappengehäuse, Generator",
    "Getriebe, Hydraulikeinheit, Kardanwelle, Kühler",
    "Lambdasonde, Motor, Nockenwelle, Ölkühler, Ölpumpe",
    "Servopumpe, Steuergeräte, Thermostat, Turbolader",
    "Ventile, Wasserpumpe, Zylinderkopfdichtung",
  ];

  const benefits = [
    {
      icon: Shield,
      title: "12–24 Monate Garantie",
      text: "Auf nahezu alle Bauteile – Herstellergarantie oder optionale Gebrauchtwagengarantie mit 12–24 Monaten Laufzeit.",
    },
    {
      icon: Wrench,
      title: "Volle Kostenkontrolle",
      text: "Bei unerwarteten Reparaturen – transparente Garantiepakete statt böser Überraschungen.",
    },
    {
      icon: CheckCircle2,
      title: "Rundum abgesichert",
      text: "Individuelle Garantievarianten – passend zu Ihrem Fahrzeug und Ihrem Nutzungsprofil.",
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
              alt="Garantie bei GS Automobile Rheinland"
              className="h-full w-full object-cover"
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
                  Garantie
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-white mb-6 drop-shadow-lg">
                  Sicher unterwegs – mit Garantie
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl">
                  Ihre Sicherheit und Zufriedenheit stehen für uns an erster Stelle – deshalb bieten wir Ihnen umfassenden Schutz.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild variant="hero" size="lg" className="justify-center">
                    <Link to="/fahrzeuge">Fahrzeuge ansehen</Link>
                  </Button>
                  <Button
                    variant="white"
                    size="lg"
                    className="justify-center"
                    onClick={() => setIsInquiryOpen(true)}
                  >
                    Jetzt beraten lassen
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
              Ihr Schutz beim <span className="text-primary">Fahrzeugkauf</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-8 max-w-3xl mx-auto leading-relaxed">
              Beim Fahrzeugkauf steht Ihre Sicherheit und Zufriedenheit für uns an erster Stelle. Deshalb bieten wir Ihnen für jedes Fahrzeug entweder die bestehende Herstellergarantie oder – falls diese bereits abgelaufen ist – eine optionale
              Gebrauchtwagengarantie mit einer Laufzeit von 12 bis 24&nbsp;Monaten.*
            </p>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              So sind Sie auch nach dem Kauf zuverlässig geschützt vor unerwarteten Reparaturkosten.
            </p>

            {/* Umfassender Schutz */}
            <div className="bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50 mb-16">
              <h3 className="font-display text-2xl font-semibold text-primary mb-6 text-center">
                Umfassender Schutz für zentrale Fahrzeugkomponenten
              </h3>
              <p className="text-base text-muted-foreground text-center mb-8 max-w-3xl mx-auto leading-relaxed">
                Unsere Garantie deckt nahezu alle wichtigen mechanischen und elektrischen Bauteile Ihres Fahrzeugs ab – selbst bei mehreren Schäden während der Laufzeit. Ausgenommen sind lediglich typische Verschleißteile wie Reifen, Glühlampen oder Bremsbeläge sowie Bauteile, die im Rahmen der regulären Wartung ersetzt werden müssen (gemäß Garantiebedingungen).
              </p>
              <div className="border-t border-border/60 pt-8">
                <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Beispielhafte, nicht vollständige Aufzählung garantierter Bauteile:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                  {guaranteedParts.map((part) => (
                    <div key={part} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary/80 flex-shrink-0 mt-0.5" />
                      <span>{part}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ihre Vorteile */}
            <h3 className="font-display text-2xl md:text-3xl font-semibold mb-8 text-center">
              Ihre Vorteile auf einen Blick
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="text-center bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-primary mb-3 text-lg">{item.title}</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-12 max-w-2xl mx-auto">
              *Das Garantieangebot gilt ausschließlich für Privatkunden mit Wohnsitz in Deutschland.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 bg-primary">
          <div className="container mx-auto px-6 md:px-10 max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-8">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-5">
              Fahrzeuge mit Garantie entdecken
            </h2>
            <p className="text-white/90 mb-10 text-base md:text-lg leading-relaxed">
              Überzeugen Sie sich von unserer Auswahl – jedes Fahrzeug mit umfassendem Schutz.
            </p>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
              <Link to="/fahrzeuge" className="inline-flex items-center gap-2">
                Fahrzeuge ansehen
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-[640px] p-8 sm:p-10 gap-6 border border-border/60 shadow-xl bg-background/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Garantieberatung anfragen</DialogTitle>
            <DialogDescription>
              Hinterlassen Sie Ihre Daten – wir melden uns schnellstmöglich bei Ihnen.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Vorname
                </label>
                <input
                  type="text"
                  className="w-full h-12 px-4 rounded-lg bg-muted/20 border border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground text-base placeholder:text-muted-foreground/70"
                  placeholder="Max"
                  value={formData.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
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
                  value={formData.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
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
                value={formData.phone}
                onChange={(event) => updateField("phone", event.target.value)}
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
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nachricht
              </label>
              <textarea
                rows={5}
                className="w-full px-4 py-3 rounded-lg bg-muted/20 border border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground resize-none text-base placeholder:text-muted-foreground/70"
                placeholder="Worum geht es bei Ihrer Garantie?"
                value={formData.message}
                onChange={(event) => updateField("message", event.target.value)}
              />
            </div>
            <Button variant="hero" size="lg" className="w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? "Sende..." : "Anfrage senden"}
            </Button>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-sm text-emerald-600">Vielen Dank! Wir melden uns zeitnah.</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default GarantiePage;
