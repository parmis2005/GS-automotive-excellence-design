import { CheckCircle } from "lucide-react";

const benefits = [
  "Über 15 Jahre Erfahrung in der Automobilbranche",
  "Langjährige Partnerschaften mit Leasinggesellschaften",
  "Ausgezeichnetes Preis-Leistungs-Verhältnis",
  "Transparente Beratung ohne versteckte Kosten",
  "BMW Bank Finanzierung verfügbar",
  "Inzahlungnahme Ihres Altfahrzeugs",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-up">
            <span className="inline-block text-primary font-semibold uppercase tracking-wider text-sm mb-4">
              Über uns
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
              Warum GS Automobile Rheinland?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              GS Automobile Rheinland steht seit vielen Jahren für Kompetenz, 
              Verlässlichkeit und ein ausgezeichnetes Preis-Leistungs-Verhältnis 
              in der Automobilbranche. Unsere langjährige Zusammenarbeit mit 
              renommierten Leasinggesellschaften und Flottenanbietern ermöglicht 
              es uns, Ihnen hochwertige Fahrzeuge zu attraktiven Konditionen anzubieten.
            </p>

            {/* Benefits List */}
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Stats Cards */}
          <div className="grid grid-cols-2 gap-6 animate-fade-up stagger-2">
            <div className="p-8 rounded-2xl bg-card border border-border/50 hover-lift">
              <div className="font-display text-5xl md:text-6xl text-primary mb-2">
                15+
              </div>
              <div className="text-muted-foreground">Jahre Erfahrung</div>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-border/50 hover-lift mt-8">
              <div className="font-display text-5xl md:text-6xl text-primary mb-2">
                500+
              </div>
              <div className="text-muted-foreground">Zufriedene Kunden</div>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-border/50 hover-lift">
              <div className="font-display text-5xl md:text-6xl text-primary mb-2">
                100%
              </div>
              <div className="text-muted-foreground">Geprüfte Qualität</div>
            </div>
            <div className="p-8 rounded-2xl bg-primary/10 border border-primary/30 hover-lift mt-8">
              <div className="font-display text-5xl md:text-6xl text-primary mb-2">
                24/7
              </div>
              <div className="text-muted-foreground">Online-Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
