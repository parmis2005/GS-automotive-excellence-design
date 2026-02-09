import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import QuickSearch from "@/components/QuickSearch";
import BrandSelector from "@/components/BrandSelector";
import VehiclesSection from "@/components/VehiclesSection";
import VehicleTypeSelector from "@/components/VehicleTypeSelector";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { getDefaultSEO } from "@/utils/seo";

const Index = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const seoData = getDefaultSEO();

  // Erfolgsmeldung nach Ankauf-Anfrage
  useEffect(() => {
    if (searchParams.get("ankauf") === "success") {
      toast.success("Erfolgreich gesendet", {
        description: "Ihre Ankauf-Anfrage wurde erfolgreich übermittelt. Wir melden uns in Kürze.",
      });
      searchParams.delete("ankauf");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle hash navigation - scroll to section when hash is present in URL
  useEffect(() => {
    if (location.hash) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (location.pathname === "/") {
      // If no hash and on home page, scroll to top (Hero section)
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} />
      <Navbar />
      <main>
        <section className="relative">
          <Hero />
          {/* Ab lg (1024px): Schnellsuche im Hero; darunter mobile Version unter dem Bild */}
          <div className="relative lg:absolute lg:bottom-6 lg:left-0 lg:right-0 lg:z-20 lg:flex lg:justify-center lg:px-4">
            <QuickSearch />
          </div>
        </section>
        <BrandSelector />
        <VehiclesSection />
        <VehicleTypeSelector />
        <ServicesSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
