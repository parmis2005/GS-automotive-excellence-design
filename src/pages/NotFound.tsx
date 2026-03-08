import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Seite nicht gefunden (404) | GS Automobile Rheinland</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://gsauto.de/" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-muted">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-[420px] text-center bg-background rounded-lg shadow-md p-8 sm:p-10">
            <div className="text-6xl sm:text-7xl font-bold text-primary leading-none tracking-tight mb-2">
              404
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-3">
              Seite nicht gefunden
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-7">
              Die angeforderte Seite existiert nicht. Möglicherweise wurde sie verschoben oder die Adresse ist fehlerhaft.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Zur Startseite
              </Link>
              <Link
                to="/fahrzeuge"
                className="inline-flex items-center justify-center rounded-md border border-primary bg-transparent px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                Zu den Gebrauchtwagen
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NotFound;
