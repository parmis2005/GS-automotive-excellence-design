import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type ConsentState = "accepted" | "custom";

const STORAGE_KEY = "cookie-consent";

const CookieBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const categories = useMemo(
    () => [
      {
        key: "essential",
        label: "Essenzielle Cookies",
        description: "Erforderlich für Grundfunktionen, Sicherheit und Seitennavigation.",
        required: true,
      },
    ],
    []
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    if (!stored) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setShowSettings(true);
    };

    window.addEventListener("open-cookie-settings", handleOpen);
    return () => window.removeEventListener("open-cookie-settings", handleOpen);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setIsOpen(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, "custom");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 md:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border/70 bg-white/95 backdrop-blur shadow-xl">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
              Cookie-Einstellungen
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Wir verwenden Cookies, um grundlegende Funktionen bereitzustellen. Sie können die
              Auswahl jederzeit anpassen.
            </p>
          </div>

          {showSettings && (
            <div className="mt-6 grid gap-4">
              {categories.map((category) => (
                <div
                  key={category.key}
                  className="rounded-xl border border-border/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{category.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs font-semibold text-primary">
                      {category.required ? "Immer aktiv" : "Optional"}
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Aktuell sind nur essenzielle Cookies im Einsatz. Für anonymisierte
                Nutzungsstatistiken nutzen wir Vercel Web Analytics (ohne Cookies).
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowSettings((prev) => !prev)}
              >
                {showSettings ? "Weniger anzeigen" : "Cookies verwalten"}
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {showSettings ? (
                <Button
                  variant="hero"
                  className="w-full sm:w-auto"
                  onClick={handleSave}
                >
                  Auswahl speichern
                </Button>
              ) : (
                <Button
                  variant="hero"
                  className="w-full sm:w-auto"
                  onClick={handleAcceptAll}
                >
                  Alle akzeptieren
                </Button>
              )}
              {showSettings && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleAcceptAll}
                >
                  Alle akzeptieren
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
