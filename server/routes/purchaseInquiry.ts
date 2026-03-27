import { randomUUID } from "crypto";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { insertPurchaseInquiry, getPurchaseInquiries } from "../db/database.js";

export const purchaseInquiryRouter = Router();

const MAX_FILE_SIZE_MB = 5;
const MAX_TOTAL_UPLOAD_MB = 25;
const MAX_FILE_COUNT = 20;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILE_COUNT,
  },
});
const maybeUpload = (req: any, res: any, next: any) => {
  if (req.is("multipart/form-data")) {
    return upload.fields([
      { name: "photoFiles" },
      { name: "accidentFiles" },
    ])(req, res, (err?: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            error: `Datei zu groß. Maximal ${MAX_FILE_SIZE_MB} MB pro Datei.`,
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(413).json({
            success: false,
            error: "Zu viele Dateien im Upload.",
          });
        }
      }
      return res.status(400).json({
        success: false,
        error: "Datei-Upload fehlgeschlagen.",
      });
    });
  }
  return next();
};

type MulterRequest = Request & {
  files?: Record<string, Express.Multer.File[]>;
};

type UploadListEntry = { name: string; url?: string; path?: string };

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabaseBucket = process.env.SUPABASE_BUCKET_ANKAUF?.trim() || "ankauf-uploads";
const signedUrlSeconds = 60 * 60 * 24 * 14;
const SUPABASE_UPLOAD_TIMEOUT_MS = 6_000;
const SUPABASE_SIGNED_URL_TIMEOUT_MS = 12_000;
const SUPABASE_UPLOAD_BUDGET_MS = 60_000;
const SUPABASE_UPLOAD_CONCURRENCY = 4;
const RESEND_TIMEOUT_MS = 12_000;
const DB_INSERT_TIMEOUT_MS = 3_000;
const SUPABASE_SIGNED_URL_RETRIES = 3;
const SUPABASE_SIGNED_URL_SECOND_PASS_RETRIES = 5;
const UPLOAD_SESSION_TTL_MS = 45 * 60 * 1000;
const CREATE_SIGNED_UPLOAD_TIMEOUT_MS = 15_000;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

type UploadSessionRecord = {
  expiresAt: number;
  allowedPaths: Set<string>;
};

const uploadSessions = new Map<string, UploadSessionRecord>();

function pruneUploadSessions() {
  const now = Date.now();
  for (const [id, s] of uploadSessions) {
    if (s.expiresAt < now) uploadSessions.delete(id);
  }
}

/** GET /api/purchase-inquiry – alle Ankauf-Anfragen abrufen (z.B. für Admin) */
purchaseInquiryRouter.get("/", async (_req, res) => {
  try {
    const inquiries = await getPurchaseInquiries();
    res.json({ success: true, inquiries });
  } catch (error) {
    console.error("Failed to fetch purchase inquiries:", error);
    res.status(500).json({ success: false, error: "Fehler beim Laden der Anfragen" });
  }
});

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resendFrom = process.env.RESEND_FROM?.trim() || "ankauf@gsauto.de";
const resendTo = process.env.RESEND_TO?.trim() || "sebo.ziemianski@web.de";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatRow = (label: string, value?: unknown) => {
  const str = value != null ? String(value).trim() : "";
  const safeValue = str ? escapeHtml(str) : "-";
  return `<tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:180px;">${label}</td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;">${safeValue}</td></tr>`;
};

const formatFileRows = (label: string, files: { name: string; url?: string }[]) => {
  if (!files.length) return formatRow(label, "-");
  const items = files
    .map((file) => {
      const name = escapeHtml(file.name);
      if (file.url) {
        const url = escapeHtml(file.url);
        return `<li style="margin:4px 0;"><a href="${url}" target="_blank" rel="noreferrer" style="color:#0f2439;text-decoration:underline;">${name}</a></li>`;
      }
      return `<li style="margin:4px 0;">${name} <span style="color:#6b7280;">(ohne Link)</span></li>`;
    })
    .join("");
  return `<tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:180px;">${label}</td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;"><ul style="padding-left:18px;margin:0;">${items}</ul></td></tr>`;
};

const formatSection = (title: string, rows: string) =>
  `<div style="margin-bottom:24px;"><h3 style="margin:0 0 12px;padding:8px 0;font-size:14px;font-weight:700;color:#0f2439;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #0f2439;">${escapeHtml(title)}</h3><table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table></div>`;

const formatPrice = (value?: string | null) => {
  if (!value || !value.trim()) return "-";
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted} €`;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout (${timeoutMs}ms)`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const createSignedUrlWithRetry = async (
  path: string,
  retries: number,
): Promise<string | null> => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const { data, error } = await withTimeout(
        supabase!.storage.from(supabaseBucket).createSignedUrl(path, signedUrlSeconds),
        SUPABASE_SIGNED_URL_TIMEOUT_MS,
        `supabase signed url attempt ${attempt}`,
      );
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
      console.error(`Supabase signed URL error (attempt ${attempt}/${retries}):`, error);
    } catch (error) {
      console.error(`Supabase signed URL timeout/failure (attempt ${attempt}/${retries}):`, error);
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  return null;
};

async function enrichLinksWithSignedUrls(links: UploadListEntry[]) {
  await Promise.all(
    links.map(async (entry) => {
      if (entry.path && !entry.url) {
        const url = await createSignedUrlWithRetry(entry.path, SUPABASE_SIGNED_URL_SECOND_PASS_RETRIES);
        if (url) entry.url = url;
      }
    }),
  );
}

async function finalizePurchaseInquiry(
  res: Response,
  payload: Record<string, unknown>,
  contactPlz: string,
  contactCity: string,
  photoLinks: UploadListEntry[],
  accidentLinks: UploadListEntry[],
) {
  payload.photoFiles =
    photoLinks.length > 0
      ? photoLinks.map((file) => file.url || `${file.name} (ohne Link)`).join(", ")
      : "-";
  payload.accidentFiles =
    accidentLinks.length > 0
      ? accidentLinks.map((file) => file.url || `${file.name} (ohne Link)`).join(", ")
      : "-";

  let dbSaved = false;
  let dbId: number | null = null;
  try {
    const id = await withTimeout(
      insertPurchaseInquiry(payload),
      DB_INSERT_TIMEOUT_MS,
      "db insert purchase inquiry",
    );
    dbSaved = true;
    dbId = id;
    console.log(`✅ Ankauf-Anfrage #${id} gespeichert`);
  } catch (dbError) {
    console.error("DB-Fehler (Anfrage trotzdem weiterverarbeiten):", dbError);
  }

  let emailSent = false;
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    const now = new Date().toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Ankauf-Anfrage</title>
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f3f4f6; -webkit-font-smoothing:antialiased;">
  <div style="max-width:680px; margin:0 auto; padding:32px 16px;">
    <div style="background:#ffffff; border-radius:16px; box-shadow:0 4px 6px rgba(0,0,0,0.05); overflow:hidden;">
      <div style="background:linear-gradient(135deg, #0f2439 0%, #1e3a5f 100%); padding:28px 32px; text-align:center;">
        <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.02em;">GS Automobile Rheinland</h1>
        <p style="margin:8px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">Neue Ankauf-Anfrage</p>
        <p style="margin:16px 0 0; font-size:12px; color:rgba(255,255,255,0.6);">${escapeHtml(now)}</p>
      </div>

      <div style="padding:32px;">
        ${formatSection(
          "Fahrzeugdaten",
          `
          <tbody>
            ${formatRow("Marke", payload.make)}
            ${formatRow("Modell", payload.model)}
            ${formatRow("Ausstattungslinie", payload.trimLine)}
            ${formatRow("Karosserieform", payload.bodyType)}
            ${formatRow("Kraftstoff", payload.fuelType)}
            ${formatRow("Erstzulassung", payload.firstRegistration)}
            ${formatRow("Kilometerstand", payload.mileage)}
            ${formatRow("Leistung (PS)", payload.power)}
            ${formatRow("Halteranzahl", payload.ownersCount)}
            ${formatRow("VIN / Fahrgestellnummer", payload.vin)}
          </tbody>`,
        )}

        ${formatSection(
          "Service & HU",
          `
          <tbody>
            ${formatRow("Scheckheft vollständig", payload.serviceBook)}
            ${formatRow("Letzter Service", payload.lastService)}
            ${formatRow("HU fällig", payload.hu)}
          </tbody>`,
        )}

        ${formatSection(
          "Ausstattung & Zustand",
          `
          <tbody>
            ${formatRow("Außenfarbe", payload.exteriorColor)}
            ${formatRow("Getriebe", payload.transmission)}
            ${formatRow("Antrieb", payload.driveType)}
            ${formatRow("Ausstattung", payload.equipment)}
            ${formatRow("Allgemeiner Zustand", payload.generalCondition)}
          </tbody>`,
        )}

        ${formatSection(
          "Preisvorstellung",
          `
          <tbody>
            <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:180px;">Preisvorstellung</td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#0f2439;font-weight:700;font-size:16px;">${formatPrice(payload.priceExpectation != null ? String(payload.priceExpectation) : null)}</td></tr>
          </tbody>`,
        )}

        ${formatSection(
          "Zustand & Unfall",
          `
          <tbody>
            ${formatRow("Raucherfahrzeug", payload.smoker)}
            ${formatRow("Unfallfahrzeug", payload.accident)}
            ${formatRow("Unfall behoben", payload.accidentRepaired)}
            ${formatRow("Schadenbeschreibung", payload.accidentDescription)}
            ${formatRow("Schadenshöhe", payload.accidentAmount)}
            ${formatRow("Interessensnummer (Inzahlungnahme)", payload.interestNumber)}
            ${formatRow("Fahrzeug aus Bestand", payload.interestVehicle)}
            ${formatFileRows("Foto-Dateien", photoLinks)}
            ${formatFileRows("Gutachten-Dateien", accidentLinks)}
          </tbody>`,
        )}

        ${formatSection(
          "Kontaktdaten",
          `
          <tbody>
            ${formatRow("Vorname", payload.contactFirstName)}
            ${formatRow("Nachname", payload.contactLastName)}
            ${formatRow("Telefon", payload.contactPhone)}
            ${formatRow("E-Mail", payload.contactEmail)}
            ${formatRow("Postleitzahl", contactPlz || "-")}
            ${formatRow("Ort", contactCity || "-")}
            ${formatRow("Nachricht (optional)", (payload.contactMessage != null && String(payload.contactMessage).trim()) ? String(payload.contactMessage).trim() : "-")}
            ${formatRow("Datenschutz & Kontakt Bewertung (bestätigt)", payload.contactPrivacyConsent)}
          </tbody>`,
        )}
      </div>

      <div style="background:#f9fafb; padding:20px 32px; border-top:1px solid #e5e7eb; text-align:center;">
        <p style="margin:0; font-size:12px; color:#6b7280;">Diese Anfrage wurde über das Ankauf-Formular der Website gesendet.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = [
      "Neue Ankauf-Anfrage",
      `Marke: ${payload.make || "-"}`,
      `Modell: ${payload.model || "-"}`,
      `Ausstattungslinie: ${payload.trimLine || "-"}`,
      `Erstzulassung: ${payload.firstRegistration || "-"}`,
      `Kilometerstand: ${payload.mileage || "-"}`,
      `Halteranzahl: ${payload.ownersCount || "-"}`,
      `Scheckheft: ${payload.serviceBook || "-"}`,
      `Letzter Service: ${payload.lastService || "-"}`,
      `HU: ${payload.hu || "-"}`,
      `Außenfarbe: ${payload.exteriorColor || "-"}`,
      `Getriebe: ${payload.transmission || "-"}`,
      `Antrieb: ${payload.driveType || "-"}`,
      `Ausstattung: ${payload.equipment || "-"}`,
      `Allgemeiner Zustand: ${payload.generalCondition || "-"}`,
      `Preisvorstellung: ${payload.priceExpectation || "-"}`,
      `Raucherfahrzeug: ${payload.smoker || "-"}`,
      `Unfallfahrzeug: ${payload.accident || "-"}`,
      `Unfall behoben: ${payload.accidentRepaired || "-"}`,
      `Schadenbeschreibung: ${payload.accidentDescription || "-"}`,
      `Schadenshoehe: ${payload.accidentAmount || "-"}`,
      `VIN: ${payload.vin || "-"}`,
      `Interessensnummer: ${payload.interestNumber || "-"}`,
      `Fahrzeug aus Bestand: ${payload.interestVehicle || "-"}`,
      `Foto-Dateien: ${payload.photoFiles || "-"}`,
      `Gutachten-Dateien: ${payload.accidentFiles || "-"}`,
      `Vorname: ${payload.contactFirstName || "-"}`,
      `Nachname: ${payload.contactLastName || "-"}`,
      `Telefon: ${payload.contactPhone || "-"}`,
      `E-Mail: ${payload.contactEmail || "-"}`,
      `Postleitzahl: ${contactPlz || "-"}`,
      `Ort: ${contactCity || "-"}`,
      `Nachricht (optional): ${(payload.contactMessage != null && String(payload.contactMessage).trim()) ? String(payload.contactMessage).trim() : "-"}`,
      `Datenschutz & Kontakt Bewertung (bestätigt): ${payload.contactPrivacyConsent || "-"}`,
    ].join("\n");

    try {
      await withTimeout(
        resend.emails.send({
          from: resendFrom,
          to: resendTo,
          subject: `Ankauf-Anfrage ${payload.make || ""} ${payload.model || ""}`.trim(),
          html,
          text,
        }),
        RESEND_TIMEOUT_MS,
        "resend email",
      );
      console.log(`📧 E-Mail an ${resendTo} gesendet`);
      emailSent = true;
    } catch (emailError) {
      console.error("E-Mail-Versand fehlgeschlagen (Anfrage ist in DB gespeichert):", emailError);
    }
  } else {
    console.warn("RESEND_API_KEY nicht gesetzt – E-Mail wurde nicht versendet. Anfrage ist in der Datenbank gespeichert.");
  }

  res.json({
    success: true,
    dbSaved,
    dbId,
    emailSent,
    note: "DB war optional (Backup) – Anfrage wurde weiterverarbeitet.",
  });
}

type PrepareMeta = { kind: "photo" | "accident"; name: string; size: number; contentType: string };

purchaseInquiryRouter.post("/prepare-uploads", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: "Speicher für Uploads ist nicht konfiguriert.",
      });
    }

    const files = req.body?.files as PrepareMeta[] | undefined;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: "Keine Dateien angegeben." });
    }
    if (files.length > MAX_FILE_COUNT) {
      return res.status(413).json({ success: false, error: `Maximal ${MAX_FILE_COUNT} Dateien.` });
    }

    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    let total = 0;
    for (const f of files) {
      if (f.kind !== "photo" && f.kind !== "accident") {
        return res.status(400).json({ success: false, error: "Ungültiger Dateityp (kind)." });
      }
      if (!f.name || typeof f.size !== "number" || f.size < 1) {
        return res.status(400).json({ success: false, error: "Ungültige Dateiangaben." });
      }
      if (f.size > maxBytes) {
        return res.status(413).json({
          success: false,
          error: `Datei zu groß. Maximal ${MAX_FILE_SIZE_MB} MB pro Datei.`,
        });
      }
      const ct = (f.contentType || "").toLowerCase();
      if (!ct.startsWith("image/") && ct !== "application/pdf") {
        return res.status(400).json({ success: false, error: "Nur Bilder oder PDF erlaubt." });
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_UPLOAD_MB * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: `Gesamter Upload zu groß. Maximal ${MAX_TOTAL_UPLOAD_MB} MB insgesamt.`,
      });
    }

    pruneUploadSessions();
    const sessionId = randomUUID();
    const baseFolder = `client-uploads/${sessionId}`;
    const allowedPaths = new Set<string>();

    const slots: Array<{
      path: string;
      signedUrl: string;
      token: string;
      originalName: string;
      kind: "photo" | "accident";
    }> = [];

    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      const safeName = f.name.replace(/[^\w.\-]+/g, "_").slice(0, 180) || "file";
      const sub = f.kind === "photo" ? "photos" : "documents";
      const uniqueSuffix = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `${baseFolder}/${sub}/${uniqueSuffix}-${safeName}`;

      const signed = await withTimeout(
        supabase.storage.from(supabaseBucket).createSignedUploadUrl(path),
        CREATE_SIGNED_UPLOAD_TIMEOUT_MS,
        "createSignedUploadUrl",
      );

      if (signed.error || !signed.data?.signedUrl || !signed.data.token) {
        console.error("createSignedUploadUrl failed:", signed.error);
        return res.status(500).json({
          success: false,
          error: "Upload-Vorbereitung fehlgeschlagen. Bitte später erneut versuchen.",
        });
      }

      allowedPaths.add(path);
      slots.push({
        path,
        signedUrl: signed.data.signedUrl,
        token: signed.data.token,
        originalName: f.name,
        kind: f.kind,
      });
    }

    uploadSessions.set(sessionId, {
      expiresAt: Date.now() + UPLOAD_SESSION_TTL_MS,
      allowedPaths,
    });

    res.json({ success: true, sessionId, slots });
  } catch (error) {
    console.error("prepare-uploads:", error);
    res.status(500).json({ success: false, error: "Vorbereitung fehlgeschlagen." });
  }
});

purchaseInquiryRouter.post("/complete", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, error: "Speicher nicht konfiguriert." });
    }

    const body = req.body || {};
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const uploaded = body.uploaded as
      | Array<{ path: string; originalName: string; kind: string }>
      | undefined;

    if (!sessionId || !Array.isArray(uploaded)) {
      return res.status(400).json({ success: false, error: "Ungültige Anfrage." });
    }

    pruneUploadSessions();
    const session = uploadSessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        error: "Upload-Sitzung abgelaufen. Bitte Formular erneut senden.",
      });
    }

    const photoLinks: UploadListEntry[] = [];
    const accidentLinks: UploadListEntry[] = [];

    for (const u of uploaded) {
      const path = typeof u.path === "string" ? u.path.trim() : "";
      const originalName = typeof u.originalName === "string" ? u.originalName : "";
      const kind = u.kind === "accident" ? "accident" : "photo";
      if (!path || !session.allowedPaths.has(path)) {
        return res.status(400).json({ success: false, error: "Ungültige Upload-Pfade." });
      }
      const entry: UploadListEntry = { name: originalName || path.split("/").pop() || "Datei", path };
      if (kind === "accident") accidentLinks.push(entry);
      else photoLinks.push(entry);
    }

    uploadSessions.delete(sessionId);

    for (const entry of [...photoLinks, ...accidentLinks]) {
      if (entry.path) {
        const url = await createSignedUrlWithRetry(entry.path, SUPABASE_SIGNED_URL_RETRIES);
        if (url) entry.url = url;
      }
    }
    await enrichLinksWithSignedUrls([...photoLinks, ...accidentLinks]);

    const payload: Record<string, unknown> = { ...body };
    delete payload.sessionId;
    delete payload.uploaded;

    const contactPlz =
      payload.contactPlz != null && String(payload.contactPlz).trim()
        ? String(payload.contactPlz).trim()
        : "";
    const contactCity =
      payload.contactCity != null && String(payload.contactCity).trim()
        ? String(payload.contactCity).trim()
        : "";

    await finalizePurchaseInquiry(res, payload, contactPlz, contactCity, photoLinks, accidentLinks);
  } catch (error) {
    console.error("complete:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Anfrage konnte nicht abgeschlossen werden." });
    }
  }
});

purchaseInquiryRouter.post("/", maybeUpload, async (req, res) => {
  try {
    const payload = req.body || {};
    const contactPlz =
      payload.contactPlz != null && String(payload.contactPlz).trim()
        ? String(payload.contactPlz).trim()
        : "";
    const contactCity =
      payload.contactCity != null && String(payload.contactCity).trim()
        ? String(payload.contactCity).trim()
        : "";

    const files = ((req as MulterRequest).files || {}) as {
      photoFiles?: Express.Multer.File[];
      accidentFiles?: Express.Multer.File[];
    };
    const photoUploads = files.photoFiles ?? [];
    const accidentUploads = files.accidentFiles ?? [];
    const totalUploadBytes = [...photoUploads, ...accidentUploads].reduce(
      (sum, file) => sum + (file.size || 0),
      0,
    );
    const maxTotalUploadBytes = MAX_TOTAL_UPLOAD_MB * 1024 * 1024;
    if (totalUploadBytes > maxTotalUploadBytes) {
      return res.status(413).json({
        success: false,
        error: `Gesamter Upload zu groß. Maximal ${MAX_TOTAL_UPLOAD_MB} MB insgesamt.`,
      });
    }

    const uploadFiles = async (uploads: Express.Multer.File[], prefix: string): Promise<UploadListEntry[]> => {
      if (uploads.length === 0) return [];
      if (!supabase) {
        return uploads.map((file) => ({ name: file.originalname }));
      }

      const now = new Date();
      const folder = `${prefix}/${now.toISOString().slice(0, 10)}-${now.getTime()}`;
      const slot: (UploadListEntry | null)[] = new Array(uploads.length).fill(null);

      const startedAt = Date.now();
      let nextIndex = 0;
      const workerCount = Math.max(1, Math.min(SUPABASE_UPLOAD_CONCURRENCY, uploads.length));

      const uploadOne = async (file: Express.Multer.File, index: number) => {
        const safeName = file.originalname.replace(/[^\w.\-]+/g, "_");
        const uniqueSuffix = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
        const path = `${folder}/${uniqueSuffix}-${safeName}`;
        const { error } = await withTimeout(
          supabase.storage.from(supabaseBucket).upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          }),
          SUPABASE_UPLOAD_TIMEOUT_MS,
          "supabase upload",
        );
        if (error) {
          console.error("Supabase upload error:", error);
          slot[index] = { name: file.originalname };
          return;
        }
        const signedUrl = await createSignedUrlWithRetry(path, SUPABASE_SIGNED_URL_RETRIES);
        slot[index] = signedUrl
          ? { name: file.originalname, path, url: signedUrl }
          : { name: file.originalname, path };
      };

      const worker = async () => {
        while (nextIndex < uploads.length) {
          if (Date.now() - startedAt > SUPABASE_UPLOAD_BUDGET_MS) {
            return;
          }
          const current = nextIndex;
          nextIndex += 1;
          const file = uploads[current];
          try {
            await uploadOne(file, current);
          } catch (fileUploadError) {
            console.error("Supabase file upload failed (skip file):", fileUploadError);
            slot[current] = { name: file.originalname };
          }
        }
      };

      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      const merged: UploadListEntry[] = uploads.map((file, i) => slot[i] ?? { name: file.originalname });

      await enrichLinksWithSignedUrls(merged);

      return merged;
    };

    const photoLinks = await uploadFiles(photoUploads, "photos");
    const accidentLinks = await uploadFiles(accidentUploads, "documents");

    await finalizePurchaseInquiry(res, payload, contactPlz, contactCity, photoLinks, accidentLinks);
  } catch (error) {
    console.error("Failed to send purchase inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send inquiry",
    });
  }
});
