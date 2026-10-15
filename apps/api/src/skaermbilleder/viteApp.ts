// Hvilken frontend skal fotograferes — og er det sikkert at starte den?
//
// SIKKERHED: For at tage efter-billeder startes AGENTENS udgave af
// frontenden med Vite. Selve app-koden kører i browseren (spærret inde,
// se browserFotograf.ts), men Vite kører konfigurationsfiler (vite.config,
// postcss.config, package.json-felter o.l.) direkte i Node på din maskine.
// Har agenten ændret en sådan fil, springes efter-billederne over, indtil
// du selv har gennemset og flettet koden.

import { access } from "node:fs/promises";
import path from "node:path";
import type { AendretFil } from "../../../../packages/domain/src/domain/implementering";
import { kandidatMapper } from "../vaerktoejer/monorepoMapper";

const VITE_KONFIG = ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"];

/** App-koden her når kun browseren — ændringer her er altid i orden */
const SIKRE_STEDER = ["src/", "public/"];

/**
 * Filer, Vite (eller dens plugins) kan finde på at køre eller lade sig
 * styre af, når de ligger i app-mappen eller over den: JS/TS-filer
 * (vite.config, postcss.config …), JSON (package.json …) og skjulte
 * filer (.postcssrc, .babelrc …). README'er, billeder o.l. er harmløse.
 */
const KOERBAR = /^(\..*|.*\.[cm]?[jt]sx?|.*\.json)$/;

export interface ViteApp {
  /** Mappen relativt til repoets rod, med / ("." = roden) */
  mappe: string;
  konfigFil: string;
}

async function findes(sti: string): Promise<boolean> {
  return access(sti).then(() => true, () => false);
}

const medSkraastreg = (sti: string): string => sti.split(path.sep).join("/");

/**
 * Finder Vite-appen i worktreet: en mappe med en vite.config og en
 * installeret vite. Er der flere, vælges den, agenten har ændret mest i.
 * Kræver, at node_modules allerede er lænket ind (laenkNodeModules).
 */
export async function findViteApp(worktree: string, filer: AendretFil[]): Promise<ViteApp | null> {
  const fundne: ViteApp[] = [];
  for (const mappe of await kandidatMapper(worktree)) {
    const fuld = path.join(worktree, mappe);
    if (!(await findes(path.join(fuld, "node_modules", "vite", "bin", "vite.js")))) continue;
    for (const konfigFil of VITE_KONFIG) {
      if (await findes(path.join(fuld, konfigFil))) {
        fundne.push({ mappe: medSkraastreg(mappe), konfigFil });
        break;
      }
    }
  }
  const antalIMappe = (app: ViteApp): number =>
    filer.filter((f) => app.mappe === "." || f.sti.startsWith(`${app.mappe}/`)).length;
  return fundne.sort((a, b) => antalIMappe(b) - antalIMappe(a))[0] ?? null;
}

/**
 * Den første ændrede fil, som Vite ville køre i Node — eller null, hvis
 * alle ændringer kun når browseren. Filer i andre grene af repoet (fx
 * apps/api) køres ikke af Vite; filer i app-mappen uden for src/ og
 * public/, og filer i mapperne OVER appen (fx en postcss.config i roden), gør.
 */
export function usikkerAendring(app: ViteApp, filer: AendretFil[]): string | null {
  const prefiks = app.mappe === "." ? "" : `${app.mappe}/`;
  for (const { sti } of filer) {
    if (!KOERBAR.test(path.posix.basename(sti))) continue;
    if (sti.startsWith(prefiks)) {
      const iApp = sti.slice(prefiks.length);
      if (!SIKRE_STEDER.some((s) => iApp.startsWith(s))) return sti;
      continue;
    }
    const mappe = path.posix.dirname(sti);
    const erOverAppen = mappe === "." || prefiks.startsWith(`${mappe}/`);
    if (erOverAppen) return sti;
  }
  return null;
}
