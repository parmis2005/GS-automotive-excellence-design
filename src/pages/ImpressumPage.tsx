import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Building2, Scale, ExternalLink } from "lucide-react";

const ImpressumPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const seoData = {
    title: "Impressum | GS Automobile Rheinland",
    description:
      "Impressum der GS Automobile Rheinland GmbH – Kontakt, Handelsregister, Umsatzsteuer-ID, Berufshaftpflicht.",
    url: "https://gsauto.de/impressum",
  };

  const standDate = new Date().toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} />
      <Navbar />
      <main className="container mx-auto px-6 py-10 md:py-14 max-w-4xl">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Zur Startseite
          </Link>
        </div>

        <header className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Impressum
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Stand: {standDate}</p>
        </header>

        <div className="grid gap-6 md:gap-8">
          {/* Anbieter & Kontakt – Kartenlayout */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="anbieter-heading"
          >
            <h2
              id="anbieter-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-6"
            >
              <Building2 className="h-5 w-5 text-primary" aria-hidden />
              Anbieter & Kontakt
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium text-foreground">GS Automobile Rheinland GmbH</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Kuhleshütte 149
                  <br />
                  47809 Krefeld
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Handelsregister: HRB 17234
                  <br />
                  Registergericht: Amtsgericht Krefeld
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Vertreten durch:</span>
                  <br />
                  Geschäftsführer Garri Stratievski
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href="tel:+4921519422262"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    +49 (0)2151 9422262
                  </a>
                  <a
                    href="mailto:info@gsauto.de"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    info@gsauto.de
                  </a>
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    Kuhleshütte 149, 47809 Krefeld
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Verantwortlich für den Inhalt (§ 18 MStV) */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="verantwortlich-heading"
          >
            <h2
              id="verantwortlich-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3"
            >
              <Scale className="h-5 w-5 text-primary" aria-hidden />
              Verantwortlich für den Inhalt
            </h2>
            <p className="text-sm text-muted-foreground">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV (Mediendienste-Staatsvertrag):
            </p>
            <p className="mt-2 text-sm text-foreground">
              Garri Stratievski
              <br />
              GS Automobile Rheinland GmbH · Kuhleshütte 149 · 47809 Krefeld
            </p>
          </section>

          {/* Umsatzsteuer-ID */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="ust-heading"
          >
            <h2 id="ust-heading" className="text-lg font-semibold text-foreground mb-3">
              Umsatzsteuer-Identifikationsnummer
            </h2>
            <p className="text-sm text-muted-foreground">
              Gemäß § 27 a Umsatzsteuergesetz:
              <br />
              <span className="font-mono font-medium text-foreground">DE323030494</span>
            </p>
          </section>

          {/* Berufshaftpflichtversicherung */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="haftpflicht-heading"
          >
            <h2 id="haftpflicht-heading" className="text-lg font-semibold text-foreground mb-3">
              Berufshaftpflichtversicherung
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Name und Sitz des Versicherers:</span>
              <br />
              Allianz Deutschland AG · Königinstraße 28 · 80802 München
              <br />
              Sitz der Gesellschaft: München
              <br />
              <span className="mt-2 block">
                <span className="font-medium text-foreground">Geltungsraum:</span> Deutschland
              </span>
            </p>
          </section>

          {/* EU-Streitschlichtung & Verbraucherstreitbeilegung */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="streit-heading"
          >
            <h2 id="streit-heading" className="text-lg font-semibold text-foreground mb-4">
              Streitschlichtung
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">EU-Streitschlichtung</p>
                <p>
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
                  bereit:{" "}
                  <a
                    href="https://ec.europa.eu/consumers/odr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    ec.europa.eu/consumers/odr/
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <br />
                  <span className="text-muted-foreground/90">
                    Unsere E-Mail-Adresse finden Sie oben unter Kontakt.
                  </span>
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  Verbraucherstreitbeilegung / Universalschlichtungsstelle
                </p>
                <p>
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ImpressumPage;
