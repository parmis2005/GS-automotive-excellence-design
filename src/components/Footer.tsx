import { Facebook, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <span className="font-display text-2xl font-bold">
                GS AUTOMOBILE
              </span>
              <div className="text-xs opacity-80 tracking-[0.2em] uppercase mt-1">
                Rheinland
              </div>
            </div>
            <p className="text-sm opacity-80 mb-4">
              Ihr Partner für Premium-Gebrauchtwagen und Jahreswagen in Krefeld.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/GSAutomobileRheinland/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {["Startseite", "Fahrzeuge", "Service", "Unternehmen", "Kontakt"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="opacity-80 hover:opacity-100 transition-opacity"
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
              {["Finanzierung", "DEKRA & TÜV", "Garantie", "Fahrzeugankauf", "Ölwechsel", "Zulassungsdienst"].map((service) => (
                <li key={service}>
                  <a
                    href="#services"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg mb-4">Kontakt</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:021519422262" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                  <Phone className="w-4 h-4" />
                  02151 94 222 62
                </a>
              </li>
              <li>
                <a href="mailto:info@gsauto.de" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                  <Mail className="w-4 h-4" />
                  info@gsauto.de
                </a>
              </li>
              <li className="flex items-start gap-2 opacity-80">
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
        <div className="mt-10 pt-6 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-70">
            © {currentYear} GS Automobile Rheinland GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6 text-xs">
            <a href="/impressum" className="opacity-70 hover:opacity-100 transition-opacity">
              Impressum
            </a>
            <a href="/datenschutz" className="opacity-70 hover:opacity-100 transition-opacity">
              Datenschutz
            </a>
            <a href="/haftungsausschluss" className="opacity-70 hover:opacity-100 transition-opacity">
              Haftungsausschluss
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
