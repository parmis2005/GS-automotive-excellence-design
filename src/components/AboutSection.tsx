import { CheckCircle } from "lucide-react";

const benefits = [
  "Langjährige Partnerschaften mit Leasinggesellschaften",
  "Ausgezeichnetes Preis-Leistungs-Verhältnis",
  "Transparente Beratung ohne versteckte Kosten",
  "BMW Bank Finanzierung verfügbar",
  "Inzahlungnahme Ihres Altfahrzeugs",
  "DEKRA und TÜV-Prüfung vor Ort",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-primary mb-4">
            Willkommen bei GS Automobile Rheinland
          </h2>
          <div className="section-divider mb-4" />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Text */}
          <div className="prose prose-lg max-w-none text-center mb-12">
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              <strong className="text-foreground">Warum sich der Fahrzeugkauf bei GS Automobile Rheinland für Sie lohnt?</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Als <strong className="text-foreground">Autohaus in Krefeld</strong> und Ansprechpartner für 
              Kunden aus <strong className="text-foreground">Krefeld, Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch, Willich, Kempen, Tönisvorst und Umgebung</strong> steht GS Automobile Rheinland 
              seit vielen Jahren für Kompetenz, Verlässlichkeit und ein ausgezeichnetes Preis-Leistungs-Verhältnis 
              bei <strong className="text-foreground">Gebrauchtwagen</strong> und Jahreswagen.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Unsere langjährige Zusammenarbeit mit renommierten Leasinggesellschaften 
              und Flottenanbietern ermöglicht es uns, Ihnen hochwertige Fahrzeuge 
              zu attraktiven Konditionen anzubieten.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
