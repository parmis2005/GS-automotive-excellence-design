import { ArrowUpRight } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";

type SantanderKreditWidgetProps = {
  vehicle: Vehicle;
};

const SANTANDER_AKZ = import.meta.env.VITE_SANTANDER_AKZ as string | undefined;
const SANTANDER_DEALER_NR = import.meta.env.VITE_SANTANDER_DEALERNR as string | undefined;
const SANTANDER_LINK_URL = (import.meta.env.VITE_SANTANDER_LINK_URL as string | undefined)
  ?.trim() || "https://www.santander.de/privatkunden/finanzierung/";

export default function SantanderKreditWidget({ vehicle }: SantanderKreditWidgetProps) {
  const akz = SANTANDER_AKZ;
  const dealerNr = SANTANDER_DEALER_NR;

  if (!akz || !dealerNr) return null;

  const vehicleTitle = `${vehicle.brand} ${vehicle.model}`.trim();
  const query = new URLSearchParams({
    akz,
    dealerNr,
    fahrzeug: vehicleTitle || "Fahrzeug",
    preis: String(vehicle.price ?? ""),
  });
  const href = `${SANTANDER_LINK_URL}${SANTANDER_LINK_URL.includes("?") ? "&" : "?"}${query.toString()}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
      aria-label="Finanzierung mit Santander berechnen"
    >
      Finanzierung berechnen
      <ArrowUpRight className="h-4 w-4" />
    </a>
  );
}

