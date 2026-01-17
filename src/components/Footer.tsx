import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const services = [
    { label: "Finanzierung", href: "#services" },
    { label: "DEKRA & TÜV", href: "#services" },
    { label: "Garantie", href: "#services" },
    { label: "Fahrzeugankauf", to: "/fahrzeugankauf" },
    { label: "Ölwechsel", href: "#services" },
    { label: "Zulassungsdienst", href: "#services" },
  ];

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
              Ihr Partner für Premium-Gebrauchtwagen und Jahreswagen in Krefeld.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {["Startseite", "Fahrzeuge", "Service", "Unternehmen", "Kontakt"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-gray-400 hover:text-gray-100 transition-colors"
                  >
                    {link}
                  </a>
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
          <p className="text-xs text-gray-500">
            © {currentYear} GS Automobile Rheinland GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6 text-xs">
            <a href="/impressum" className="text-gray-500 hover:text-gray-300 transition-colors">
              Impressum
            </a>
            <a href="/datenschutz" className="text-gray-500 hover:text-gray-300 transition-colors">
              Datenschutz
            </a>
            <a href="/haftungsausschluss" className="text-gray-500 hover:text-gray-300 transition-colors">
              Haftungsausschluss
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
