import { useEffect } from "react";
import ContactSection from "@/components/ContactSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { generateTitle } from "@/utils/seo";

const heroImageUrl =
  "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/Screenshot%202026-01-07%20at%2010.39.00.png";

const KontaktPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const seoData = {
    title: generateTitle("Kontakt"),
    description:
      "Kontaktieren Sie GS Automobile Rheinland in Krefeld. Wir beraten Sie zu Fahrzeugen, Finanzierung und Inzahlungnahme.",
    image: heroImageUrl,
    url: "https://gsauto.de/kontakt",
    type: "website" as const,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} />
      <Navbar />
      <main>
        <section className="relative min-h-[55vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImageUrl}
              alt="Kontakt GS Automobile Rheinland"
              className="h-full w-full object-cover blur-[1px] scale-[1.02] transform-gpu"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-background/10 to-background/80" />
          </div>

          <div className="relative z-10 flex flex-col justify-end min-h-[55vh] pb-0">
            <div className="container mx-auto px-6 md:px-10 pb-14 md:pb-20 pt-20">
              <div className="max-w-3xl">
                <p className="text-sm tracking-[0.4em] uppercase text-white/80 mb-5">
                  Kontakt
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-5 drop-shadow-lg">
                  Wir freuen uns auf Ihre Anfrage
                </h1>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl">
                  Schreiben Sie uns oder besuchen Sie unseren Standort in Krefeld – wir beraten Sie persönlich.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default KontaktPage;
