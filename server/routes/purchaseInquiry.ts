import { Router, type Request } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { insertPurchaseInquiry, getPurchaseInquiries } from "../db/database.js";

export const purchaseInquiryRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });
const maybeUpload = (req: any, res: any, next: any) => {
  if (req.is("multipart/form-data")) {
    return upload.fields([
      { name: "photoFiles" },
      { name: "accidentFiles" },
    ])(req, res, next);
  }
  return next();
};

type MulterRequest = Request & {
  files?: Record<string, Express.Multer.File[]>;
};

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabaseBucket = process.env.SUPABASE_BUCKET_ANKAUF?.trim() || "ankauf-uploads";
const signedUrlSeconds = 60 * 60 * 24 * 14;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

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

const formatRow = (label: string, value?: string | number | null) => {
  const str = value != null ? String(value).trim() : "";
  const safeValue = str ? escapeHtml(str) : "-";
  return `<tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:180px;">${label}</td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;">${safeValue}</td></tr>`;
};

const formatFileRows = (label: string, files: { name: string; url: string }[]) => {
  if (!files.length) return formatRow(label, "-");
  const items = files
    .map((file) => {
      const name = escapeHtml(file.name);
      const url = escapeHtml(file.url);
      return `<li style="margin:4px 0;"><a href="${url}" target="_blank" rel="noreferrer" style="color:#0f2439;text-decoration:underline;">${name}</a></li>`;
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

purchaseInquiryRouter.post("/", maybeUpload, async (req, res) => {
  try {
    const payload = req.body || {};
    // PLZ/Ort explizit aus Body lesen (Multer liefert alle Form-Felder in req.body)
    const contactPlz = (payload.contactPlz != null && String(payload.contactPlz).trim()) ? String(payload.contactPlz).trim() : "";
    const contactCity = (payload.contactCity != null && String(payload.contactCity).trim()) ? String(payload.contactCity).trim() : "";

    const files = ((req as MulterRequest).files || {}) as {
      photoFiles?: Express.Multer.File[];
      accidentFiles?: Express.Multer.File[];
    };
    const photoUploads = files.photoFiles ?? [];
    const accidentUploads = files.accidentFiles ?? [];

    const uploadFiles = async (uploads: Express.Multer.File[], prefix: string) => {
      if (!supabase || uploads.length === 0) return [];
      const now = new Date();
      const folder = `${prefix}/${now.toISOString().slice(0, 10)}-${now.getTime()}`;
      const results: { name: string; url: string }[] = [];

      for (const file of uploads) {
        const safeName = file.originalname.replace(/[^\w.\-]+/g, "_");
        const path = `${folder}/${safeName}`;
        const { error } = await supabase.storage.from(supabaseBucket).upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
        if (error) {
          console.error("Supabase upload error:", error);
          continue;
        }
        const { data, error: urlError } = await supabase.storage
          .from(supabaseBucket)
          .createSignedUrl(path, signedUrlSeconds);
        if (urlError || !data?.signedUrl) {
          console.error("Supabase signed URL error:", urlError);
          continue;
        }
        results.push({ name: file.originalname, url: data.signedUrl });
      }

      return results;
    };

    const photoLinks = await uploadFiles(photoUploads, "photos");
    const accidentLinks = await uploadFiles(accidentUploads, "documents");

    if (photoLinks.length) {
      payload.photoFiles = photoLinks.map((file) => file.url).join(", ");
    }
    if (accidentLinks.length) {
      payload.accidentFiles = accidentLinks.map((file) => file.url).join(", ");
    }

    // Immer in der Datenbank speichern (landet sofort)
    try {
      const id = await insertPurchaseInquiry(payload);
      console.log(`✅ Ankauf-Anfrage #${id} gespeichert`);
    } catch (dbError) {
      console.error("Fehler beim Speichern in DB:", dbError);
      return res.status(500).json({
        success: false,
        error: "Fehler beim Speichern der Anfrage",
      });
    }

    // Optional: E-Mail senden, wenn Resend konfiguriert ist
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
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #0f2439 0%, #1e3a5f 100%); padding:28px 32px; text-align:center;">
        <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.02em;">GS Automobile Rheinland</h1>
        <p style="margin:8px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">Neue Ankauf-Anfrage</p>
        <p style="margin:16px 0 0; font-size:12px; color:rgba(255,255,255,0.6);">${escapeHtml(now)}</p>
      </div>

      <!-- Content -->
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
          </tbody>`
        )}

        ${formatSection(
          "Service & HU",
          `
          <tbody>
            ${formatRow("Scheckheft vollständig", payload.serviceBook)}
            ${formatRow("Letzter Service", payload.lastService)}
            ${formatRow("HU fällig", payload.hu)}
          </tbody>`
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
          </tbody>`
        )}

        ${formatSection(
          "Preisvorstellung",
          `
          <tbody>
            <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:180px;">Preisvorstellung</td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#0f2439;font-weight:700;font-size:16px;">${formatPrice(payload.priceExpectation)}</td></tr>
          </tbody>`
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
          </tbody>`
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
          </tbody>`
        )}
      </div>

      <!-- Footer -->
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
        await resend.emails.send({
          from: resendFrom,
          to: resendTo,
          subject: `Ankauf-Anfrage ${payload.make || ""} ${payload.model || ""}`.trim(),
          html,
          text,
        });
        console.log(`📧 E-Mail an ${resendTo} gesendet`);
      } catch (emailError) {
        console.error("E-Mail-Versand fehlgeschlagen (Anfrage ist in DB gespeichert):", emailError);
      }
    } else {
      console.warn("RESEND_API_KEY nicht gesetzt – E-Mail wurde nicht versendet. Anfrage ist in der Datenbank gespeichert.");
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send purchase inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send inquiry",
    });
  }
});
