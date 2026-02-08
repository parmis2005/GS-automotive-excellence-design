import { 
  CreditCard, 
  Shield, 
  BadgeCheck, 
  Car, 
  Wrench, 
  FileCheck,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    icon: CreditCard,
    title: "Finanzierung",
    description: "Attraktive Raten und flexible Laufzeiten. Berechnen Sie Ihre Rate in wenigen Minuten.",
    cta: "Finanzierung berechnen",
    trustMarkers: ["BMW Bank Partner", "Sofort-Zusage möglich"],
    href: "/finanzierung",
    isPrimary: true, // Primärer Umsatztreiber
  },
  {
    icon: BadgeCheck,
    title: "DEKRA & TÜV",
    description: "Prüfung direkt vor Ort. Ohne Wartezeit, ohne Stress – damit Sie sofort Klarheit haben.",
    cta: "Termin vereinbaren",
    trustMarkers: ["Zertifizierte Prüfung", "Vor Ort Service"],
    href: "/dekra-tuev",
    isPrimary: false,
  },
  {
    icon: Shield,
    title: "Garantie",
    description: "Umfassender Schutz für Ihr Fahrzeug. Sicherheit nach dem Kauf, transparent und fair.",
    cta: "Garantie ansehen",
    trustMarkers: ["Variable Laufzeiten", "Transparente Bedingungen"],
    href: "/garantie",
    isPrimary: false,
  },
  {
    icon: Car,
    title: "Fahrzeugankauf",
    description: "Schnelle Bewertung und sofortige Auszahlung. Verkaufen Sie unkompliziert und ohne Stress.",
    cta: "Fahrzeug bewerten",
    trustMarkers: ["Sofortbewertung", "Faire Preise"],
    href: "/fahrzeugankauf",
    isPrimary: true, // Primärer Umsatztreiber
  },
  {
    icon: Wrench,
    title: "Ölwechsel",
    description: "Hochwertige Öle nach Herstellerfreigabe. Optimale Motorleistung und maximale Langlebigkeit.",
    cta: "Service buchen",
    trustMarkers: ["Herstellerfreigabe", "Premium Öle"],
    href: "/oelwechsel",
    isPrimary: false,
  },
  {
    icon: FileCheck,
    title: "Zulassungsdienst",
    description: "Komplette Abwicklung der Zulassung. Einfach, schnell und ohne bürokratischen Aufwand.",
    cta: "Zulassung anfragen",
    trustMarkers: ["Komplettservice", "Schnelle Abwicklung"],
    href: "/zulassung",
    isPrimary: false,
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-28 bg-muted/30">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section Header */}
        <div className="mb-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Unser Service für Sie
          </h2>
          <div className="w-20 h-0.5 bg-primary mx-auto mb-6" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Professionelle Leistungen von der Finanzierung bis zur Wartung – 
            transparent, zuverlässig und kundenorientiert.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 mb-20">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isLinked = Boolean(service.href);
            return (
              <div
                key={index}
                className={`group flex flex-col transition-transform duration-300 hover:scale-[1.02] ${
                  isLinked ? "cursor-pointer" : ""
                }`}
              >
                {isLinked ? (
                  <Link
                    to={service.href as string}
                    className="flex flex-col flex-grow rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-muted/30"
                  >
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                      <div className="w-20 h-20 flex items-center justify-center">
                        <Icon
                          className="w-20 h-20 text-muted-foreground/80 group-hover:text-primary transition-colors duration-300"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-4 text-center">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground group-hover:text-primary/80 mb-6 leading-relaxed flex-grow transition-colors text-center">
                      {service.description}
                    </p>

                    {/* Trust Markers */}
                    <div className="mb-6 space-y-2 flex flex-col items-center">
                      {service.trustMarkers.map((marker, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary/70 transition-colors">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{marker}</span>
                        </div>
                      ))}
                    </div>
                  </Link>
                ) : (
                  <>
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                      <div className="w-20 h-20 flex items-center justify-center">
                        <Icon
                          className="w-20 h-20 text-muted-foreground/80 group-hover:text-primary transition-colors duration-300"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-4 text-center">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground group-hover:text-primary/80 mb-6 leading-relaxed flex-grow transition-colors text-center">
                      {service.description}
                    </p>

                    {/* Trust Markers */}
                    <div className="mb-6 space-y-2 flex flex-col items-center">
                      {service.trustMarkers.map((marker, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary/70 transition-colors">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{marker}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* CTA Button */}
                <Button
                  asChild={Boolean(service.href)}
                  variant={service.isPrimary ? "default" : "outline"}
                  className={`w-full justify-between group/btn transition-all duration-300 ${
                    service.isPrimary 
                      ? "bg-primary hover:bg-primary/90 text-white border-0 shadow-md hover:shadow-lg" 
                      : "border-2 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {service.href ? (
                    <Link to={service.href}>
                      <span className="font-medium">{service.cta}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Link>
                  ) : (
                    <>
                      <span className="font-medium">{service.cta}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Trust Section */}
        <div className="pt-16 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Geprüfte Qualität</h4>
              <p className="text-sm text-muted-foreground">
                Alle Fahrzeuge werden vor dem Verkauf professionell geprüft und zertifiziert.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <BadgeCheck className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Transparente Abläufe</h4>
              <p className="text-sm text-muted-foreground">
                Klare Preise, faire Konditionen – keine versteckten Kosten oder Überraschungen.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Sicherheit nach dem Kauf</h4>
              <p className="text-sm text-muted-foreground">
                Umfassende Garantie und langfristiger Service für Ihre Zufriedenheit.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Divider - außerhalb des Containers für volle Breite */}
      <div className="border-b border-border/60 mt-0" />
    </section>
  );
};

export default ServicesSection;
