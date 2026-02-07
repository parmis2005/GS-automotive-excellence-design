import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrollt beim Seitenwechsel nach oben (z. B. Impressum, Datenschutz, Haftungsausschluss).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}
