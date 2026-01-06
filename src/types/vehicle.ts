// Vehicle type definition - will be used with API later
export interface Vehicle {
  id: string;
  image: string;
  brand: string;
  model: string;
  price: number;
  year: number;
  mileage: number;
  fuel: string;
  isNew?: boolean;
  description?: string;
  power?: number; // PS (from kW conversion)
  powerKw?: number; // kW
  transmission?: string; // "Automatik" | "Schaltgetriebe"
  exteriorColor?: string; // Außenfarbe
  interiorColor?: string; // Innenfarbe
  equipment?: string[]; // Ausstattungsliste
  exposeUrl?: string; // URL zum Exposé PDF
  offerUrl?: string; // URL zur Detail-Seite
  internalNumber?: string; // Dreistellige interne Nummer / Angebotsnummer
  arrivalDate?: string; // Datum wann das Fahrzeug eingetroffen ist (ISO format)
  category?: string; // Kategorie: "Sport", "Familienwagen", "Kleinwagen", "SUV", "Luxus", "Kombi", etc.
  vatDisplayable?: boolean; // MwSt. ausweisbar (true) oder nicht ausweisbar (false)
}
