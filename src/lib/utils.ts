import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Preis ohne Cent anzeigen (z. B. 19.500 statt 19.499,99) */
export function formatPrice(price: number): string {
  return Math.round(price).toLocaleString("de-DE", { maximumFractionDigits: 0, minimumFractionDigits: 0 });
}
