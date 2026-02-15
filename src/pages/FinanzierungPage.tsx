import { useEffect, useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Percent, ArrowRight, Phone, Mail, Car, FileCheck, Target, MessageCircle, FileText, CheckCircle2 } from "lucide-react";
import { generateTitle } from "@/utils/seo";

const heroImageUrl =
  "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/BMW%20logo%20in%20showroom%20focus.png";

const FinanzierungPage = () => {
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
          type: "Finanzierung",
          ...formData,
          page: "Finanzierung",
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
    title: generateTitle("Finanzierung"),
    description:
      "Individuelle Finanzierung mit der BMW Bank – GS Automobile Rheinland als langjähriger Partner. Basis-Finanzierung, Ziel-Finanzierung, persönliche Beratung in Krefeld.",
    image: heroImageUrl,
    url: "https://www.gs-automobile-rheinland.de/finanzierung",
    type: "website" as const,
  };

  const services = [
    {
      icon: Percent,
      title: "Flexible Ratenmodelle",
      text: "Ob Basis- oder Ziel-Finanzierung – wir finden die passende Lösung, abgestimmt auf Ihre Lebenssituation.",
    },
    {
      icon: Shield,
      title: "Sicherheit & Transparenz",
      text: "Transparente Kostenstruktur, faire Konditionen. Als offizieller BMW Bank Partner.",
    },
    {
      icon: Car,
      title: "Inzahlungnahme",
      text: "Nutzen Sie den Wert Ihres alten Fahrzeugs direkt für Ihre Finanzierung – einfach und effizient.",
    },
  ];

  const steps = [
    { num: 1, icon: MessageCircle, title: "Finanzierungswunsch klären", text: "In einem kurzen Gespräch finden wir heraus, welche Finanzierung zu Ihnen passt – Anzahlung, Laufzeit oder Monatsrate." },
    { num: 2, icon: FileText, title: "Angebot erhalten", text: "Individuelles Finanzierungsangebot mit fairen Konditionen und maximaler Transparenz – ohne versteckte Kosten." },
    { num: 3, icon: CheckCircle2, title: "Direkt abschließen & losfahren", text: "Sie unterschreiben bei uns vor Ort in Krefeld – und schon steht Ihr neues Fahrzeug bereit." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} />
      <Navbar />

      <main>
        {/* Hero – wie vorher */}
        <section className="relative min-h-[75vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImageUrl}
              alt="Fahrzeugfinanzierung bei GS Automobile Rheinland"
              className="h-full w-full object-cover blur-[2px] scale-[1.02] transform-gpu"
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
                  Finanzierung
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-white mb-6 drop-shadow-lg">
                  Offizieller Partner der BMW Bank
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl">
                  Flexible Raten, sichere Konditionen – wir finden gemeinsam mit Ihnen die passende Finanzierungslösung.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="hero"
                    size="lg"
                    className="justify-center"
                    onClick={() => setIsInquiryOpen(true)}
                  >
                    Jetzt Beratung anfragen
                  </Button>
                  <Button asChild variant="white" size="lg" className="justify-center">
                    <Link to="/fahrzeuge">Fahrzeuge entdecken</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Unsere Finanzierungsservices */}
        <section className="py-20 md:py-24 bg-muted/20">
          <div className="container mx-auto px-6 md:px-10 max-w-6xl">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 text-center">
              Unsere <span className="text-primary">Finanzierungsservices</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-14 max-w-3xl mx-auto leading-relaxed">
              Ob Anzahlung, Laufzeit oder Monatsrate – wir finden gemeinsam mit Ihnen die passende
              Finanzierungslösung. Einfach, transparent und auf Ihre Lebenssituation abgestimmt.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="text-center bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-200"
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

            {/* Finanzierungsmodelle – Basis & Ziel */}
            <div className="mt-20 pt-20 border-t-2 border-primary/20">
              <h3 className="font-display text-2xl font-semibold text-primary mb-10 text-center">
                Finanzierungsmodelle
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-8 border-l-4 border-primary shadow-sm flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-3 text-lg">Basis-Finanzierung</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Konstante Monatsraten, fester Zinssatz – volle Kontrolle über Ihre Ausgaben.
                      Anzahlung möglich, aber nicht Pflicht.
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-8 border-l-4 border-primary shadow-sm flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-3 text-lg">Ziel-Finanzierung</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Niedrige Monatsraten, individuelle Laufzeit. Am Ende: Übernahme des Fahrzeugs
                      oder Weiterfinanzierung der Restsumme.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* In 3 Schritten zur passenden Finanzierung */}
        <section className="py-20 md:py-24 bg-white">
          <div className="container mx-auto px-6 md:px-10 max-w-6xl">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 text-center">
              In 3 Schritten zur <span className="text-primary">passenden Finanzierung</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-14 max-w-2xl mx-auto leading-relaxed">
              Schnell, unkompliziert und auf Sie zugeschnitten – vom ersten Wunsch bis zur finalen Unterschrift.
            </p>

            <div className="flex flex-col gap-0">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.num} className="flex flex-col">
                    <div className="flex gap-8 items-start bg-muted/30 rounded-xl p-8 border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-colors">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">
                          {step.num}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-semibold text-primary mb-2 text-lg flex items-center gap-3">
                          <StepIcon className="h-5 w-5 text-primary/80 flex-shrink-0" />
                          {step.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {step.text}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden md:flex justify-center py-2">
                        <span className="w-0.5 h-8 bg-primary/70 shrink-0" />
                      </div>
                    )}
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
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-5">
              Finanzierung anfragen
            </h2>
            <p className="text-white/90 mb-10 text-base md:text-lg leading-relaxed">
              Sprechen Sie uns an – wir beraten Sie gerne und erstellen ein unverbindliches Angebot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                <a href="tel:021519422262" className="inline-flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  02151 94 222 62
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                <a href="mailto:info@gsauto.de" className="inline-flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  info@gsauto.de
                </a>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-8 justify-center">
              <Link
                to="/fahrzeuge"
                className="text-base text-white/90 hover:text-white inline-flex items-center gap-2 transition-colors"
              >
                Fahrzeuge ansehen
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/fahrzeugankauf"
                className="text-base text-white/90 hover:text-white inline-flex items-center gap-2 transition-colors"
              >
                Fahrzeug verkaufen
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-[640px] p-8 sm:p-10 gap-6 border border-border/60 shadow-xl bg-background/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Beratung anfragen</DialogTitle>
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
                placeholder="Worum geht es bei Ihrer Finanzierung?"
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

export default FinanzierungPage;
