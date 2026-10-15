// Visning af forbrug og pris — rådata ligger i databasen, her formateres kun.

import type { TokenForbrug } from "../../../../packages/domain/src/domain/forbrug";
import { formaterKroner } from "../../../../packages/domain/src/domain/valuta";

export function formaterPris(usd: number | null): string | null {
  if (usd === null) return null;
  // Meget små beløb skal ikke ligne gratis
  if (usd > 0 && usd < 0.01) return "< 0,01 USD";
  return `${usd.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

export function formaterForbrug(f: TokenForbrug | null): string | null {
  if (!f) return null;
  const total = f.ind + f.cacheSkriv + f.cacheLaes;
  const cache = total > 0 ? Math.round((f.cacheLaes / total) * 100) : 0;
  return `${f.kald} runder · ${cache} % fra cache`;
}

/** Til tekst uden styling (tooltips, skærmlæsere, metalinjer): "0,09 USD (≈ 60 øre)" */
export function formaterPrisMedKroner(usd: number | null): string | null {
  return usd === null ? null : `${formaterPris(usd)} (${formaterKroner(usd)})`;
}
