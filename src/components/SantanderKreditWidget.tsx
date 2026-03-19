import { useEffect } from "react";
import type { Vehicle } from "@/types/vehicle";

type SantanderKreditWidgetProps = {
  vehicle: Vehicle;
};

const SANTANDER_AKZ = import.meta.env.VITE_SANTANDER_AKZ as string | undefined;
const SANTANDER_DEALER_NR = import.meta.env.VITE_SANTANDER_DEALERNR as string | undefined;
const SANTANDER_DISPLAY_PLACEMENT = (import.meta.env.VITE_SANTANDER_DISPLAY_PLACEMENT as
  | string
  | undefined) ?? "1948";
const SANTANDER_ANNUAL_RATE = (import.meta.env.VITE_SANTANDER_ANNUAL_PERCENTAGE_RATE as
  | string
  | undefined) ?? "5.99";

function toYmdFromDate(d: string | undefined, fallbackYear: number) {
  if (d) {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) {
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return `${fallbackYear}-01-01`;
}

function psToKw(ps?: number) {
  if (!ps || ps <= 0) return undefined;
  // 1 PS ~= 0.73549875 kW
  return Math.round(ps * 0.73549875);
}

function mapFuelToWidget(fuel: string | undefined) {
  const f = (fuel ?? "").toLowerCase();
  if (!f) return "Benzin";
  if (f.includes("elekt")) return "Elektro";
  if (f.includes("hybrid")) return "Hybrid";
  if (f.includes("dies")) return "Diesel";
  // "Petrol" / "Benzin" / everything else default
  return "Benzin";
}

function mapSortToWidget(vehicleType?: string, category?: string) {
  const t = (vehicleType ?? category ?? "").toLowerCase();
  if (t.includes("cabrio")) return "Cabrio";
  if (t.includes("kombi") || t.includes("estate") || t.includes("avant")) return "EstateCar";
  if (t.includes("sport")) return "SportsCar";
  if (t.includes("klein") || t.includes("corsa")) return "SmallCar";
  if (t.includes("van") || t.includes("transporter")) return "Van";
  if (t.includes("suv") || t.includes("offroad") || t.includes("gelande")) return "OffRoad";
  if (t.includes("limousine") || t.includes("sedan")) return "Limousine";
  // Fallback for required field
  return "Limousine";
}

export default function SantanderKreditWidget({ vehicle }: SantanderKreditWidgetProps) {
  const akz = SANTANDER_AKZ;
  const dealerNr = SANTANDER_DEALER_NR;

  const powerKw = vehicle.powerKw ?? psToKw(vehicle.power) ?? undefined;
  const registrationDate = toYmdFromDate(vehicle.arrivalDate, vehicle.year);
  const nsvSort = mapSortToWidget(vehicle.vehicleType, vehicle.category);
  const nsvFuelType = mapFuelToWidget(vehicle.fuel);

  useEffect(() => {
    // Only load the external script if configuration exists.
    if (!akz || !dealerNr) return;

    const existing = document.getElementById("santander-universal-plugin") as HTMLScriptElement | null;
    if (existing) existing.remove();

    const s = document.createElement("script");
    s.id = "santander-universal-plugin";
    s.type = "text/javascript";
    s.async = true;
    s.src = `https://acapi.santander.de/script/UniversalPlugin?AKZ=${encodeURIComponent(akz)}`;

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(s, firstScript);
  }, [akz, dealerNr, vehicle.id]);

  if (!akz || !dealerNr) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Santander widget container (required fields are filled from vehicle data) */}
      <div
        id="widget"
        external-id={dealerNr}
        data-display-placement={SANTANDER_DISPLAY_PLACEMENT}
        data-nsv-annual-percentage-rate={SANTANDER_ANNUAL_RATE}
        data-nsv-manufacturer={vehicle.brand}
        data-nsv-model={vehicle.model}
        data-nsv-power-in-kw={powerKw ?? 0}
        data-nsv-price={vehicle.price}
        data-nsv-sort={nsvSort}
        data-nsv-fuel-type={nsvFuelType}
        data-nsv-type={vehicle.isNew ? 1 : 0}
        data-nsv-mileage={vehicle.mileage}
        data-nsv-registration-date={registrationDate}
        data-nsv-image-url={vehicle.image}
      >
        <span className="embedded-widget-legal-text"></span>
      </div>
    </div>
  );
}

