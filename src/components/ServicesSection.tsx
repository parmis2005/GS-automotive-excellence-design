import { 
  CreditCard, 
  Shield, 
  BadgeCheck, 
  Car, 
  Wrench, 
  FileCheck,
  ArrowRight
} from "lucide-react";

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
    <section id="services" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-primary mb-4">
            Unser Service für Sie
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Von der Finanzierung bis zur Zulassung – wir kümmern uns um alles, 
            damit Sie sich voll und ganz auf Ihr neues Fahrzeug freuen können.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group p-6 rounded-lg bg-background border border-border hover:border-primary/30 transition-all duration-300 hover-lift animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <service.icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl text-foreground mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {service.description}
              </p>

              {/* Link */}
              <a
                href={service.link}
                className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:gap-3 transition-all"
              >
                Weiterlesen
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
