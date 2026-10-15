// Beregner forbrugsoversigten ud fra kørslerne. Ren funktion uden
// database — derfor let at teste. Datoer er lokal tid, så "i dag"
// og budgettets nulstilling følger din egen kalender.

import type { ForbrugsOversigt, Koersel } from "../../../../packages/domain/src/domain/forbrug";
import { koerselsPris, PRISER_TJEKKET } from "./priser";

const MAX_OPGAVER = 10;

/** Lokal dato som "ÅÅÅÅ-MM-DD" */
export function datoNoegle(d: Date): string {
  const to = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${to(d.getMonth() + 1)}-${to(d.getDate())}`;
}

/** Midnat (lokal tid) for dagen, der ligger `dageTilbage` før `nu` */
export function dagensStart(nu: Date, dageTilbage = 0): Date {
  return new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - dageTilbage);
}

export function beregnOversigt(
  koersler: Koersel[],
  valg: { periodeDage: number; nu: Date; dagligtBudgetUsd: number | null }
): ForbrugsOversigt {
  const idag = datoNoegle(valg.nu);
  const dage = new Map<string, { analyseUsd: number; implementeringUsd: number }>();
  for (let i = valg.periodeDage - 1; i >= 0; i--) {
    dage.set(datoNoegle(dagensStart(valg.nu, i)), { analyseUsd: 0, implementeringUsd: 0 });
  }
  const opgaver = new Map<string, { opgaveId: string; titel: string; usd: number }>();
  const agenter = new Map<string, { navn: string; usd: number; koersler: number }>();
  const tokens = { ind: 0, cacheSkriv: 0, cacheLaes: 0, ud: 0 };
  let totalUsd = 0, idagUsd = 0, analyseUsd = 0, implementeringUsd = 0, uprisedeKoersler = 0;

  for (const k of koersler) {
    if (k.forbrug) {
      tokens.ind += k.forbrug.ind;
      tokens.cacheSkriv += k.forbrug.cacheSkriv;
      tokens.cacheLaes += k.forbrug.cacheLaes;
      tokens.ud += k.forbrug.ud;
    }
    const usd = koerselsPris(k);
    if (usd === null) {
      uprisedeKoersler++;
      continue;
    }
    const dato = datoNoegle(new Date(k.tidspunkt));
    totalUsd += usd;
    if (dato === idag) idagUsd += usd;
    if (k.type === "analyse") analyseUsd += usd;
    else implementeringUsd += usd;
    const dag = dage.get(dato);
    if (dag) dag[k.type === "analyse" ? "analyseUsd" : "implementeringUsd"] += usd;
    const o = opgaver.get(k.opgaveId) ?? { opgaveId: k.opgaveId, titel: k.opgaveTitel, usd: 0 };
    o.usd += usd;
    opgaver.set(k.opgaveId, o);
    const a = agenter.get(k.agentNavn) ?? { navn: k.agentNavn, usd: 0, koersler: 0 };
    a.usd += usd;
    a.koersler++;
    agenter.set(k.agentNavn, a);
  }

  const input = tokens.ind + tokens.cacheSkriv + tokens.cacheLaes;
  return {
    periodeDage: valg.periodeDage,
    totalUsd,
    idagUsd,
    dagligtBudgetUsd: valg.dagligtBudgetUsd,
    analyseUsd,
    implementeringUsd,
    prDag: [...dage].map(([dato, v]) => ({ dato, ...v })),
    prOpgave: [...opgaver.values()].sort((a, b) => b.usd - a.usd).slice(0, MAX_OPGAVER),
    prAgent: [...agenter.values()].sort((a, b) => b.usd - a.usd),
    tokens,
    cacheAndel: input > 0 ? tokens.cacheLaes / input : 0,
    uprisedeKoersler,
    priserTjekket: PRISER_TJEKKET,
  };
}
