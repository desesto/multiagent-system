// Domæne: før/efter-billeder af en implementering. Ved frontend- og
// fuldstack-opgaver fotograferer systemet de berørte sider to gange:
// som de så ud før agenten (grenens udgangspunkt) og efter (agentens commit).

export type SkaermbilledTilstand = "foer" | "efter";

/** Hvor langt fotograferingen er — null, når opgaven ikke er visuel */
export type BilledStatus = "tages" | "klar" | "fejlet";

/** Metadata om ét billede. Selve billedet hentes for sig (det er stort). */
export interface Skaermbillede {
  id: string;
  implementeringId: string;
  /** Siden i appen, fx "/" eller "/forbrug" */
  rute: string;
  tilstand: SkaermbilledTilstand;
  bredde: number;
  hoejde: number;
  oprettetTidspunkt: string;
}

/** Højst så mange sider fotograferes pr. implementering */
export const MAX_RUTER = 3;

/**
 * Agenten skriver de berørte sider sidst i sin opsummering, fx
 * "Ruter: /, /forbrug". Kun faste stier uden parametre (":id") og uden
 * domæne accepteres — alt andet ignoreres. Ingen gyldige ruter = forsiden.
 */
export function ruterFraOpsummering(opsummering: string | null): string[] {
  const linjer = [...(opsummering ?? "").matchAll(/^[\s*_-]*Ruter:[\s*_]*(.+)$/gim)];
  const sidste = linjer.at(-1)?.[1] ?? "";
  const ruter = sidste
    .split(/[,\s]+/)
    .map((r) => r.replace(/[`*_]/g, "").trim())
    .filter((r) => /^\/[A-Za-z0-9\-._~/]*$/.test(r));
  const unikke = [...new Set(ruter)].slice(0, MAX_RUTER);
  return unikke.length > 0 ? unikke : ["/"];
}
