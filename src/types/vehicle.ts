// Vehicle type definition - will be used with API later
export interface Vehicle {
  id: string;
  image: string;
  brand: string;
  model: string;
  title?: string; // Volltitel von CarGate (z. B. "BMW 1er 118d") für Startseite
  price: number;
  year: number;
  mileage: number;
  fuel: string;
  isNew?: boolean;
  description?: string;
  power?: number; // PS (from kW conversion)
  powerKw?: number; // kW
  transmission?: string; // "Automatik" | "Schaltgetriebe"
  exteriorColor?: string; // Außenfarbe (Allgemeinfarbe für Suche)
  exteriorColorFull?: string; // Vollständige Herstellerfarbe (z. B. CAPE YORK GRUEN METALLIC) für Detailansicht
  interiorColor?: string; // Innenfarbe
  equipment?: string[]; // Ausstattungsliste
  exposeUrl?: string; // URL zum Exposé PDF
  offerUrl?: string; // URL zur Detail-Seite
  internalNumber?: string; // Dreistellige interne Nummer / Angebotsnummer
  arrivalDate?: string; // Datum wann das Fahrzeug eingetroffen ist (ISO format)
  standtage?: number; // Tage im Bestand (von API oder aus arrivalDate berechnet)
  category?: string; // Kategorie: "Sport", "Familienwagen", "Kleinwagen", "SUV", "Luxus", "Kombi", etc.
  vatDisplayable?: boolean; // MwSt. ausweisbar (true) oder nicht ausweisbar (false)
  vehicleType?: string; // Fahrzeugtyp: "Cabrio", "Limousine", "Sportwagen", "Kombi", "SUV", "Van", etc.
  previousOwners?: number; // Anzahl der Vorbesitzer
  productionSeries?: string; // Baureihe (z. B. G21, F30) – optional hinter Modell anzeigbar
  modelVariant?: string; // Modellzusatz (z. B. eDrive40 GC M-SPORT-PRO) – von CarGate Version/Variant
  cubicCapacity?: number; // Hubraum in ccm
  cylinders?: number; // Anzahl Zylinder
  imageCount?: number; // Anzahl Bilder (> 4 = echte Fotos)
}
