/**
 * Entwurf für das Ankauf-/Inzahlungsnahme-Formular: bleibt erhalten,
 * wenn Nutzer z. B. zur Datenschutzerklärung navigieren und zurückkehren.
 *
 * - Felder & Schritt: **localStorage** (gleiche Origin, alle Tabs – wichtig, weil der
 *   Datenschutz-Link oft per `target="_blank"` einen neuen Tab öffnet; sessionStorage wäre dort leer)
 * - Hochgeladene Dateien: IndexedDB (asynchron, große Blobs)
 */

export const VEHICLE_PURCHASE_DRAFT_SESSION_KEY = "gs-auto-vehicle-purchase-draft-v1";
const IDB_NAME = "gs-auto-vehicle-purchase-draft";
const IDB_VERSION = 1;
const STORE = "files";
const KEY_PHOTOS = "photos";
const KEY_ACCIDENTS = "accidents";

export type VehiclePurchaseDraftSession = {
  v: 1;
  formData: Record<string, unknown>;
  currentStep: number;
  mileageInput: string;
};

type StoredFilePart = {
  name: string;
  type: string;
  lastModified: number;
  buffer: ArrayBuffer;
};

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

/** 3-stellige Interessensnummer für Vergleich (URL ↔ Entwurf), z. B. "12" → "012" */
export function normalizeInterestDigitsForPurchase(value: string): string {
  const digits = (value || "").replace(/\D/g, "").slice(0, 3);
  return digits ? digits.padStart(3, "0") : "";
}

/**
 * Lädt den Entwurf. Wenn die URL eine konkrete Interessensnummer hat (`?kennnr=…`)
 * und diese **nicht** zur im Entwurf gespeicherten Nummer passt (anderes Fahrzeug),
 * wird der Entwurf gelöscht und `null` zurückgegeben → Formular startet neu.
 * Ohne 3-stellige Kennnummer in der URL bleibt der Entwurf erhalten (z. B. Rückkehr von Datenschutz).
 */
export function loadDraftForVehicleInterestFromUrl(
  initialInterestFromUrl: string,
): VehiclePurchaseDraftSession | null {
  const draft = loadDraftFromSession();
  if (!draft) return null;

  const urlKenn = normalizeInterestDigitsForPurchase(initialInterestFromUrl);
  if (urlKenn.length !== 3) return draft;

  const raw = draft.formData?.interestNumber;
  const draftKenn = normalizeInterestDigitsForPurchase(
    typeof raw === "string" ? raw : String(raw ?? ""),
  );

  if (draftKenn !== urlKenn) {
    clearVehiclePurchaseDraft();
    return null;
  }

  return draft;
}

export function loadDraftFromSession(): VehiclePurchaseDraftSession | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY);
      if (raw) {
        try {
          localStorage.setItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY, raw);
        } catch {
          /* ignore */
        }
        try {
          sessionStorage.removeItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY);
        } catch {
          /* ignore */
        }
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VehiclePurchaseDraftSession;
    if (parsed?.v !== 1 || typeof parsed.formData !== "object" || parsed.formData === null) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraftToSession(draft: VehiclePurchaseDraftSession): void {
  if (typeof window === "undefined") return;
  try {
    const str = JSON.stringify(draft);
    localStorage.setItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY, str);
    try {
      sessionStorage.removeItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY);
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn("Ankauf-Entwurf (localStorage) konnte nicht gespeichert werden:", e);
  }
}

export function clearDraftSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY);
    sessionStorage.removeItem(VEHICLE_PURCHASE_DRAFT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

async function idbPut(key: string, value: StoredFilePart[]): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(value, key);
  });
}

async function idbGet(key: string): Promise<StoredFilePart[] | undefined> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as StoredFilePart[] | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbClearKeys(): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).delete(KEY_PHOTOS);
    tx.objectStore(STORE).delete(KEY_ACCIDENTS);
  });
}

function fileToPart(file: File): Promise<StoredFilePart> {
  return file.arrayBuffer().then((buffer) => ({
    name: file.name,
    type: file.type || "application/octet-stream",
    lastModified: file.lastModified,
    buffer,
  }));
}

function partToFile(part: StoredFilePart): File {
  return new File([part.buffer], part.name, {
    type: part.type,
    lastModified: part.lastModified,
  });
}

/** Fotos & Gutachten-Dateien im Entwurf speichern (ersetzt vorherige). */
export async function saveDraftFiles(photoFiles: File[], accidentFiles: File[]): Promise<void> {
  try {
    const [photoParts, accidentParts] = await Promise.all([
      Promise.all(photoFiles.map(fileToPart)),
      Promise.all(accidentFiles.map(fileToPart)),
    ]);
    await idbPut(KEY_PHOTOS, photoParts);
    await idbPut(KEY_ACCIDENTS, accidentParts);
  } catch (e) {
    console.warn("Ankauf-Entwurf (Dateien) konnte nicht gespeichert werden:", e);
  }
}

export async function loadDraftFiles(): Promise<{ photos: File[]; accidents: File[] }> {
  try {
    const [photoParts, accidentParts] = await Promise.all([idbGet(KEY_PHOTOS), idbGet(KEY_ACCIDENTS)]);
    return {
      photos: (photoParts ?? []).map(partToFile),
      accidents: (accidentParts ?? []).map(partToFile),
    };
  } catch (e) {
    console.warn("Ankauf-Entwurf (Dateien) konnte nicht geladen werden:", e);
    return { photos: [], accidents: [] };
  }
}

export async function clearDraftFiles(): Promise<void> {
  try {
    await idbClearKeys();
  } catch {
    /* ignore */
  }
}

/** Session + IndexedDB leeren (z. B. nach erfolgreicher Anfrage). */
export function clearVehiclePurchaseDraft(): void {
  clearDraftSession();
  void clearDraftFiles();
}
