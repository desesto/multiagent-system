// Starter en midlertidig Vite-server for én udgave af frontenden, så
// den kan fotograferes. Projektets egen vite.config bruges — pakket ind
// i en midlertidig konfiguration, der kun ændrer det nødvendige:
//  - en ledig port på 127.0.0.1 (din egen dev-server på 5173 røres ikke)
//  - en separat cache-mappe, så din egen node_modules/.vite ikke ændres
//  - adgang til repoets node_modules, som worktreet kun har lænket ind
//
// Vite-processen får KUN de miljøvariabler, den skal bruge for at køre —
// aldrig API-nøgler, databaseadgang eller andre hemmeligheder fra .env.

import { spawn, type ChildProcess } from "node:child_process";
import { realpath, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import type { ViteApp } from "./viteApp";

/** Navnet på den midlertidige konfiguration — fjernes altid igen */
export const MIDLERTIDIG_KONFIG = "vite.foer-efter.config.mts";
const START_TIMEOUT_MS = 90_000;

const TILLADT_MILJOE = new Set([
  "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP", "TMPDIR",
  "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "HOMEDRIVE", "HOMEPATH",
  "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE", "OS", "LANG", "LC_ALL",
]);

export interface KoerendeVite {
  url: string;
  stop(): Promise<void>;
}

export interface ViteValg {
  worktree: string;
  repoRod: string;
  app: ViteApp;
  /** Delt mellem før og efter, så afhængighederne kun optimeres én gang */
  cacheMappe: string;
}

export async function startVite(v: ViteValg): Promise<KoerendeVite> {
  const appMappe = path.join(v.worktree, v.app.mappe);
  const konfig = path.join(appMappe, MIDLERTIDIG_KONFIG);
  const port = await ledigPort();
  // Lænkede node_modules kan pege uden for repoet — Vite skal også have lov at læse dér
  const moduler = await realpath(path.join(appMappe, "node_modules")).catch(() => null);
  await writeFile(konfig, indpakning(v, port, moduler));

  const proces = spawn(
    process.execPath,
    [path.join(appMappe, "node_modules", "vite", "bin", "vite.js"), "--config", konfig],
    { cwd: appMappe, env: renMiljoe(), stdio: ["ignore", "pipe", "pipe"], windowsHide: true }
  );
  let log = "";
  const gem = (d: Buffer): void => {
    log = (log + d.toString()).slice(-2000);
  };
  proces.stdout?.on("data", gem);
  proces.stderr?.on("data", gem);

  const stop = async (): Promise<void> => {
    await stopProces(proces);
    await rm(konfig, { force: true });
  };
  const url = `http://127.0.0.1:${port}`;
  try {
    await ventPaaSvar(url, proces, () => log);
  } catch (fejl) {
    await stop();
    throw fejl;
  }
  return { url, stop };
}

function indpakning(v: ViteValg, port: number, moduler: string | null): string {
  const tilfoejelser = {
    cacheDir: v.cacheMappe,
    clearScreen: false,
    logLevel: "warn",
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      open: false,
      fs: { allow: [v.repoRod, v.worktree, ...(moduler ? [moduler] : [])] },
    },
  };
  return [
    `// Midlertidig fil fra multiagent (før/efter-billeder) — slettes automatisk.`,
    `import { mergeConfig } from "vite";`,
    `import grund from "./${v.app.konfigFil}";`,
    `export default async (env) => {`,
    `  const g = typeof grund === "function" ? await grund(env) : await grund;`,
    `  return mergeConfig(g ?? {}, ${JSON.stringify(tilfoejelser)});`,
    `};`,
    ``,
  ].join("\n");
}

function renMiljoe(): NodeJS.ProcessEnv {
  const miljoe: NodeJS.ProcessEnv = { BROWSER: "none" };
  for (const [noegle, vaerdi] of Object.entries(process.env)) {
    if (TILLADT_MILJOE.has(noegle.toUpperCase())) miljoe[noegle] = vaerdi;
  }
  return miljoe;
}

function ledigPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const adresse = server.address();
      const port = typeof adresse === "object" && adresse ? adresse.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function ventPaaSvar(url: string, proces: ChildProcess, log: () => string): Promise<void> {
  const frist = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < frist) {
    if (proces.exitCode !== null || proces.signalCode !== null) {
      throw new Error(`Vite stoppede under opstart: ${log().trim().slice(-500) || `kode ${proces.exitCode}`}`);
    }
    const svar = await fetch(url).catch(() => null);
    if (svar?.ok) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Vite svarede ikke inden for ${START_TIMEOUT_MS / 1000} sek.`);
}

/** På Windows skal hele procestræet stoppes (Vite starter esbuild som underproces) */
async function stopProces(proces: ChildProcess): Promise<void> {
  if (proces.exitCode !== null || proces.signalCode !== null || !proces.pid) return;
  const lukket = new Promise<void>((r) => proces.once("exit", () => r()));
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(proces.pid), "/T", "/F"], { windowsHide: true });
  } else {
    proces.kill("SIGTERM");
  }
  await Promise.race([lukket, new Promise((r) => setTimeout(r, 5000))]);
}
