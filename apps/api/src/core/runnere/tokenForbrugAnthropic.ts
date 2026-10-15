// Tokenbogholderi for én agentkørsel. Samler forbruget på tværs af
// alle kald i værktøjsloopet, så du kan SE effekten af caching i
// stedet for at stole på regnestykker.
//
// Anthropic-specifikt, fordi forbrugsfelterne er det. Formatet ud
// (TokenForbrug) er neutralt og gemmes pr. agentsvar.

import type Anthropic from "@anthropic-ai/sdk";
import type { TokenForbrug } from "../../../../../packages/domain/src/domain/forbrug";

export type { TokenForbrug };

export function nytForbrug(model: string): TokenForbrug {
  return { model, kald: 0, ind: 0, cacheSkriv: 0, cacheLaes: 0, ud: 0 };
}

export function tilfoejForbrug(
  forbrug: TokenForbrug,
  usage: Anthropic.Usage | undefined
): void {
  forbrug.kald++;
  if (!usage) return;
  forbrug.ind += usage.input_tokens ?? 0;
  forbrug.cacheSkriv += usage.cache_creation_input_tokens ?? 0;
  forbrug.cacheLaes += usage.cache_read_input_tokens ?? 0;
  forbrug.ud += usage.output_tokens ?? 0;
}

/** Fx: "3 kald · ind 412 · cache-skriv 5.120 · cache-læs 9.870 (64 % fra cache) · ud 880" */
export function formaterForbrug(forbrug: TokenForbrug): string {
  const totaltInd = forbrug.ind + forbrug.cacheSkriv + forbrug.cacheLaes;
  const cacheAndel =
    totaltInd > 0 ? Math.round((forbrug.cacheLaes / totaltInd) * 100) : 0;
  const tal = (n: number): string => n.toLocaleString("da-DK");
  return [
    `${forbrug.kald} kald`,
    `ind ${tal(forbrug.ind)}`,
    `cache-skriv ${tal(forbrug.cacheSkriv)}`,
    `cache-læs ${tal(forbrug.cacheLaes)} (${cacheAndel} % fra cache)`,
    `ud ${tal(forbrug.ud)}`,
  ].join(" · ");
}
