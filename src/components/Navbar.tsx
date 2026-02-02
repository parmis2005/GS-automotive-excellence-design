import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Menu, X, ArrowRight } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click for hash links
  const handleHashNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (location.pathname === "/") {
      // Already on home page, scroll to section
      e.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setIsMobileMenuOpen(false);
      }
    }
    // If not on home page, Link will navigate to /#hash and Index component will handle scrolling
    setIsMobileMenuOpen(false);
  };

  // Handle click for home link - scroll to top
  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      // Already on home page, scroll to top (Hero section)
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
    // If not on home page, Link will navigate to / and scroll to top
  };

  // Handle click for fahrzeugankauf link - scroll to top on same page
  const handleAnkaufClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/fahrzeugankauf") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: "STARTSEITE", to: "/", isHash: false },
    { label: "SERVICE", to: "/#services", isHash: true, hash: "#services" },
    { label: "FAHRZEUGANKAUF", to: "/fahrzeugankauf", isHash: false },
    { label: "UNTERNEHMEN", to: "/#about", isHash: true, hash: "#about" },
    { label: "KONTAKT", to: "/#contact", isHash: true, hash: "#contact" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-gray-950 border-b border-gray-800">
        <div className="container mx-auto px-6 py-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6 text-sm text-gray-100">
              <a 
                href="tel:021519422262" 
                className="flex items-center gap-2 hover:text-white transition-colors font-medium"
              >
                <Phone className="w-4 h-4" />
                02151 94 222 62
              </a>
              <a 
                href="mailto:info@gsauto.de" 
                className="flex items-center gap-2 hover:text-white transition-colors font-medium"
              >
                <Mail className="w-4 h-4" />
                info@gsauto.de
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 navbar-scalable overflow-x-hidden ${
          isScrolled
            ? "bg-gray-200/95 backdrop-blur-md shadow-md py-3"
            : "bg-gray-100 py-4"
        }`}
      >
        <div className="w-full min-w-0 mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl lg:ml-[30px]">
          <div className="flex items-center justify-between lg:justify-start min-w-0 gap-2">
            {/* Logo - Mobile: links, Desktop: normal */}
            <Link 
              to="/"
              className="flex items-center transition-transform hover:scale-105 duration-200 flex-shrink-0 min-w-0 lg:mr-0"
            >
              <img 
                src="/logo.png" 
                alt="GS Automobile Rheinland" 
                className="h-10 sm:h-12 lg:h-14 md:h-16 w-auto max-w-[120px] sm:max-w-none"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-4 flex-1 justify-center mx-14" style={{ marginLeft: "clamp(64px, 8vw, 260px)" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={link.label === "STARTSEITE" 
                    ? handleHomeClick 
                    : link.label === "FAHRZEUGANKAUF"
                    ? handleAnkaufClick
                    : link.isHash 
                    ? (e) => handleHashNavClick(e, link.hash!) 
                    : undefined}
                  className={`px-4 py-2 text-base font-display font-bold tracking-wide transition-colors relative group ${
                    link.label === "STARTSEITE"
                      ? "text-primary hover:text-primary/80"
                      : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4" />
                </Link>
              ))}
            </div>

            {/* Mobile: Fahrzeug suchen Button in der Mitte */}
            <div className="flex-1 flex justify-center xl:hidden mx-2 min-w-0 shrink">
              <Link to="/fahrzeuge" className="min-w-0">
                <Button 
                  variant="default"
                  size="sm"
                  className="font-display font-semibold tracking-wide text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-md transition-all px-2 sm:px-4 py-1.5 sm:py-2 h-auto whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Fahrzeug suchen</span>
                  <span className="sm:hidden">Suche</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-1.5 inline" />
                </Button>
              </Link>
            </div>

            {/* CTA Button - Desktop */}
            <div className="hidden xl:flex items-center gap-3 flex-shrink-0 ml-auto lg:mr-8">
              <Link to="/fahrzeuge">
                <Button 
                  variant="default" 
                  size="lg"
                  className="font-display font-semibold tracking-wide text-base bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Fahrzeugsuche
                  <ArrowRight className="w-5 h-5 ml-1.5" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button - ganz rechts, immer sichtbar */}
            <button
              className="xl:hidden p-2 text-foreground hover:bg-secondary rounded-lg transition-colors ml-auto flex-shrink-0 min-w-[44px]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-border bg-gray-100">
            <div className="container mx-auto px-6 py-4">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={link.label === "STARTSEITE"
                      ? (e) => {
                          handleHomeClick(e);
                          setIsMobileMenuOpen(false);
                        }
                      : link.label === "FAHRZEUGANKAUF"
                      ? (e) => {
                          handleAnkaufClick(e);
                          setIsMobileMenuOpen(false);
                        }
                      : link.isHash 
                      ? (e) => handleHashNavClick(e, link.hash!) 
                      : () => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 text-lg font-display font-bold tracking-wide rounded-lg transition-colors ${
                      link.label === "STARTSEITE"
                        ? "text-primary hover:text-primary/80 hover:bg-primary/10"
                        : "text-foreground hover:text-primary hover:bg-secondary/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <Link to="/fahrzeuge" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button 
                    variant="default" 
                    size="default"
                    className="w-full font-display font-semibold tracking-wide bg-primary hover:bg-primary/90 text-white"
                  >
                    Fahrzeugsuche
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <a 
                  href="tel:021519422262" 
                  className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Phone className="w-4 h-4" />
                  02151 94 222 62
                </a>
                <a 
                  href="mailto:info@gsauto.de" 
                  className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Mail className="w-4 h-4" />
                  info@gsauto.de
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
