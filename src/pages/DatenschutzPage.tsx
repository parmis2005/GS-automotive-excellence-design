import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Shield, Server, Cookie, Mail, ExternalLink, FileText } from "lucide-react";

const DatenschutzPage = () => {
  const seoData = {
    title: "Datenschutzerklärung | GS Automobile Rheinland",
    description:
      "Datenschutzerklärung der GS Automobile Rheinland GmbH – Informationen zur Verarbeitung personenbezogener Daten auf dieser Website.",
    url: "https://gsauto.de/datenschutz",
  };

  const standDate = new Date().toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO data={seoData} />
      <Navbar />
      <main className="container mx-auto px-6 py-10 md:py-14 max-w-4xl">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Zur Startseite
          </Link>
        </div>

        <header className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Datenschutzerklärung
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Stand: {standDate}</p>
        </header>

        <div className="grid gap-6 md:gap-8">
          {/* 1. Datenschutz auf einen Blick */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="ueberblick-heading"
          >
            <h2
              id="ueberblick-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4"
            >
              <Shield className="h-5 w-5 text-primary" aria-hidden />
              1. Datenschutz auf einen Blick
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Die folgenden Hinweise geben einen Überblick darüber, was mit Ihren personenbezogenen
                Daten auf dieser Website passiert. Personenbezogene Daten sind alle Daten, mit denen
                Sie persönlich identifiziert werden können.
              </p>
              <p>
                <strong className="text-foreground">Verantwortlich</strong> für die Datenverarbeitung
                ist die unten unter „Verantwortliche Stelle“ genannte Gesellschaft. Ihre Daten werden
                zum einen durch Ihre Angaben (z. B. im Kaufanfrage- oder Kontaktformular) erhoben,
                zum anderen automatisch durch unseren Hosting-Anbieter beim Besuch der Website
                (z. B. IP-Adresse, Browsertyp, Zugriffszeit). Wir nutzen Ihre Daten zur
                Bereitstellung der Website, zur Bearbeitung von Anfragen und – sofern Sie
                einwilligen – für angegebene weitere Zwecke. Sie haben jederzeit Rechte auf
                Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Beschwerde bei
                einer Aufsichtsbehörde.
              </p>
            </div>
          </section>

          {/* 2. Verantwortliche Stelle */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="verantwortlich-heading"
          >
            <h2
              id="verantwortlich-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4"
            >
              <FileText className="h-5 w-5 text-primary" aria-hidden />
              2. Verantwortliche Stelle
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            </p>
            <p className="text-foreground font-medium">
              GS Automobile Rheinland GmbH
              <br />
              Kuhleshütte 149 · 47809 Krefeld
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Telefon:{" "}
              <a href="tel:+4921519422262" className="text-primary hover:underline">
                +49 (0)2151 9422262
              </a>
              <br />
              E-Mail:{" "}
              <a href="mailto:info@gsauto.de" className="text-primary hover:underline">
                info@gsauto.de
              </a>
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
              gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen
              Daten entscheidet.
            </p>
          </section>

          {/* 3. Hosting */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="hosting-heading"
          >
            <h2
              id="hosting-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4"
            >
              <Server className="h-5 w-5 text-primary" aria-hidden />
              3. Hosting
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Diese Website wird gehostet bzw. betrieben durch:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Frontend (Webseiten) und Web Analytics:</strong>{" "}
                Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Beim Aufruf unserer
                Website können bei Vercel Logdaten (u. a. IP-Adresse, Browsertyp, Zugriffszeit)
                anfallen. Zusätzlich nutzen wir Vercel Web Analytics zur Erfassung von
                Nutzungsstatistiken (z. B. Seitenaufrufe); dabei werden keine Cookies gesetzt, die
                Auswertung erfolgt in anonymisierter Form.{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Datenschutz Vercel
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <strong className="text-foreground">Backend (API, Formulare, E-Mail-Versand):</strong>{" "}
                DigitalOcean, LLC, 101 6th Ave, New York, NY 10013, USA (Droplet-Hosting). Anfragen an
                unsere API (z. B. Fahrzeugdaten, Kaufanfragen) werden auf unserem DigitalOcean-Server
                verarbeitet; dabei können Logdaten anfallen.{" "}
                <a
                  href="https://www.digitalocean.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Datenschutz DigitalOcean
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <strong className="text-foreground">Datenbank:</strong> Neon (Neon Technologies Inc. /
                EU-Region). Speicherung von Kaufanfragen und technischen Daten; Auftragsverarbeitung
                im Einklang mit DSGVO.{" "}
                <a
                  href="https://neon.tech/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Datenschutz Neon
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Die Nutzung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an einer zuverlässigen Darstellung und dem Betrieb der Website). Soweit eine
              Einwilligung eingeholt wird, erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs. 1
              lit. a DSGVO und § 25 Abs. 1 TDDDG; die Einwilligung ist jederzeit widerrufbar. Mit
              den Anbietern bestehen Verträge über Auftragsverarbeitung (AVV) bzw. es werden
              Standardvertragsklauseln der EU-Kommission für Datenübermittlungen in Drittländer
              genutzt, soweit die Anbieter in den USA tätig sind.
            </p>
          </section>

          {/* 4. Allgemeine Hinweise und Rechte */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="allgemein-heading"
          >
            <h2 id="allgemein-heading" className="text-lg font-semibold text-foreground mb-4">
              4. Allgemeine Hinweise und Ihre Rechte
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Datenschutz</p>
                <p>
                  Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den
                  gesetzlichen Vorschriften (DSGVO, BDSG, TDDDG). Die Datenübertragung im Internet
                  kann Sicherheitslücken aufweisen; ein lückenloser Schutz vor Zugriff durch Dritte
                  ist nicht möglich.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Speicherdauer</p>
                <p>
                  Ihre Daten verbleiben bei uns, bis der Zweck entfällt oder Sie Löschung bzw.
                  Widerruf der Einwilligung verlangen. Gesetzliche Aufbewahrungsfristen (z. B. steuer-
                  oder handelsrechtlich) bleiben unberührt.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Rechtsgrundlagen</p>
                <p>
                  Wir verarbeiten Daten auf Grundlage von Einwilligung (Art. 6 Abs. 1 lit. a DSGVO),
                  Vertragserfüllung bzw. vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO),
                  rechtlicher Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO) oder berechtigtem Interesse
                  (Art. 6 Abs. 1 lit. f DSGVO). Bei Cookies bzw. Zugriff auf Endgerät kann § 25 Abs.
                  1 TDDDG einschlägig sein.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Empfänger von personenbezogenen Daten</p>
                <p>
                  Wir geben personenbezogene Daten nur weiter, wenn dies zur Vertragserfüllung
                  nötig ist, wir gesetzlich verpflichtet sind, wir ein berechtigtes Interesse
                  haben (Art. 6 Abs. 1 lit. f DSGVO) oder eine sonstige Rechtsgrundlage die Weitergabe
                  erlaubt. Beim Einsatz von Auftragsverarbeitern (z. B. Hosting, Datenbank, E-Mail-Dienst)
                  erfolgt die Weitergabe nur auf Grundlage eines Vertrags über Auftragsverarbeitung (AVV).
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Widerruf Ihrer Einwilligung</p>
                <p>
                  Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung
                  möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die
                  Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt davon
                  unberührt.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Ihre Rechte</p>
                <p>Sie haben gegenüber uns u. a. folgende Rechte:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
                  <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                  <li>Löschung (Art. 17 DSGVO)</li>
                  <li>
                    Einschränkung der Verarbeitung (Art. 18 DSGVO) – u. a. wenn Sie die Richtigkeit
                    bestreiten (für die Dauer der Prüfung), die Verarbeitung unrechtmäßig war, Sie
                    die Daten zur Geltendmachung von Rechtsansprüchen benötigen oder Sie Widerspruch
                    eingelegt haben und die Abwägung noch aussteht
                  </li>
                  <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                  <li>Widerruf einer Einwilligung (jederzeit)</li>
                  <li>Widerspruch gegen Verarbeitung aus Art. 6 Abs. 1 lit. e oder f DSGVO (Art. 21
                    DSGVO), insbesondere gegen Direktwerbung
                  </li>
                  <li>Beschwerde bei einer Aufsichtsbehörde (z. B. in Ihrem Mitgliedstaat)</li>
                </ul>
                <p className="mt-2">
                  Zuständige Aufsichtsbehörde für uns: Landesbeauftragte für Datenschutz und
                  Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Kavalleriestraße 2–4, 40213
                  Düsseldorf,{" "}
                  <a
                    href="https://www.ldi.nrw.de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    www.ldi.nrw.de
                  </a>
                  .
                </p>
                <p className="mt-2">
                  Hierzu sowie zu weiteren Fragen können Sie sich an die unter Abschnitt 2 genannte
                  verantwortliche Stelle wenden.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Automatisierte Entscheidungsfindung / Profiling</p>
                <p>
                  Wir setzen keine automatisierten Entscheidungsfindungen im Sinne von Art. 22 DSGVO
                  ein und erstellen keine Nutzerprofile zu Werbezwecken.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Datenübermittlung in Drittländer</p>
                <p>
                  Soweit Daten in Länder außerhalb des Europäischen Wirtschaftsraums (EWR)
                  übermittelt werden (z. B. USA bei Vercel, DigitalOcean, Resend), erfolgt dies nur unter
                  geeigneten Garantien (z. B. Standardvertragsklauseln der EU-Kommission) oder auf
                  Grundlage einer Einwilligung. Sie können bei der verantwortlichen Stelle Auskunft
                  zu den konkreten Garantien verlangen.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">SSL-/TLS-Verschlüsselung</p>
                <p>
                  Diese Seite nutzt eine verschlüsselte Übertragung (HTTPS). Eine verschlüsselte
                  Verbindung erkennen Sie an „https://“ und dem Schloss-Symbol in der Browserzeile.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Widerspruch gegen Werbe-E-Mails</p>
                <p>
                  Die Nutzung von im Impressum veröffentlichten Kontaktdaten zur Übersendung von
                  nicht ausdrücklich angeforderter Werbung wird hiermit widersprochen. Wir behalten
                  uns rechtliche Schritte bei unverlangter Zusendung von Werbung (z. B. Spam-E-Mails)
                  vor.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Datenerfassung im Einzelnen */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
            aria-labelledby="erfassung-heading"
          >
            <h2
              id="erfassung-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4"
            >
              <Cookie className="h-5 w-5 text-primary" aria-hidden />
              5. Datenerfassung auf dieser Website
            </h2>
            <div className="space-y-5 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Server-Log-Dateien</p>
                <p>
                  Der Betreiber (Vercel/DigitalOcean) erhebt automatisch Informationen, die Ihr Browser
                  übermittelt: Browsertyp, Browserversion, Betriebssystem, Referrer-URL, Hostname,
                  Uhrzeit der Anfrage, IP-Adresse. Eine Zusammenführung mit anderen Datenquellen
                  erfolgt nicht. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
                  an fehlerfreier Darstellung und Optimierung).
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Cookies</p>
                <p>
                  Diese Website setzt nur technisch notwendige bzw. für die Grundfunktion
                  erforderliche Speicherungen (z. B. Session oder Einstellungen). Es werden keine
                  Tracking- oder Marketing-Cookies ohne Ihre Einwilligung gesetzt. Sie können Ihren
                  Browser so einstellen, dass Sie über Cookies informiert werden oder diese
                  einschränken; die Funktionalität der Website kann dann eingeschränkt sein.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Besucherstatistik (anonym)</p>
                <p>
                  Zur Anzeige „X Besucher gerade online“ im Footer speichern wir eine zufällige, im
                  Browser erzeugte Kennung (Session-ID) und den Zeitpunkt der letzten Aktivität. Es
                  werden keine IP-Adressen oder sonstigen personenbezogenen Daten verarbeitet. Die
                  Daten werden nach ca. 5 Minuten Inaktivität automatisch gelöscht. Rechtsgrundlage:
                  Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Transparenz für Nutzer). Die
                  Speicherung erfolgt in unserer Datenbank (Neon).
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Kaufanfrage- und Kontaktformulare</p>
                <p>
                  Wenn Sie uns über das Kaufanfrage- oder ein Kontaktformular Anfragen zukommen
                  lassen, werden Ihre Angaben (Name, Kontaktdaten, Inhalt der Anfrage) zum Zwecke
                  der Bearbeitung und für Anschlussfragen gespeichert. Die Verarbeitung erfolgt auf
                  Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) bzw. Art. 6 Abs. 1
                  lit. f DSGVO (berechtigtes Interesse an der Bearbeitung von Anfragen). Die Daten
                  werden nicht ohne Ihre Einwilligung an Dritte weitergegeben.
                </p>
                <p className="mt-2">
                  Zur Speicherung nutzen wir den Datenbankanbieter <strong className="text-foreground">Neon</strong>{" "}
                  (Auftragsverarbeiter, Speicherung in der EU). Zum E-Mail-Versand kann der Dienst{" "}
                  <strong className="text-foreground">Resend</strong>{" "}
                  (Resend Inc., USA) eingesetzt werden. Dabei können Ihre in der Anfrage genannten
                  Daten (z. B. Name, E-Mail, Telefon, Nachricht) an Resend übermittelt werden. Es
                  gelten Standardvertragsklauseln der EU-Kommission; weitere Informationen:{" "}
                  <a
                    href="https://resend.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Datenschutz Resend
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  . Die Daten verbleiben bei uns bzw. beim Auftragsverarbeiter, bis Sie zur Löschung
                  auffordern, Ihre Einwilligung widerrufen oder der Zweck entfällt; gesetzliche
                  Aufbewahrungsfristen bleiben unberührt.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Anfrage per E-Mail, Telefon oder Telefax</p>
                <p>
                  Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, werden Ihre Angaben
                  zur Bearbeitung Ihres Anliegens gespeichert und verarbeitet. Rechtsgrundlage: Art.
                  6 Abs. 1 lit. b oder f DSGVO. Eine Weitergabe an Dritte erfolgt nicht ohne Ihre
                  Einwilligung.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Fahrzeugbilder (externe Dienste)</p>
                <p>
                  Fahrzeugfotos werden von externen Diensten (z. B. CarGate/Carzilla) eingebunden.
                  Beim Aufruf der Seite lädt Ihr Browser diese Bilder direkt von den Servern der
                  Anbieter; dabei können deren Server Ihre IP-Adresse, Browsertyp und Zugriffszeit
                  erfassen. Wir haben keinen Einfluss auf die Datenverarbeitung durch diese
                  Drittanbieter. Die Einbindung dient der Darstellung unseres Fahrzeugangebots
                  (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO).
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Links zu Google Maps</p>
                <p>
                  Auf dieser Website werden Links zu Google Maps angeboten (z. B. zur Anzeige unseres
                  Standorts). Beim Klick auf den Link verlassen Sie unsere Website; Google kann dann
                  Daten erheben. Wir haben keinen Einfluss auf die Datenverarbeitung durch Google.
                  Nutzung der Links erfolgt in Ihrer Verantwortung.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Social-Media-Auftritte</p>
                <p>
                  Wir unterhalten ggf. Profile in sozialen Netzwerken (z. B. Facebook). Wenn Sie
                  diese Profile besuchen, gelten die Datenschutzbestimmungen der jeweiligen Anbieter.
                  Wir haben nur begrenzten Einfluss auf die dort stattfindende Datenverarbeitung.
                  Ihre Rechte (Auskunft, Widerspruch, Beschwerde usw.) können Sie uns gegenüber und
                  gegenüber dem jeweiligen Netzwerkbetreiber geltend machen.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DatenschutzPage;
