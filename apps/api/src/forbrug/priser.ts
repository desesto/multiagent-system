// Pristabel pr. model i USD pr. million tokens. ÉT sted, så alle kørsler
// prissættes ens — også gamle analyser, der kun har tokental.
// Opdatér, når Anthropic ændrer priser (se PRISER_TJEKKET).

import type { Koersel, ModelPris, TokenForbrug } from "../../../../packages/domain/src/domain/forbrug";

export const PRISER_TJEKKET = "oktober 2026";

const PRISER: Record<string, ModelPris> = {
  "claude-sonnet-4-6": { input: 3, cacheSkriv: 3.75, cacheLaes: 0.3, output: 15 },
};

/** Finder prisen — også for modelnavne med datoendelse, fx "claude-sonnet-4-6-20260101" */
function prisTil(model: string): ModelPris | null {
  const noegle = Object.keys(PRISER).find((m) => model === m || model.startsWith(`${m}-`));
  return noegle ? PRISER[noegle] : null;
}

/** Pris for et forbrug, eller null hvis modellen ikke er i tabellen */
export function prisFor(f: TokenForbrug): number | null {
  const modeller = f.model.split(",").map((m) => m.trim()).filter(Boolean);
  // Flere modeller i én kørsel: tokens er lagt sammen og kan ikke fordeles
  if (modeller.length !== 1) return null;
  const p = prisTil(modeller[0]);
  if (!p) return null;
  return (f.ind * p.input + f.cacheSkriv * p.cacheSkriv + f.cacheLaes * p.cacheLaes + f.ud * p.output) / 1_000_000;
}

/** Udbyderens eget estimat vinder; ellers beregnes prisen ud fra tokens */
export function koerselsPris(k: Koersel): number | null {
  return k.prisUsd ?? (k.forbrug ? prisFor(k.forbrug) : null);
}
