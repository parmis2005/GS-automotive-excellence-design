import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, ArrowRight, ExternalLink } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-primary mb-4">
            Kontakt
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wir freuen uns auf Ihren Besuch in unserem Showroom in Krefeld.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div className="space-y-6 animate-fade-up">
            {/* Address Card */}
            <div className="p-6 rounded-lg bg-background border border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground mb-2">Adresse</h3>
                  <p className="text-muted-foreground text-sm">
                    GS Automobile Rheinland GmbH<br />
                    Kuhleshütte 149<br />
                    47809 Krefeld
                  </p>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Kuhlesh%C3%BCtte+149+47809+Krefeld"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                title="Standort in Google Maps anzeigen"
              >
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground text-sm">Standort in Google Maps anzeigen</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </a>
            </div>

            {/* Contact Methods */}
            <div className="grid sm:grid-cols-2 gap-4">
              <a 
                href="tel:021519422262"
                className="p-5 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors group"
              >
                <Phone className="w-6 h-6 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1 text-sm">Telefon</h4>
                <p className="text-muted-foreground text-sm group-hover:text-primary transition-colors">
                  02151 94 222 62
                </p>
              </a>
              <a 
                href="mailto:info@gsauto.de"
                className="p-5 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors group"
              >
                <Mail className="w-6 h-6 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1 text-sm">E-Mail</h4>
                <p className="text-muted-foreground text-sm group-hover:text-primary transition-colors">
                  info@gsauto.de
                </p>
              </a>
            </div>

            {/* Opening Hours */}
            <div className="p-6 rounded-lg bg-background border border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">Öffnungszeiten</h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-foreground">Montag - Freitag</span>
                  <span className="text-primary font-semibold">09:30 - 17:30 Uhr</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-foreground">Samstag</span>
                  <span className="text-primary font-semibold">10:00 - 13:00 Uhr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Sonntag</span>
                  <span className="text-muted-foreground">Geschlossen</span>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="p-6 rounded-lg bg-background border border-border animate-fade-up stagger-2">
            <h3 className="font-display text-xl text-foreground mb-6">
              Kontaktformular
            </h3>
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Vorname
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-md bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground text-sm"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nachname
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-md bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground text-sm"
                    placeholder="Mustermann"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-md bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground text-sm"
                  placeholder="max@beispiel.de"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-md bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground text-sm"
                  placeholder="+49 123 456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nachricht
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-md bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground resize-none text-sm"
                  placeholder="Ihre Nachricht..."
                />
              </div>
              <Button variant="hero" size="lg" className="w-full group">
                Nachricht senden
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
