import { existsSync } from "node:fs";

/**
 * Holt die Exposé-reportId von der Händler-Detailseite per Headless-Browser,
 * da die URL per JavaScript nachgeladen wird und nicht im ersten HTML steht.
 *
 * Chrome für Puppeteer: einmalig ausführen: npx puppeteer browsers install chrome
 * Oder system Chrome nutzen (macOS): PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
 */

const UUID_PATTERN = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const REPORTING_PATTERN = new RegExp(`reportId=(${UUID_PATTERN})`, "i");
const DEFAULT_DETAIL_BASE = "https://fahrzeuge.gs-automobile-rheinland.de";

function getDetailBase(): string {
  const base = process.env.CARGATE_EXPOSE_BASE_URL?.trim();
  return (base || DEFAULT_DETAIL_BASE).replace(/\/+$/, "");
}

/** Sucht in einem String nach reportId (UUID); mehrere Schreibweisen. */
function extractReportIdFromText(text: string): string | null {
  if (!text || typeof text !== "string") return null;
  const patterns = [
    new RegExp(`reportId=(${UUID_PATTERN})`, "i"),
    new RegExp(`["']reportId["']\\s*:\\s*["'](${UUID_PATTERN})["']`, "i"),
    new RegExp(`["']reportGuid["']\\s*:\\s*["'](${UUID_PATTERN})["']`, "i"),
    new RegExp(`DownloadReport\\?[^"'\s<>]*reportId=(${UUID_PATTERN})`, "i"),
    new RegExp(`reporting\\.cargate360\\.de[^"'\s]*?reportId=(${UUID_PATTERN})`, "i"),
    new RegExp(`InspectionReport["']?\\s*:\\s*\\{[^}]*?["']reportId["']\\s*:\\s*["'](${UUID_PATTERN})`, "i"),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

let chromeNotFoundLogged = false;
let exposeDebugLogged = false;

function getLaunchOptions(): { headless: true; args: string[]; executablePath?: string } {
  const args = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (envPath) return { headless: true, args, executablePath: envPath };
  if (process.platform === "darwin") {
    const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (existsSync(systemChrome)) return { headless: true, args, executablePath: systemChrome };
  }
  return { headless: true, args };
}

export async function fetchReportIdWithBrowser(vehicleId: string): Promise<string | null> {
  const vid = String(vehicleId || "").trim();
  if (!vid) return null;

  const url = `${getDetailBase()}/Fahrzeugsuche/Details?vid=${encodeURIComponent(vid)}`;
  let browser: Awaited<ReturnType<typeof import("puppeteer").launch>> | null = null;

  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch(getLaunchOptions());
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const reportIdsFromNetwork = new Set<string>();
    page.on("response", async (response) => {
      try {
        const resUrl = response.url();
        const headers = response.headers();
        const ct = (headers["content-type"] || "").toLowerCase();
        const isJson = ct.includes("json") || ct.includes("javascript") || /\.(js|json)$/i.test(resUrl);
        if (!isJson && !ct.includes("text/html") && !ct.includes("text/plain")) return;
        const body = await response.text();
        if (body.length > 500_000) return;
        const id = extractReportIdFromText(body);
        if (id) reportIdsFromNetwork.add(id);
      } catch {
        // ignore
      }
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 5000));

    let reportId: string | null = Array.from(reportIdsFromNetwork)[0] || null;
    if (!reportId) {
      reportId = await page.evaluate((uuidRe) => {
        const re = new RegExp(uuidRe, "i");
        const links = document.querySelectorAll('a[href*="reporting.cargate360.de"], a[href*="reportId="]');
        for (const a of links) {
          const href = (a as HTMLAnchorElement).href || "";
          const m = href.match(re);
          if (m && m[1]) return m[1];
        }
        const html = document.documentElement.outerHTML;
        const match = html.match(re);
        if (match && match[1]) return match[1];
        const scripts = document.querySelectorAll("script:not([src])");
        for (const s of scripts) {
          const m = (s.textContent || "").match(re);
          if (m && m[1]) return m[1];
        }
        return null;
      }, `reportId=(${UUID_PATTERN})`);
    }

    if (!reportId) {
      const html = await page.content();
      reportId = extractReportIdFromText(html);
    }

    if (reportId && REPORTING_PATTERN.test(`reportId=${reportId}`)) {
      return reportId;
    }

    if (process.env.CARGATE_DEBUG_EXPOSE === "1" && !exposeDebugLogged) {
      exposeDebugLogged = true;
      const html = await page.content();
      const finalUrl = page.url();
      const title = await page.title();
      const hasCargate = html.includes("cargate360");
      const hasReportId = /reportId/i.test(html);
      const hasDownloadReport = html.includes("DownloadReport");
      const hasExpose = /expos[eé]/i.test(html);
      console.warn(
        `[Exposé] Debug (einmalig) vid=${vid}: title="${(title || "").slice(0, 60)}" url=${finalUrl.slice(0, 80)}...`
      );
      console.warn(
        `[Exposé] Debug HTML: cargate360=${hasCargate} reportId=${hasReportId} DownloadReport=${hasDownloadReport} Exposé=${hasExpose} networkIds=${reportIdsFromNetwork.size}`
      );
    }
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isChromeMissing = /Could not find Chrome|Chrome not found|executable doesn't exist/i.test(msg);
    if (isChromeMissing && !chromeNotFoundLogged) {
      chromeNotFoundLogged = true;
      console.warn(
        "[Exposé] Puppeteer: Chrome nicht gefunden. Einmalig ausführen: npx puppeteer browsers install chrome"
      );
    } else if (process.env.CARGATE_DEBUG_EXPOSE === "1" && !isChromeMissing) {
      console.warn(`[Exposé] Browser-Fetch vid=${vid} fehlgeschlagen:`, msg);
    }
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
