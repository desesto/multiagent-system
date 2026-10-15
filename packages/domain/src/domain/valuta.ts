// Omregning fra dollars til danske kroner — ÉT sted, så web og API viser
// det samme. Kursen er fast og kun vejledende: Anthropic fakturerer i USD,
// og din bank bruger sin egen kurs. Opdatér den en gang imellem.

export const KURS_USD_DKK = 6.7;
export const KURS_TJEKKET = "oktober 2026";

/** Fx "≈ 62 øre" eller "≈ 6,70 kr." */
export function formaterKroner(usd: number): string {
  const kroner = usd * KURS_USD_DKK;
  if (kroner < 1) {
    const oere = Math.round(kroner * 100);
    return oere < 1 ? "under 1 øre" : `≈ ${oere} øre`;
  }
  return `≈ ${kroner.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr.`;
}
