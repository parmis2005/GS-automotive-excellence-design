import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const KontaktErfolgreichPage = () => {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === "function") {
      // TODO: replace AW-XXXX/XXXX with your Google Ads conversion ID.
      gtag("event", "generate_lead", { send_to: "AW-XXXX/XXXX" });
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Kontakt erfolgreich | GS Automobile Rheinland</title>
        <meta
          name="description"
          content="Vielen Dank fuer Ihre Anfrage. Wir melden uns schnellstmoeglich bei Ihnen."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="min-h-[70vh] bg-secondary/40 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-background p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="font-display text-3xl text-foreground">Danke für Ihre Anfrage!</h1>
            <p className="mt-3 text-muted-foreground">
              Wir haben Ihre Nachricht erhalten und melden uns schnellstmöglich bei Ihnen zurück.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg" className="group">
                <Link to="/">
                  Zur Startseite
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/fahrzeuge">Fahrzeuge ansehen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default KontaktErfolgreichPage;
