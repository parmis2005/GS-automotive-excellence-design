/// <reference types="vite/client" />

declare global {
  interface Window {
    /** Serverseitig eingebettete Fahrzeugdaten (vehicle-preview), damit kein /api/vehicles-Request nötig ist (SEO, robots.txt). */
    __PRELOADED_VEHICLE__?: import("@/types/vehicle").Vehicle;
  }
}
