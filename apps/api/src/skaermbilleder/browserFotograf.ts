// Fotograferer sider i en browser uden skærm (playwright-core). Bruger
// den Edge eller Chrome, der allerede er installeret — ingen ekstra
// browser skal hentes.
//
// SIKKERHED: Siderne kan være skrevet af en agent. Browseren må derfor
// KUN hente filer fra den midlertidige Vite-server og LÆSE (GET) fra
// systemets eget API. Alt andet — andre domæner, andre lokale porte og
// alle ændrende kald (POST/PATCH/DELETE) — afvises, så en side hverken
// kan sende data ud af huset eller ændre noget i databasen.

import { chromium, errors, type Browser, type Page, type Route } from "playwright-core";

const VINDUE = { width: 1280, height: 800 };
/** Meget lange sider skæres af her, så billederne ikke bliver enorme */
const MAX_HOEJDE = 4000;
const SIDE_TIMEOUT_MS = 20_000;

export interface Foto {
  rute: string;
  png: Buffer;
  bredde: number;
  hoejde: number;
}

export interface FotoResultat {
  fotos: Foto[];
  /** Afviste kald som "METODE vært", uden gentagelser — vises for gennemsigtighed */
  blokeret: string[];
}

export async function aabnBrowser(): Promise<Browser> {
  // En død proxy for alt undtagen denne maskine (Chromium går altid udenom
  // proxyen for localhost): selv kald, der ikke kan opfanges (fx WebSockets),
  // kommer ikke ud af huset. Sat som argument, fordi Playwrights egen
  // proxy-indstilling også sender localhost gennem proxyen.
  const faelles = { headless: true, args: ["--proxy-server=http://127.0.0.1:9"] };
  const sti = process.env.SKAERMBILLEDE_BROWSER;
  if (sti) return chromium.launch({ ...faelles, executablePath: sti });
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ ...faelles, channel });
    } catch {
      // prøv den næste
    }
  }
  throw new Error(
    "Fandt hverken Microsoft Edge eller Google Chrome. Installér en af dem, eller sæt " +
      "SKAERMBILLEDE_BROWSER i apps\\api\\.env til stien til en Chromium-baseret browser."
  );
}

export async function fotograferSider(
  browser: Browser,
  viteUrl: string,
  apiPort: number,
  ruter: string[]
): Promise<FotoResultat> {
  const kontekst = await browser.newContext({ viewport: VINDUE, colorScheme: "dark", serviceWorkers: "block" });
  const blokeret = new Set<string>();
  await kontekst.route("**/*", async (route) => {
    if (!(await haandterKald(route, viteUrl, apiPort))) {
      blokeret.add(`${route.request().method()} ${new URL(route.request().url()).host}`);
    }
  });
  try {
    // Første besøg varmer Vite op (afhængigheder optimeres) og tælles ikke med
    const opvarmning = await kontekst.newPage();
    await besoeg(opvarmning, `${viteUrl}${ruter[0]}`);
    await opvarmning.close();

    const fotos: Foto[] = [];
    for (const rute of ruter) {
      const side = await kontekst.newPage();
      await besoeg(side, `${viteUrl}${rute}`);
      const fuldHoejde = await side.evaluate(() => document.documentElement.scrollHeight);
      const hoejde = Math.min(Math.max(fuldHoejde, VINDUE.height), MAX_HOEJDE);
      const png = await side.screenshot({
        fullPage: true,
        animations: "disabled",
        clip: { x: 0, y: 0, width: VINDUE.width, height: hoejde },
      });
      fotos.push({ rute, png, bredde: VINDUE.width, hoejde });
      await side.close();
    }
    return { fotos, blokeret: [...blokeret] };
  } finally {
    await kontekst.close();
  }
}

/**
 * Siden er "færdig", når netværket er stille. Bliver den aldrig helt
 * stille (fx løbende opdateringer), fotograferes den efter fristen.
 * Kan siden slet ikke åbnes, er det en fejl — ellers fik man et
 * billede af browserens fejlside.
 */
async function besoeg(side: Page, url: string): Promise<void> {
  try {
    const svar = await side.goto(url, { waitUntil: "networkidle", timeout: SIDE_TIMEOUT_MS });
    if (svar && !svar.ok()) throw new Error(`${url} svarede ${svar.status()}`);
  } catch (fejl) {
    if (!(fejl instanceof errors.TimeoutError)) {
      throw new Error(`Kunne ikke åbne ${url}: ${(fejl as Error).message.split("\n")[0]}`);
    }
  }
  await side.waitForTimeout(400); // lad animationer og skrifttyper falde på plads
}

/** true = kaldet blev tilladt */
async function haandterKald(route: Route, viteUrl: string, apiPort: number): Promise<boolean> {
  const kald = route.request();
  const url = new URL(kald.url());
  if (url.origin === viteUrl) {
    await route.continue();
    return true;
  }
  const erEgetApi =
    (url.hostname === "localhost" || url.hostname === "127.0.0.1") && Number(url.port) === apiPort;
  if (!erEgetApi) {
    await route.abort("blockedbyclient");
    return false;
  }
  const cors = {
    "access-control-allow-origin": viteUrl,
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET",
  };
  if (kald.method() === "OPTIONS") {
    await route.fulfill({ status: 204, headers: cors });
    return true;
  }
  if (kald.method() !== "GET") {
    await route.abort("blockedbyclient");
    return false;
  }
  // Hentes af Node og sendes videre med CORS-tilladelse til den midlertidige port
  const svar = await route.fetch();
  await route.fulfill({ response: svar, headers: { ...svar.headers(), ...cors } });
  return true;
}
