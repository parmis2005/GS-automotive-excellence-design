/**
 * Zeigt Fahrzeugtitel ohne Baureihe in Klammern. Modellzusatz optional darunter.
 * - Titel: "BMW 4er" (fett)
 * - Modellzusatz: z. B. "eDrive40 GC M-SPORT-PRO ACC AHK 360°HEAD-UP" – darunter, kleinere moderne Schrift
 * - Baureihe (productionSeries) wird nicht mehr angezeigt, bleibt aber für Filter/Suche verfügbar.
 */

interface VehicleTitleProps {
  brand: string;
  model: string;
  /** Baureihe – nicht mehr in der Anzeige, nur für Suche/Filter */
  productionSeries?: string | null;
  /** Modellzusatz (z. B. eDrive40 GC M-SPORT-PRO) – direkt unter dem Titel */
  modelVariant?: string | null;
  fallbackTitle?: string | null;
  /** Zusätzliche Klassen für den äußeren Container */
  className?: string;
  /** Zusätzliche Klassen für den Modellzusatz (z. B. text-xs bei kompakten Karten) */
  variantClassName?: string;
  /** Tag für die Überschrift (h1, h2, h3, ...) */
  as?: "h1" | "h2" | "h3" | "h4" | "span";
}

export function VehicleTitle({
  brand,
  model,
  productionSeries,
  modelVariant,
  fallbackTitle,
  className = "",
  variantClassName = "text-sm font-normal text-muted-foreground tracking-wide",
  as: Tag = "span",
}: VehicleTitleProps) {
  const base = [brand, model].filter(Boolean).join(" ").trim() || fallbackTitle?.trim() || "";
  const variant = modelVariant?.trim();
  if (!base) return <Tag className={className}>Fahrzeug</Tag>;

  const titleLine = <Tag className={className}>{base}</Tag>;

  if (variant) {
    return (
      <div className="space-y-1">
        {titleLine}
        <p className={variantClassName}>
          {variant}
        </p>
      </div>
    );
  }
  return titleLine;
}
