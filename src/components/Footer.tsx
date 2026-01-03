import { Facebook, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border/50">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="mb-6">
              <span className="font-display text-3xl">
                <span className="text-foreground">GS</span>
                <span className="text-primary"> AUTOMOBILE</span>
              </span>
              <div className="text-xs text-muted-foreground tracking-[0.2em] uppercase mt-1">
                Rheinland
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Ihr Partner für Premium-Gebrauchtwagen und Jahreswagen in Krefeld. 
              Qualität und Service seit über 15 Jahren.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/GSAutomobileRheinland/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xl text-foreground mb-6">Navigation</h4>
            <ul className="space-y-3">
              {["Startseite", "Fahrzeuge", "Service", "Über uns", "Kontakt"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(" ", "-")}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-xl text-foreground mb-6">Services</h4>
            <ul className="space-y-3">
              {["Finanzierung", "DEKRA & TÜV", "Garantie", "Fahrzeugankauf", "Ölwechsel", "Zulassungsdienst"].map((service) => (
                <li key={service}>
                  <a
                    href="#services"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-xl text-foreground mb-6">Kontakt</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:021519422262" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                  02151 94 222 62
                </a>
              </li>
              <li>
                <a href="mailto:info@gsauto.de" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                  info@gsauto.de
                </a>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>
                  Kuhleshütte 149<br />
                  47809 Krefeld
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} GS Automobile Rheinland GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="/impressum" className="text-muted-foreground hover:text-primary transition-colors">
              Impressum
            </a>
            <a href="/datenschutz" className="text-muted-foreground hover:text-primary transition-colors">
              Datenschutz
            </a>
            <a href="/haftungsausschluss" className="text-muted-foreground hover:text-primary transition-colors">
              Haftungsausschluss
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
