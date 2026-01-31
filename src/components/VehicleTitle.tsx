/**
 * Zeigt Fahrzeugtitel mit Baureihe inline und optional Modellzusatz darunter.
 * - Titel: "BMW 4er" (fett) + " (G21)" (kleiner, dünner, direkt daneben)
 * - Modellzusatz: z. B. "eDrive40 GC M-SPORT-PRO ACC AHK 360°HEAD-UP" – darunter, kleinere moderne Schrift
 */

interface VehicleTitleProps {
  brand: string;
  model: string;
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
  const suffix = productionSeries?.trim();
  const variant = modelVariant?.trim();
  if (!base) return <Tag className={className}>Fahrzeug</Tag>;

  const titleLine = (
    <Tag className={className}>
      {base}
      {suffix && (
        <span className="text-[0.85em] font-light opacity-90">
          {" "}({suffix})
        </span>
      )}
    </Tag>
  );

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
