import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { recordVisit, fetchActiveVisitorCount } from "@/lib/api/stats";

const VISITOR_SESSION_KEY = "ae_visitor_session";
const POLL_INTERVAL_MS = 60_000;

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `s${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(VISITOR_SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [activeVisitors, setActiveVisitors] = useState<number | null>(null);
  const isProd = import.meta.env.PROD;

  useEffect(() => {
    if (!isProd) return;
    const sessionId = getOrCreateSessionId();
    const tick = () => {
      recordVisit(sessionId).catch(() => {});
      fetchActiveVisitorCount().then(setActiveVisitors).catch(() => setActiveVisitors(0));
    };
    tick();
    const t = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [isProd]);

  const services = [
    { label: "Finanzierung", to: "/finanzierung" },
    { label: "DEKRA & TÜV", to: "/dekra-tuev" },
    { label: "Garantie", to: "/garantie" },
    { label: "Inzahlungnahme", to: "/fahrzeugankauf" },
    { label: "Ölwechsel", to: "/oelwechsel" },
    { label: "Zulassungsdienst", to: "/zulassung" },
  ];

  const handleOpenCookieSettings = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.dispatchEvent(new Event("open-cookie-settings"));
  };

  return (
    <footer className="bg-gray-900 text-gray-100">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <span className="font-display text-2xl font-bold">
                GS AUTOMOBILE
              </span>
              <div className="text-xs text-gray-400 tracking-[0.2em] uppercase mt-1">
                Rheinland
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Ihr Partner für Gebrauchtwagen und Jahreswagen in Krefeld.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Startseite", to: "/" },
                { label: "Fahrzeuge", to: "/fahrzeuge" },
                { label: "Service", to: "/#services" },
                { label: "Unternehmen", to: "/unternehmen" },
                { label: "Kontakt", to: "/#contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-gray-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              {services.map((service) => (
                <li key={service.label}>
                  {service.to ? (
                    <Link
                      to={service.to}
                      className="text-gray-400 hover:text-gray-100 transition-colors"
                    >
                      {service.label}
                    </Link>
                  ) : (
                    <a
                      href={service.href}
                      className="text-gray-400 hover:text-gray-100 transition-colors"
                    >
                      {service.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg mb-4">Kontakt</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:021519422262" className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors">
                  <Phone className="w-4 h-4" />
                  02151 94 222 62
                </a>
              </li>
              <li>
                <a href="mailto:info@gsauto.de" className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors">
                  <Mail className="w-4 h-4" />
                  info@gsauto.de
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Kuhleshütte 149<br />
                  47809 Krefeld
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-xs text-gray-500">
              © {currentYear} GS Automobile Rheinland GmbH. Alle Rechte vorbehalten.
            </p>
            {isProd && activeVisitors !== null && (
              <span className="text-xs text-gray-500" aria-live="polite">
                {activeVisitors} Besucher gerade online
              </span>
            )}
          </div>
          <div className="flex gap-6 text-xs">
            <a
              href="#cookies"
              onClick={handleOpenCookieSettings}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cookies
            </a>
            <Link to="/impressum" className="text-gray-500 hover:text-gray-300 transition-colors">
              Impressum
            </Link>
            <Link to="/datenschutz" className="text-gray-500 hover:text-gray-300 transition-colors">
              Datenschutz
            </Link>
            <Link to="/haftungsausschluss" className="text-gray-500 hover:text-gray-300 transition-colors">
              Haftungsausschluss
            </Link>
          </div>
        </div>
        <div className="mt-10 pt-10 border-t border-gray-800">
          <div className="mx-auto max-w-xl px-1">
            <a
              href="https://carsite24.de"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-gray-700/90 bg-gradient-to-br from-gray-800 via-gray-800 to-gray-950 px-6 py-8 text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/45 hover:shadow-[0_28px_60px_-12px_rgba(37,99,235,0.25)] hover:ring-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 sm:gap-6 sm:px-10 sm:py-10"
              aria-label="CARSITE24 – mehr erfahren (öffnet neues Fenster)"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-70"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl"
                aria-hidden
              />

              <div className="relative space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 group-hover:text-gray-400">
                  Erstellt von
                </p>
                <p className="mx-auto max-w-[22rem] text-sm leading-relaxed text-gray-300 group-hover:text-gray-200 sm:text-base">
                  Websites und Online-Marketing für Autohäuser — wenn Ihnen dieser Auftritt gefällt, lohnt sich ein Blick.
                </p>
              </div>

              <span className="relative font-sans text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                <span className="text-white">CAR</span>
                <span className="text-blue-400 transition-colors duration-300 group-hover:text-blue-300">SITE24</span>
              </span>

              <span className="relative inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 group-hover:bg-blue-500 group-hover:shadow-xl group-hover:shadow-blue-800/50">
                Mehr erfahren
                <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </span>

              <span className="relative text-xs text-gray-500 group-hover:text-gray-400">
                carsite24.de · neues Fenster
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
