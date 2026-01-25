import { Router } from "express";
import { Resend } from "resend";

export const purchaseInquiryRouter = Router();

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";
const resendTo = process.env.RESEND_TO || "sebo.ziemianski@web.de";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatRow = (label: string, value?: string | null) => {
  const safeValue = value && value.trim() ? escapeHtml(value) : "-";
  return `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#111827;">${label}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#111827;">${safeValue}</td></tr>`;
};

purchaseInquiryRouter.post("/", async (req, res) => {
  try {
    if (!resendApiKey) {
      return res.status(500).json({
        success: false,
        error: "RESEND_API_KEY missing",
      });
    }

    const payload = req.body || {};
    const resend = new Resend(resendApiKey);

    const html = `
      <div style="font-family:Arial, sans-serif; background:#f9fafb; padding:24px;">
        <div style="max-width:720px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:24px;">
          <h2 style="margin:0 0 16px; color:#111827;">Neue Ankauf-Anfrage</h2>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tbody>
              ${formatRow("Marke", payload.make)}
              ${formatRow("Modell", payload.model)}
              ${formatRow("Erstzulassung", payload.firstRegistration)}
              ${formatRow("Kilometerstand", payload.mileage)}
              ${formatRow("Halteranzahl", payload.ownersCount)}
              ${formatRow("Scheckheft", payload.serviceBook)}
              ${formatRow("Letzter Service", payload.lastService)}
              ${formatRow("HU", payload.hu)}
              ${formatRow("Raucherfahrzeug", payload.smoker)}
              ${formatRow("Unfallfahrzeug", payload.accident)}
              ${formatRow("Unfall behoben", payload.accidentRepaired)}
              ${formatRow("Schadenbeschreibung", payload.accidentDescription)}
              ${formatRow("Schadenshoehe", payload.accidentAmount)}
              ${formatRow("VIN", payload.vin)}
              ${formatRow("Interessensnummer", payload.interestNumber)}
              ${formatRow("Fahrzeug aus Bestand", payload.interestVehicle)}
              ${formatRow("Foto-Dateien", payload.photoFiles)}
              ${formatRow("Gutachten-Dateien", payload.accidentFiles)}
              ${formatRow("Vorname", payload.contactFirstName)}
              ${formatRow("Nachname", payload.contactLastName)}
              ${formatRow("Telefon", payload.contactPhone)}
              ${formatRow("E-Mail", payload.contactEmail)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const text = [
      "Neue Ankauf-Anfrage",
      `Marke: ${payload.make || "-"}`,
      `Modell: ${payload.model || "-"}`,
      `Erstzulassung: ${payload.firstRegistration || "-"}`,
      `Kilometerstand: ${payload.mileage || "-"}`,
      `Halteranzahl: ${payload.ownersCount || "-"}`,
      `Scheckheft: ${payload.serviceBook || "-"}`,
      `Letzter Service: ${payload.lastService || "-"}`,
      `HU: ${payload.hu || "-"}`,
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
    ].join("\n");

    await resend.emails.send({
      from: resendFrom,
      to: resendTo,
      subject: `Ankauf-Anfrage ${payload.make || ""} ${payload.model || ""}`.trim(),
      html,
      text,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send purchase inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send inquiry",
    });
  }
});
