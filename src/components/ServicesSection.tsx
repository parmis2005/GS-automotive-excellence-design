import { 
  CreditCard, 
  Shield, 
  BadgeCheck, 
  Car, 
  Wrench, 
  FileCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: CreditCard,
    title: "Finanzierung",
    description: "BMW Bank Finanzierung mit attraktiven Konditionen. Flexible Laufzeiten und faire Raten für Ihr Traumfahrzeug.",
    link: "#finanzierung",
  },
  {
    icon: BadgeCheck,
    title: "DEKRA & TÜV",
    description: "Die Prüfung durch DEKRA und TÜV-Rheinland direkt bei uns vor Ort. Keine langen Wartezeiten.",
    link: "#dekra",
  },
  {
    icon: Shield,
    title: "Garantie",
    description: "Umfangreiche Fahrzeuggarantie mit variablen Laufzeiten für Ihre Sicherheit und Zufriedenheit.",
    link: "#garantie",
  },
  {
    icon: Car,
    title: "Fahrzeugankauf",
    description: "Professioneller und fairer Ankauf Ihres Fahrzeuges. Schnelle Abwicklung und sofortige Auszahlung.",
    link: "#ankauf",
  },
  {
    icon: Wrench,
    title: "Ölwechsel",
    description: "Hochwertige Öle nach Herstellerfreigaben. Professioneller Service für die Langlebigkeit Ihres Motors.",
    link: "#oelwechsel",
  },
  {
    icon: FileCheck,
    title: "Zulassungsdienst",
    description: "Rund-um-Zulassungsservice für eine schnelle und reibungslose Abwicklung ohne Stress.",
    link: "#zulassung",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-semibold uppercase tracking-wider text-sm mb-4">
            Unser Service
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            Alles aus einer Hand
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Von der Finanzierung bis zur Zulassung – wir kümmern uns um alles, 
            damit Sie sich voll und ganz auf Ihr neues Fahrzeug freuen können.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover-lift animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <service.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-2xl text-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {service.description}
              </p>

              {/* Link */}
              <a
                href={service.link}
                className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
              >
                Mehr erfahren
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 md:p-12 rounded-2xl glass-card text-center">
          <h3 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            Haben Sie Fragen zu unseren Services?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Unser Team steht Ihnen gerne zur Verfügung. Kontaktieren Sie uns 
            für eine individuelle Beratung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Jetzt anfragen
            </Button>
            <Button variant="outline" size="lg">
              02151 94 222 62
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
