import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Scale, FileText, Link2 } from "lucide-react";

const HaftungsausschlussPage = () => {
  const seoData = {
    title: "Haftungsausschluss | GS Automobile Rheinland",
    description:
      "Haftungsausschluss der GS Automobile Rheinland GmbH – Haftung für Inhalte, Links und Urheberrecht gemäß TMG.",
    url: "https://www.gs-automobile-rheinland.de/haftungsausschluss",
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
            Haftungsausschluss
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Stand: {standDate}</p>
        </header>

        <div className="grid gap-6 md:gap-8">
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="inhalte-heading"
          >
            <h2
              id="inhalte-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4"
            >
              <FileText className="h-5 w-5 text-primary" aria-hidden />
              Haftung für Inhalte
            </h2>
            <p className="text-sm text-muted-foreground">
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
              als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist
              jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
              Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte
              umgehend entfernen.
            </p>
          </section>

          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="links-heading"
          >
            <h2
              id="links-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4"
            >
              <Link2 className="h-5 w-5 text-primary" aria-hidden />
              Haftung für Links
            </h2>
            <p className="text-sm text-muted-foreground">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
              Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
              Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum
              Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
              Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
              Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>

          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="urheber-heading"
          >
            <h2
              id="urheber-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4"
            >
              <Scale className="h-5 w-5 text-primary" aria-hidden />
              Urheberrecht
            </h2>
            <p className="text-sm text-muted-foreground">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
              Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
              bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
              Gebrauch gestattet.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
              Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
              gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam
              werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HaftungsausschlussPage;
