import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Menu, X, ArrowRight, ChevronDown } from "lucide-react";

const SCROLL_THRESHOLD = 80;
const PROGRAMMATIC_SCROLL_IGNORE_MS = 600;
const BOTTOM_ZONE_PX = 80; // Am Seitenende: Navbar nicht anzeigen bei Bounce-Scroll
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ignoreShowUntil = useRef(0);
  const rafId = useRef<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const getScrollY = () =>
      window.scrollY ?? document.documentElement.scrollTop ?? 0;

    const handleProgrammaticScroll = () => {
      ignoreShowUntil.current = Date.now() + PROGRAMMATIC_SCROLL_IGNORE_MS;
    };

    const applyScrollState = () => {
      const y = getScrollY();
      setIsScrolled(y > 20);
      const prev = lastScrollY.current;
      const isProgrammaticScroll = Date.now() < ignoreShowUntil.current;
      const isNearBottom =
        y + window.innerHeight >= document.documentElement.scrollHeight - BOTTOM_ZONE_PX;
      if (y < 50) {
        if (!isProgrammaticScroll) setNavbarVisible(true);
      } else if (y > prev && y > SCROLL_THRESHOLD) {
        setNavbarVisible(false);
      } else if (y < prev) {
        if (!isProgrammaticScroll && !isNearBottom) setNavbarVisible(true);
      }
      lastScrollY.current = y;
      rafId.current = null;
    };

    const handleScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        applyScrollState();
      });
    };

    lastScrollY.current = getScrollY();
    applyScrollState();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("programmatic-scroll-start", handleProgrammaticScroll);
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("programmatic-scroll-start", handleProgrammaticScroll);
    };
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
    {
      label: "SERVICE",
      to: "/#services",
      isHash: true,
      hash: "#services",
      subItems: [
        { label: "Finanzierung", to: "/finanzierung" },
        { label: "Garantie", to: "/garantie" },
        { label: "Zulassungsdienst", to: "/zulassung" },
        { label: "DEKRA & TÜV", to: "/dekra-tuev" },
        { label: "Ölwechsel", to: "/oelwechsel" },
      ],
    },
    { label: "INZAHLUNGNAHME", to: "/fahrzeugankauf", isHash: false },
    { label: "UNTERNEHMEN", to: "/unternehmen", isHash: false },
    { label: "KONTAKT", to: "/#contact", isHash: true, hash: "#contact" },
  ];

  return (
    <>
      {/* Fixierter Header, gleitet beim Runterscrollen nach oben (Desktop + Mobile) */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out overflow-visible ${
          !navbarVisible ? "-translate-y-full" : ""
        }`}
        style={{ willChange: "transform" }}
      >
        {/* Top Bar – nur Desktop */}
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

        {/* Main Navbar – sticky auf Mobile, in fixiertem Container auf Desktop; einheitlicher Grauton, keine Höhenänderung beim Scroll */}
        <nav
          className={`sticky top-0 transition-shadow duration-300 navbar-scalable overflow-x-hidden lg:overflow-visible border-b border-gray-200 ${
            isScrolled
              ? "bg-gray-200 shadow-md"
              : "bg-gray-100"
          }`}
        >
        <div className="flex items-stretch w-full min-h-[80px] sm:min-h-[88px] lg:min-h-[84px] xl:min-h-[92px] 2xl:min-h-[100px] lg:overflow-visible">
          <div className="flex-1 min-w-0 flex items-center lg:overflow-visible">
            <div className="w-full max-w-7xl xl:max-w-none mx-auto pl-3 sm:pl-4 lg:pl-4 xl:pl-8 2xl:pl-10 pr-3 sm:pr-4 lg:pr-2 xl:pr-[92px] 2xl:pr-[100px] lg:ml-[20px] xl:ml-0 flex items-center justify-between lg:justify-start min-w-0 gap-2 sm:gap-3 lg:overflow-visible">
              {/* Logo – skaliert mit Viewport; Padding konstant, damit Navbar-Höhe sich nicht ändert */}
              <Link 
                to="/"
                className="flex items-center transition-transform hover:scale-105 duration-200 flex-shrink-0 min-w-[100px] sm:min-w-0 lg:mr-0 py-3 lg:py-3 xl:py-4"
              >
                <img 
                  src="/logo.png" 
                  alt="GS Automobile Rheinland" 
                  width={200}
                  height={72}
                  className="h-12 sm:h-16 lg:h-16 xl:h-[72px] 2xl:h-20 w-auto max-w-[155px] sm:max-w-[200px] lg:max-w-[200px] xl:max-w-[240px] 2xl:max-w-none object-contain"
                />
              </Link>

              {/* Desktop Navigation – ab lg (1024px); ab xl volle Breite, größere Schrift für gefüllten Look */}
              <div className="hidden lg:flex items-center gap-2 xl:gap-5 2xl:gap-6 flex-1 justify-center overflow-visible lg:mx-4 xl:mx-6 2xl:mx-10" style={{ marginLeft: "clamp(24px, 4vw, 120px)" }}>
                {navLinks.map((link) => {
                  const hasSubItems = "subItems" in link && link.subItems && link.subItems.length > 0;
                  if (hasSubItems && link.subItems) {
                    return (
                      <div key={link.label} className="relative group/dropdown overflow-visible">
                        <Link
                          to={link.to}
                          onClick={link.isHash ? (e) => handleHashNavClick(e, link.hash!) : undefined}
                          className="px-2.5 py-1.5 xl:px-4 xl:py-2 2xl:px-5 2xl:py-2.5 text-sm xl:text-base 2xl:text-lg font-display font-bold tracking-wide transition-colors relative flex items-center gap-0.5 xl:gap-1 text-foreground/80 hover:text-primary"
                        >
                          {link.label}
                          <ChevronDown className="w-3.5 h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 opacity-70 group-hover/dropdown:rotate-180 transition-transform shrink-0" />
                          <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/dropdown:w-3/4" />
                        </Link>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 z-[100] pointer-events-none group-hover/dropdown:pointer-events-auto">
                          <div className="rounded-xl border border-border bg-white shadow-xl py-3 min-w-[200px] xl:min-w-[220px]">
                            {link.subItems.map((sub) => (
                              <Link
                                key={sub.label}
                                to={sub.to}
                                onClick={sub.to.startsWith("/#") ? (e) => handleHashNavClick(e, sub.to.slice(1)) : undefined}
                                className="block px-4 xl:px-5 py-2 xl:py-2.5 text-xs xl:text-sm font-medium text-gray-900 hover:text-primary hover:bg-primary/5 transition-colors first:pt-2 last:pb-2"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
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
                      className={`px-2.5 py-1.5 xl:px-4 xl:py-2 2xl:px-5 2xl:py-2.5 text-sm xl:text-base 2xl:text-lg font-display font-bold tracking-wide transition-colors relative group ${
                        link.label === "STARTSEITE"
                          ? "text-primary hover:text-primary/80"
                          : "text-foreground/80 hover:text-primary"
                      }`}
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4" />
                    </Link>
                  );
                })}
              </div>

              {/* Mobile/Tablet: Fahrzeugsuche-Button mittig – nur unter lg; auf sehr schmalen Screens (< 380px) ausblenden, um Überlappung mit Logo zu vermeiden (Fahrzeugsuche bleibt im Hamburger-Menü) */}
              <div className="lg:hidden max-[380px]:hidden flex-1 flex justify-center items-center min-w-0 pr-2">
                <Link to="/fahrzeuge" className="h-full flex items-center">
                  <Button 
                    variant="default"
                    size="default"
                    className="font-display font-semibold tracking-wide text-sm sm:text-base bg-primary hover:bg-primary/90 text-white shadow-md transition-all h-full min-h-[44px] rounded-xl px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap min-w-0"
                  >
                    Fahrzeugsuche
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 inline flex-shrink-0" />
                  </Button>
                </Link>
              </div>

              {/* CTA Button – Desktop ab lg, am rechten Rand (bei xl/2xl volle Navbar-Breite) */}
              <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0 ml-auto">
                <Link to="/fahrzeuge">
                  <Button 
                    variant="default" 
                    size="default"
                    className="font-display font-semibold tracking-wide text-sm xl:text-base 2xl:text-lg h-9 xl:h-11 2xl:h-12 px-4 xl:px-6 2xl:px-7 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Fahrzeugsuche
                    <ArrowRight className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 ml-1 xl:ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Hamburger – nur unter lg (1024px) */}
          <button
            className="lg:hidden flex-shrink-0 w-14 min-w-[56px] self-stretch text-foreground hover:bg-gray-300/80 active:bg-gray-300 transition-colors flex items-center justify-center border-l border-gray-300/50"
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

        {/* Mobile/Tablet Menu (nur unter lg) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-gray-100">
            <div className="container mx-auto px-6 py-4">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const hasSubItems = "subItems" in link && link.subItems && link.subItems.length > 0;
                  if (hasSubItems && link.subItems) {
                    return (
                      <div key={link.label} className="flex flex-col gap-0.5">
                        <Link
                          to={link.to}
                          onClick={link.isHash ? (e) => handleHashNavClick(e, link.hash!) : () => setIsMobileMenuOpen(false)}
                          className="px-4 py-3 text-lg font-display font-bold tracking-wide rounded-lg transition-colors text-foreground hover:text-primary hover:bg-secondary/50"
                        >
                          {link.label}
                        </Link>
                        <div className="flex flex-col pl-4 pb-1">
                          {link.subItems.map((sub) => (
                            <Link
                              key={sub.label}
                              to={sub.to}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="px-4 py-2.5 text-base font-medium text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
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
                  );
                })}
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
      </div>

      {/* Spacer = exakt Header-Höhe (Top Bar + Nav-Zeile), damit kein weißer Streifen unter der Navbar */}
      <div className="h-[88px] lg:h-[124px] xl:h-[132px] 2xl:h-[140px]" />
    </>
  );
};

export default Navbar;
