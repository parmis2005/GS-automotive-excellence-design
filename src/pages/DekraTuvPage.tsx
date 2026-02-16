import { useEffect, useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, ClipboardCheck, Shield, Wrench } from "lucide-react";
import { generateTitle } from "@/utils/seo";

const heroImageUrl =
  "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/ChatGPT%20Image%20Feb%208,%202026,%2001_34_47%20AM.png";

const DekraTuvPage = () => {
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
          type: "DEKRA & TÜV",
          ...formData,
          page: "DEKRA & TÜV",
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
    title: generateTitle("DEKRA & TÜV Rheinland"),
    description:
      "Geprüfte Sicherheit vor Ort: DEKRA & TÜV Rheinland auf unserem Gelände. HU, Checks und transparente Berichte für maximale Sicherheit.",
    image: heroImageUrl,
    url: "https://www.gsauto.de/dekra-tuev",
    type: "website" as const,
  };

  const checklist = [
    "Prüfungsfahrt zu Beginn der HU (mind. 8 km/h)",
    "Elektronische Systemprüfung via Fahrzeugschnittstelle (HU-Adapter)",
    "Bremsanlage: Abbremsung, Beladungssimulation und EU-Normen",
    "Lenkung und Fahrverhalten",
    "Sichtverhältnisse: Windschutzscheibe, Spiegel, Tönungsfolien",
    "Beleuchtung: Lichttechnik, Scheinwerferausrichtung, Elektrik",
    "Achsen, Räder und Reifen",
    "Fahrgestell, Rahmen, Aufbau und Karosserie",
    "Ausstattungen: Abgasanlage, Geräuschentwicklung, Gasanlage",
    "Fahrzeugidentität und Dokumente",
  ];

  const highlights = [
    {
      icon: Shield,
      title: "Vertrauen durch geprüfte Sicherheit",
      text: "DEKRA und TÜV Rheinland prüfen regelmäßig direkt bei uns vor Ort.",
    },
    {
      icon: ClipboardCheck,
      title: "Transparente HU-Berichte",
      text: "Alle Ergebnisse werden vollständig dokumentiert – inklusive Mängelübersicht.",
    },
    {
      icon: Wrench,
      title: "Kurze Wege, klare Prozesse",
      text: "Notwendige Abnahmen bequem vor Ort – schnell und zuverlässig.",
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
              alt="DEKRA & TÜV Rheinland Prüfung bei GS Automobile Rheinland"
              className="h-full w-full object-cover blur-[2px] scale-[1.02] transform-gpu"
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
                  DEKRA & TÜV Rheinland
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-white mb-6 drop-shadow-lg">
                  Vertrauen durch geprüfte Sicherheit
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl">
                  DEKRA & TÜV Rheinland sind regelmäßig direkt bei uns vor Ort – für geprüfte
                  Fahrzeuge und maximale Transparenz.
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
              DEKRA & TÜV Rheinland <span className="text-primary">direkt bei uns vor Ort</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-8 max-w-3xl mx-auto leading-relaxed">
              Ein Autokauf ist Vertrauenssache und Sicherheit spielt dabei die entscheidende Rolle.
              Deshalb setzen wir auf die Zusammenarbeit mit erfahrenen und unabhängigen Prüforganisationen.
            </p>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              So können notwendige Abnahmen, insbesondere die Hauptuntersuchung (HU), bequem und zuverlässig
              bei uns durchgeführt werden.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {highlights.map((item) => {
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

            {/* HU Section */}
            <div className="bg-white rounded-xl p-8 md:p-10 shadow-sm border border-border/50 mb-16">
              <h3 className="font-display text-2xl font-semibold text-primary mb-6 text-center">
                Die Hauptuntersuchung – für Ihre Sicherheit unterwegs
              </h3>
              <p className="text-base text-muted-foreground text-center mb-8 max-w-3xl mx-auto leading-relaxed">
                Die HU ist weit mehr als eine gesetzliche Pflicht. Sie stellt sicher, dass Ihr Fahrzeug
                alle relevanten Sicherheitsstandards erfüllt und ohne Bedenken im Straßenverkehr bewegt werden kann.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {checklist.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary/80 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-8 max-w-3xl mx-auto">
                Alle Ergebnisse werden transparent im HU-Bericht dokumentiert – inklusive detaillierter Auflistung etwaiger Mängel.
              </p>
            </div>

            <div className="text-center max-w-3xl mx-auto">
              <h3 className="font-display text-2xl md:text-3xl font-semibold mb-4">
                Ihr Vorteil: geprüfte Fahrzeuge, kurze Wege, maximale Sicherheit
              </h3>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Durch die enge Kooperation mit DEKRA und TÜV Rheinland stellen wir sicher, dass jedes Fahrzeug
                in unserem Bestand gründlich geprüft wird – für Ihre Sicherheit, Transparenz und das gute Gefühl,
                die richtige Entscheidung getroffen zu haben.
              </p>
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
              Prüftermine einfach koordinieren
            </h2>
            <p className="text-white/90 mb-10 text-base md:text-lg leading-relaxed">
              Wir organisieren DEKRA & TÜV Rheinland direkt auf unserem Gelände – schnell, zuverlässig, professionell.
            </p>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
              <button type="button" onClick={() => setIsInquiryOpen(true)}>
                Termin anfragen
              </button>
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
                placeholder="Wann möchten Sie den Termin?"
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

export default DekraTuvPage;
