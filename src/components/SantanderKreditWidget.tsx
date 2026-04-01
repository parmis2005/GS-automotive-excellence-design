import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { Vehicle } from "@/types/vehicle";

/**
 * Santander Universal Plugin – Markup laut Anleitung (script + #widget mit external-id / data-nsv-*).
 * #widget liegt per Portal auf document.body (nicht in overflow-Spalten), damit Cookie-/Rechner-Layer
 * nicht abgeschnitten werden. Doppelte Body-Teaser werden zusammengeführt.
 *
 * SPA: Das Plugin registriert bei jedem Script-Lauf einen weiteren `widgetInitialized`-Listener und
 * sucht `san-widget-floating` per [0] – ohne Bereinigung bleibt der Teaser/Rechner vom vorherigen Fahrzeug.
 */

declare global {
  interface Window {
    __sanWidgetInitListener?: EventListener;
    __sanAddEventListenerPatched?: boolean;
  }
}

function ensureSingleWidgetInitializedListener() {
  if (typeof window === "undefined" || window.__sanAddEventListenerPatched) return;
  window.__sanAddEventListenerPatched = true;
  const w = window;
  const orig = w.addEventListener.bind(w);
  w.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === "widgetInitialized" && listener && typeof listener === "function") {
      if (w.__sanWidgetInitListener) {
        w.removeEventListener("widgetInitialized", w.__sanWidgetInitListener);
      }
      w.__sanWidgetInitListener = listener as EventListener;
    }
    return orig(type, listener, options);
  };
}

function removeSantanderFloatingLayers() {
  document.querySelectorAll(".san-widget-floating").forEach((n) => n.remove());
}

/** Bei Breakpoint-Wechseln können alte Floating-Knoten übrig bleiben; wir nutzen immer den neuesten. */
function getActiveSantanderFloating(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll(".san-widget-floating")).filter(
    (n): n is HTMLElement => n instanceof HTMLElement,
  );
  if (all.length === 0) return null;
  if (all.length > 1) {
    // Alte Instanzen entsorgen, damit Positionierung/Klick immer auf dem aktuellen Widget landet.
    for (let i = 0; i < all.length - 1; i += 1) all[i].remove();
  }
  return all[all.length - 1];
}
type SantanderKreditWidgetProps = {
  vehicle: Vehicle;
  mobileInlineButton?: boolean;
  avoidOverlapIds?: string[];
  avoidOverlapPadding?: number;
  alignRightToId?: string;
  alignRightPadding?: number;
  alignLeftToId?: string;
  alignLeftPadding?: number;
  /** Teaser-linker Rand mindestens rechts von diesem Element (z. B. Preis), damit fixed-Position nicht nach links kollabiert. */
  teaserRightOfElementId?: string;
  /** Mehrere Kanten (z. B. Block + große Preiszeile) — max(rechts) zaehlt, falls Text aus der Spalte herausragt. */
  teaserRightOfElementIds?: string[];
  teaserRightOfGapPx?: number;
  /** Rechter Rand des Teasers maximal bis hier (z. B. #vehicle-detail-card), um freie Flaeche zu nutzen. */
  teaserClampRightToElementId?: string;
  /** Obergrenze Teaser-Breite (Text weniger hoch). */
  teaserMaxWidthPx?: number;
  /** Zusaetzlich zu gap nach gemessener rechter Kante (€-Glyph / Subpixel). */
  teaserRightExtraBufferPx?: number;
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
    if (!Number.isNaN(dt.getTime())) {
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
  return Math.round(ps * 0.73549875);
}

function mapFuelToWidget(fuel: string | undefined) {
  const f = (fuel ?? "").toLowerCase();
  if (!f) return "Benzin";
  if (f.includes("elekt")) return "Elektro";
  if (f.includes("hybrid")) return "Hybrid";
  if (f.includes("dies")) return "Diesel";
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
  return "Limousine";
}

function isLikelySantanderBodyTeaser(el: Element) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.id === "root" || el.id === "santander-widget-portal-root") return false;
  const tag = el.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK" || tag === "NOSCRIPT") return false;
  const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
  return txt.includes("Fahrzeug finanzieren?") && txt.includes("mtl.");
}

/** Nur ein Teaser: oft legt das Plugin nach Klick einen zweiten Knoten an → zwei „Finanzieren“-Buttons. */
function dedupeSantanderTeasersOnBody() {
  const body = document.body;
  const teasers = Array.from(body.children).filter(isLikelySantanderBodyTeaser) as HTMLElement[];
  if (teasers.length <= 1) return;

  let keep = teasers[0];
  let best = -1;
  for (const t of teasers) {
    const st = getComputedStyle(t);
    const r = t.getBoundingClientRect();
    let score = r.top + r.height / 2;
    if (st.position === "fixed") score += 1e6;
    if (score > best) {
      best = score;
      keep = t;
    }
  }
  for (const t of teasers) {
    if (t !== keep) t.remove();
  }
}


/**
 * Nur Teaser-Verankerung zurücknehmen.
 * `bottom` nicht entfernen – sonst wird Santanders `bottom: 0` im Rechner gelöscht und das Modal sitzt zu weit oben.
 */
function clearSantanderTeaserAnchorOffsets(el: HTMLElement) {
  for (const p of ["left", "top", "right", "width", "max-width"] as const) {
    el.style.removeProperty(p);
  }
}

/** Rechner nutzt dasselbe .san-widget-floating wie der Teaser – hier keine Teaser-Geometrie erzwingen. */
function isSantanderFloatingExpanded(el: HTMLElement) {
  const s = el.style;
  if (s.minHeight === "100%" || s.minWidth === "100%") return true;
  const h = s.height;
  if (h === "100%" || h === "100vh" || h === "100dvh") return true;

  const cs = getComputedStyle(el);
  if (cs.minHeight === "100%" || cs.minWidth === "100%") return true;

  const r = el.getBoundingClientRect();
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  // Nur als Vollbild behandeln, wenn der Layer tatsaechlich nahezu den Viewport ausfuellt.
  if (r.width >= vw - 2 && r.height >= vh - 2) return true;

  return false;
}

function teardownSantanderOnRouteLeave() {
  document.getElementById("santander-universal-plugin")?.remove();
  removeSantanderFloatingLayers();
  if (typeof window !== "undefined" && window.__sanWidgetInitListener) {
    window.removeEventListener("widgetInitialized", window.__sanWidgetInitListener);
    window.__sanWidgetInitListener = undefined;
  }
  const body = document.body;
  if (!body) return;
  for (const el of Array.from(body.children)) {
    if (isLikelySantanderBodyTeaser(el)) el.remove();
  }
}

export default function SantanderKreditWidget({
  vehicle,
  mobileInlineButton = false,
  avoidOverlapIds = [],
  avoidOverlapPadding = 8,
  alignRightToId,
  alignRightPadding = 0,
  alignLeftToId,
  alignLeftPadding = 0,
  teaserRightOfElementId,
  teaserRightOfElementIds,
  teaserRightOfGapPx = 8,
  teaserClampRightToElementId,
  teaserMaxWidthPx = 560,
  teaserRightExtraBufferPx = 12,
}: SantanderKreditWidgetProps) {
  const teaserBoundaryIds = useMemo(
    () =>
      teaserRightOfElementIds && teaserRightOfElementIds.length > 0
        ? teaserRightOfElementIds
        : teaserRightOfElementId
          ? [teaserRightOfElementId]
          : [],
    [teaserRightOfElementIds, teaserRightOfElementId],
  );

  const akz = SANTANDER_AKZ;
  const dealerNr = SANTANDER_DEALER_NR;
  const dedupeTimerRef = useRef<number | undefined>(undefined);
  const teaserAnchorRef = useRef<HTMLDivElement | null>(null);
  /** Mobil: gleiche Bounding Box wie die sichtbare Leiste — echter Teaser liegt darueber (opacity ~0), Tap trifft Santander. */
  const mobileHitAreaRef = useRef<HTMLDivElement | null>(null);

  if (!akz || !dealerNr) return null;

  const powerKw = vehicle.powerKw ?? psToKw(vehicle.power) ?? 0;
  const registrationDate = toYmdFromDate(vehicle.arrivalDate, vehicle.year);
  const nsvSort = mapSortToWidget(vehicle.vehicleType, vehicle.category);
  const nsvFuelType = mapFuelToWidget(vehicle.fuel);

  /** Alle für Santander relevanten Felder – bei Änderung Plugin neu laden. */
  const vehiclePluginKey = useMemo(
    () =>
      [
        vehicle.id,
        vehicle.price,
        vehicle.mileage,
        vehicle.brand,
        vehicle.model,
        vehicle.image,
        vehicle.year,
        vehicle.fuel,
        vehicle.powerKw ?? "",
        vehicle.power ?? "",
        vehicle.vehicleType ?? "",
        vehicle.category ?? "",
        vehicle.isNew ? 1 : 0,
        vehicle.arrivalDate ?? "",
      ].join("|"),
    [
      vehicle.id,
      vehicle.price,
      vehicle.mileage,
      vehicle.brand,
      vehicle.model,
      vehicle.image,
      vehicle.year,
      vehicle.fuel,
      vehicle.powerKw,
      vehicle.power,
      vehicle.vehicleType,
      vehicle.category,
      vehicle.isNew,
      vehicle.arrivalDate,
    ],
  );

  useEffect(() => {
    ensureSingleWidgetInitializedListener();
    teardownSantanderOnRouteLeave();

    const script = document.createElement("script");
    script.id = "santander-universal-plugin";
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://acapi.santander.de/script/UniversalPlugin?AKZ=${encodeURIComponent(akz)}&_veh=${encodeURIComponent(vehicle.id)}`;
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);

    const mo = new MutationObserver(() => {
      if (dedupeTimerRef.current !== undefined) window.clearTimeout(dedupeTimerRef.current);
      dedupeTimerRef.current = window.setTimeout(() => {
        dedupeTimerRef.current = undefined;
        dedupeSantanderTeasersOnBody();
      }, 80);
    });
    mo.observe(document.body, { childList: true, subtree: false });

    const slowDedupe = window.setInterval(dedupeSantanderTeasersOnBody, 2000);

    return () => {
      mo.disconnect();
      window.clearInterval(slowDedupe);
      if (dedupeTimerRef.current !== undefined) window.clearTimeout(dedupeTimerRef.current);
      teardownSantanderOnRouteLeave();
    };
  }, [akz, dealerNr, vehiclePluginKey]);

  /** Sichtbaren Teaser an den Layout-Platzhalter hängen (statt unten mittig). Rechner-Vollbild unverändert. */
  useLayoutEffect(() => {
    const anchor = teaserAnchorRef.current;
    if (!anchor) return;

    let floatMo: MutationObserver | null = null;
    let floatingEl: HTMLElement | null = null;

    const attachFloatObserver = (el: HTMLElement) => {
      if (floatingEl === el && floatMo) return;
      floatMo?.disconnect();
      floatingEl = el;
      floatMo = new MutationObserver(() => sync());
      floatMo.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
    };

    const sync = () => {
      const floating = getActiveSantanderFloating();
      if (!floating || !anchor.isConnected) return;

      // Vollbild-Rechner zuerst (auch Mobile) — sonst wuerde der mobileInline-Zweig den Layer sofort wieder verstecken.
      if (isSantanderFloatingExpanded(floating)) {
        floating.style.removeProperty("opacity");
        floating.style.removeProperty("pointer-events");
        clearSantanderTeaserAnchorOffsets(floating);
        const vw = window.visualViewport?.width ?? window.innerWidth;
        const r = floating.getBoundingClientRect();
        if (r.width < vw * 0.9) {
          floating.style.setProperty("left", "0");
          floating.style.setProperty("right", "0");
          floating.style.setProperty("width", "100%");
          floating.style.removeProperty("max-width");
        }
        return;
      }

      if (mobileInlineButton) {
        attachFloatObserver(floating);
        const hitEl = mobileHitAreaRef.current ?? anchor;
        const r = hitEl.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return;

        const vw = window.visualViewport?.width ?? window.innerWidth;
        const vhpad = 6;
        let left = Math.round(r.left);
        let top = Math.round(r.top);
        let w = Math.round(r.width);
        left = Math.max(vhpad, Math.min(left, vw - vhpad - 24));
        if (left + w > vw - vhpad) w = Math.max(48, vw - vhpad - left);

        floating.style.setProperty("position", "fixed");
        floating.style.setProperty("right", "auto");
        floating.style.setProperty("bottom", "auto");
        floating.style.setProperty("left", `${left}px`);
        floating.style.setProperty("top", `${top}px`);
        floating.style.setProperty("width", `${w}px`);
        floating.style.setProperty("max-width", `${w}px`);
        floating.style.removeProperty("height");
        floating.style.removeProperty("overflow");
        floating.style.removeProperty("opacity");
        floating.style.setProperty("pointer-events", "auto");
        floating.style.setProperty("touch-action", "manipulation");
        floating.style.setProperty("z-index", "80");
        return;
      }

      floating.style.removeProperty("opacity");
      floating.style.removeProperty("pointer-events");

      attachFloatObserver(floating);

      const rect = anchor.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;

      const vw = window.visualViewport?.width ?? window.innerWidth;
      const pad = 12;
      const maxWidth = Math.max(0, vw - pad * 2);
      const width = Math.min(Math.round(rect.width), Math.round(maxWidth));

      floating.style.setProperty("position", "fixed");
      floating.style.setProperty("right", "auto");
      floating.style.setProperty("bottom", "auto");

      if (alignRightToId || alignLeftToId) {
        const isLeftViewport = alignLeftToId === "viewport";
        const leftTarget = isLeftViewport ? null : (alignLeftToId ? document.getElementById(alignLeftToId) : null);
        const isViewport = alignRightToId === "viewport";
        const target = isViewport ? null : (alignRightToId ? document.getElementById(alignRightToId) : null);
        if (isViewport || target || isLeftViewport || leftTarget) {
          const targetRect = target ? target.getBoundingClientRect() : null;
          const leftRect = leftTarget ? leftTarget.getBoundingClientRect() : null;
          const availWidth = Math.max(
            1,
            (targetRect ? targetRect.width : vw) - alignRightPadding * 2,
          );
          const finalWidth = Math.min(width, availWidth);
          floating.style.setProperty("width", `${Math.round(finalWidth)}px`);
          floating.style.setProperty("max-width", `${Math.round(finalWidth)}px`);
          const floatRect = floating.getBoundingClientRect();
          const floatWidth = Math.max(floatRect.width, finalWidth);
          let left = (targetRect ? targetRect.right : vw) - floatWidth - alignRightPadding;
          if (alignLeftToId) {
            left = (leftRect ? leftRect.left : 0) + alignLeftPadding;
          }
          left = Math.max(left, 0);
          floating.style.setProperty("left", `${Math.round(left)}px`);
          floating.style.setProperty("top", `${Math.round(rect.top)}px`);
          return;
        }
      }

      const ar = rect;
      const anchorLeftPx = Math.max(pad, Math.round(ar.left));
      /** Unter lg: Preis- und Santander-Zeile sind gestapelt — nur Anker nutzen (Desktop-Logik unveraendert). */
      const narrowViewport = vw < 1024;

      let minClearLeft = 0;
      let topY = Math.round(ar.top);
      if (!narrowViewport) {
        for (const id of teaserBoundaryIds) {
          const refEl = document.getElementById(id);
          if (refEl) {
            const rr = refEl.getBoundingClientRect();
            minClearLeft = Math.max(minClearLeft, Math.round(rr.right + teaserRightOfGapPx));
            topY = Math.min(topY, Math.round(rr.top));
          }
        }
      }

      const maxRight = vw - pad;
      let rightLimit = maxRight;
      if (teaserClampRightToElementId) {
        const box = document.getElementById(teaserClampRightToElementId);
        if (box) {
          rightLimit = Math.min(maxRight, Math.round(box.getBoundingClientRect().right) - pad);
        }
      }

      const left = narrowViewport
        ? anchorLeftPx
        : teaserBoundaryIds.length > 0
          ? Math.max(anchorLeftPx, minClearLeft)
          : anchorLeftPx;
      let w = Math.min(teaserMaxWidthPx, Math.floor(rightLimit - left));
      if (w < 40) {
        w = Math.min(teaserMaxWidthPx, Math.max(40, Math.floor(rightLimit - left)));
      }
      if (w < 24) {
        w = Math.min(teaserMaxWidthPx, Math.max(24, Math.floor(rightLimit - left)));
      }
      if (left + w > vw - pad) {
        w = Math.max(40, vw - pad - left);
      }

      floating.style.setProperty("left", `${left}px`);
      floating.style.setProperty("top", `${topY}px`);
      floating.style.setProperty("width", `${w}px`);
      floating.style.setProperty("max-width", `${w}px`);

      let top = topY;
      if (avoidOverlapIds.length > 0) {
        const floatRect = floating.getBoundingClientRect();
        const floatLeft = left;
        const floatRight = left + w;
        const floatHeight = floatRect.height || rect.height;
        const floatTop = top;
        const floatBottom = floatTop + floatHeight;

        avoidOverlapIds.forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          const b = el.getBoundingClientRect();
          const horizontalOverlap = floatRight > b.left && floatLeft < b.right;
          const verticalOverlap = floatBottom > b.top && floatTop < b.bottom;
          if (horizontalOverlap && verticalOverlap) {
            top = Math.max(top, b.bottom + avoidOverlapPadding);
          }
        });
      }

      floating.style.setProperty("top", `${Math.round(top)}px`);
    };

    const onWin = () => requestAnimationFrame(sync);
    const onWidgetReady = () => {
      requestAnimationFrame(() => {
        sync();
        requestAnimationFrame(sync);
      });
    };

    window.addEventListener("widgetInitialized", onWidgetReady);
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);

    const ro = new ResizeObserver(onWin);
    if (mobileInlineButton && mobileHitAreaRef.current) {
      ro.observe(mobileHitAreaRef.current);
    } else {
      ro.observe(anchor);
    }

    const bodyMo = new MutationObserver(() => {
      const el = getActiveSantanderFloating();
      if (el) {
        attachFloatObserver(el);
        sync();
      }
    });
    bodyMo.observe(document.body, { childList: true, subtree: false });

    onWidgetReady();
    const poll = window.setInterval(() => {
      if (getActiveSantanderFloating()) {
        onWidgetReady();
        window.clearInterval(poll);
      }
    }, 50);
    const pollEnd = window.setTimeout(() => window.clearInterval(poll), 20000);

    return () => {
      window.removeEventListener("widgetInitialized", onWidgetReady);
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
      ro.disconnect();
      bodyMo.disconnect();
      floatMo?.disconnect();
      window.clearInterval(poll);
      window.clearTimeout(pollEnd);
    };
  }, [
    vehiclePluginKey,
    mobileInlineButton,
    teaserBoundaryIds,
    teaserRightOfGapPx,
    teaserClampRightToElementId,
    teaserMaxWidthPx,
    teaserRightExtraBufferPx,
  ]);

  const widgetMarkup = (
    <div
      id="santander-widget-portal-root"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        overflow: "visible",
        pointerEvents: "none",
        clipPath: "none",
      }}
    >
      <div
        id="widget"
        external-id={dealerNr}
        data-display-placement={SANTANDER_DISPLAY_PLACEMENT}
        data-nsv-annual-percentage-rate={SANTANDER_ANNUAL_RATE}
        data-nsv-manufacturer={vehicle.brand}
        data-nsv-model={vehicle.model}
        data-nsv-power-in-kw={powerKw}
        data-nsv-price={vehicle.price}
        data-nsv-sort={nsvSort}
        data-nsv-fuel-type={nsvFuelType}
        data-nsv-type={vehicle.isNew ? 1 : 0}
        data-nsv-mileage={vehicle.mileage}
        data-nsv-registration-date={registrationDate}
        data-nsv-image-url={vehicle.image}
      >
        <span className="embedded-widget-legal-text" />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobil: nur Platzhalter-Box — sichtbar ist ausschliesslich der echte Santander-Teaser (fixed, per sync). */}
      <div
        ref={mobileInlineButton ? mobileHitAreaRef : undefined}
        className={
          mobileInlineButton
            ? "relative min-h-[48px] w-full min-w-0 shrink-0"
            : "relative h-full w-full min-h-0 min-w-0 shrink-0"
        }
      >
        <div
          ref={teaserAnchorRef}
          id="santander-teaser-anchor"
          className={
            mobileInlineButton
              ? "pointer-events-none absolute inset-0 overflow-visible"
              : "pointer-events-none h-full w-full min-h-0 min-w-0 overflow-visible"
          }
          aria-hidden
        />
      </div>
      {typeof document !== "undefined" ? createPortal(widgetMarkup, document.body) : null}
    </>
  );
}
