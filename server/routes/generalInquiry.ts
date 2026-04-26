import { Router } from "express";
import { Resend } from "resend";

export const generalInquiryRouter = Router();

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resendFrom = process.env.RESEND_FROM_GENERAL?.trim() || "noreply@gsauto.de";
const resendTo = process.env.RESEND_TO?.trim() || "info@gsauto.de";

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
  return `<tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:180px;">${label}</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111827;">${safeValue}</td></tr>`;
};

generalInquiryRouter.post("/", async (req, res) => {
  try {
    const payload = req.body || {};
    const type = (payload.type || "Allgemeine Anfrage").toString();
    const now = new Date().toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" });

    if (!resendApiKey) {
      return res.status(500).json({ success: false, error: "Resend nicht konfiguriert" });
    }

    const resend = new Resend(resendApiKey);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Anfrage</title>
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f3f4f6;">
  <div style="max-width:680px; margin:0 auto; padding:28px 16px;">
    <div style="background:#ffffff; border-radius:16px; box-shadow:0 4px 6px rgba(0,0,0,0.05); overflow:hidden;">
      <div style="background:linear-gradient(135deg, #0f2439 0%, #1e3a5f 100%); padding:24px 28px; text-align:center;">
        <h1 style="margin:0; font-size:20px; font-weight:700; color:#ffffff;">GS Automobile Rheinland</h1>
        <p style="margin:8px 0 0; font-size:13px; color:rgba(255,255,255,0.85);">Neue Anfrage – ${escapeHtml(type)}</p>
        <p style="margin:14px 0 0; font-size:12px; color:rgba(255,255,255,0.6);">${escapeHtml(now)}</p>
      </div>
      <div style="padding:28px;">
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          ${formatRow("Anfrage-Typ", type)}
          ${formatRow("Vorname", payload.firstName)}
          ${formatRow("Nachname", payload.lastName)}
          ${formatRow("Firma", payload.company)}
          ${formatRow("E-Mail", payload.email)}
          ${formatRow("Telefon", payload.phone)}
          ${formatRow("Betreff", payload.subject)}
          ${formatRow("Fahrzeug", payload.vehicle)}
          ${formatRow("Seite", payload.page)}
          ${formatRow("Nachricht", payload.message)}
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: resendFrom,
      to: resendTo,
      replyTo: payload.email ? String(payload.email) : undefined,
      subject: `Neue Anfrage – ${type}`,
      html,
      text: [
        `Neue Anfrage – ${type}`,
        `Vorname: ${payload.firstName || "-"}`,
        `Nachname: ${payload.lastName || "-"}`,
        `Firma: ${payload.company || "-"}`,
        `E-Mail: ${payload.email || "-"}`,
        `Telefon: ${payload.phone || "-"}`,
        `Betreff: ${payload.subject || "-"}`,
        `Fahrzeug: ${payload.vehicle || "-"}`,
        `Seite: ${payload.page || "-"}`,
        `Nachricht: ${payload.message || "-"}`,
      ].join("\n"),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send inquiry:", error);
    res.status(500).json({ success: false, error: "Failed to send inquiry" });
  }
});
