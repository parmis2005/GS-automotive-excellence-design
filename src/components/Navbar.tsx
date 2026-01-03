import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Menu, X, Facebook } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Startseite", href: "#home" },
    { label: "Fahrzeuge", href: "#vehicles" },
    { label: "Service", href: "#services" },
    { label: "Über uns", href: "#about" },
    { label: "Kontakt", href: "#contact" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-secondary/50 border-b border-border/30">
        <div className="container mx-auto px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="tel:021519422262" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              02151 94 222 62
            </a>
            <a href="mailto:info@gsauto.de" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              info@gsauto.de
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.facebook.com/GSAutomobileRheinland/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass-card py-3 shadow-lg"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3">
            <div className="relative">
              <span className="font-display text-3xl md:text-4xl tracking-tight">
                <span className="text-foreground">GS</span>
                <span className="text-primary"> AUTOMOBILE</span>
              </span>
              <span className="absolute -bottom-1 left-0 text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
                Rheinland
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="hero" size="lg">
              Zur Fahrzeugsuche
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden glass-card mt-2 mx-4 rounded-lg p-6 animate-fade-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors py-2 border-b border-border/30"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                <a href="tel:021519422262" className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  02151 94 222 62
                </a>
                <a href="mailto:info@gsauto.de" className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  info@gsauto.de
                </a>
              </div>
              <Button variant="hero" className="mt-4">
                Zur Fahrzeugsuche
              </Button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
