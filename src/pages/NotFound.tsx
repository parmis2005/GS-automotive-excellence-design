import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

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
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center px-4">
          <h1 className="mb-4 text-4xl font-bold">Seite nicht gefunden</h1>
          <p className="mb-4 text-xl text-muted-foreground">
            Die angeforderte Seite existiert nicht. Sie wurden möglicherweise auf eine veraltete oder falsche Adresse weitergeleitet.
          </p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Zur Startseite
          </a>
          <span className="mx-2">·</span>
          <a href="/fahrzeuge" className="text-primary underline hover:text-primary/90">
            Zu den Gebrauchtwagen
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
