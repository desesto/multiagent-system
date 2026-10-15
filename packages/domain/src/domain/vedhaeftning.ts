// Domæne: billeder, brugeren vedhæfter en opgavebeskrivelse eller en
// kommentar — fx et skærmbillede af en fejl eller en tekstur, der skal
// ændres. Agenterne ser billederne, både ved analyse og implementering.

/** De billedtyper, AI-modellen kan se */
export type VedhaeftningType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

export interface Vedhaeftning {
  id: string;
  navn: string;
  type: VedhaeftningType;
  /** Bytes */
  stoerrelse: number;
  oprettetTidspunkt: string;
}

/** Modellens grænse pr. billede */
export const MAX_VEDHAEFTNING_BYTES = 5 * 1024 * 1024;
/** Pr. opgave og pr. kommentar */
export const MAX_VEDHAEFTNINGER = 6;
/** Større billeder skaleres ned i browseren — modellen skalerer alligevel selv herned */
export const MAX_BILLED_KANT_PX = 1568;
