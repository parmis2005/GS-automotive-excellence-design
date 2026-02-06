/**
 * Ermittelt die Anzahl der Bilder eines Fahrzeugs (HEAD-Requests an Bild-URLs).
 * Wird beim Sync genutzt, um Fahrzeuge mit > 4 echten Fotos zu identifizieren
 * (4 = Platzhalter-Anzahl, wenn noch keine Fotos gemacht wurden).
 */

/**
 * Baut die URL für Bild Nr. ino aus der Basis-Image-URL
 */
function buildImageUrlForIno(baseImageUrl: string, vehicleId: string, ino: number): string {
  if (!baseImageUrl || !baseImageUrl.trim()) {
    return `https://img.cargate360.de/default.aspx?vid=${vehicleId}&bid=1790&format=xl&ino=${ino}&app=Kiste-Default`;
  }
  if (/[?&]ino=\d+/i.test(baseImageUrl)) {
    return baseImageUrl.replace(/ino=\d+/i, `ino=${ino}`);
  }
  const sep = baseImageUrl.includes("?") ? "&" : "?";
  return `${baseImageUrl}${sep}ino=${ino}`;
}

/**
 * Prüft per HEAD-Request, ob eine Bild-URL existiert
 */
async function checkImageExists(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(imageUrl, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GS-Auto-Check/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok && response.headers.get("content-type")?.startsWith("image/") === true;
  } catch {
    return false;
  }
}

/**
 * Prüft, ob ein Fahrzeug nur das Platzhalter-Bild hat (Bild 2 existiert nicht).
 * Wenn true: Erstes Bild ist Platzhalter ("Bald verfügbar").
 */
export async function hasOnlyPlaceholderImage(vehicleId: string, baseImageUrl: string): Promise<boolean> {
  if (!baseImageUrl || !baseImageUrl.trim()) return true;
  const url2 = buildImageUrlForIno(baseImageUrl, vehicleId, 2);
  const exists = await checkImageExists(url2);
  return !exists;
}

/**
 * Zählt die vorhandenen Bilder (ino 1, 2, 3, …) bis maximal maxCheck.
 * Stoppt nach 2 aufeinanderfolgenden Fehlern.
 */
export async function getVehicleImageCount(vehicleId: string, baseImageUrl: string, maxCheck: number = 10): Promise<number> {
  if (!baseImageUrl || !baseImageUrl.trim()) return 0;
  let count = 0;
  let consecutiveFailures = 0;
  for (let ino = 1; ino <= maxCheck; ino++) {
    const url = buildImageUrlForIno(baseImageUrl, vehicleId, ino);
    const exists = await checkImageExists(url);
    if (exists) {
      count = ino;
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      if (consecutiveFailures >= 2) break;
    }
  }
  return count;
}
