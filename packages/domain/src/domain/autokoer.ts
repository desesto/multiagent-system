// Domæne: autokør — en kø af opgaver, som systemet tager hele vejen til
// en pull request uden at nogen trykker på knappen. Beslutningen flytter
// til pull requesten: intet flettes nogensinde uden brugeren.

import type { TokenForbrug } from "./forbrug";

export type AutokoerStatus =
  /** I køen, ikke startet */
  | "venter"
  | "koerer"
  /** Pull requesten er oprettet */
  | "faerdig"
  | "fejlet";

export interface AutokoerPost {
  id: string;
  opgaveId: string;
  opgaveTitel: string;
  status: AutokoerStatus;
  /** Hvem valgte retningen: brugeren (før køen) eller arkitekten (i køen) */
  valgtAf: "bruger" | "arkitekt" | null;
  /** Arkitektens begrundelse for sit valg */
  begrundelse: string | null;
  implementeringId: string | null;
  prUrl: string | null;
  /** Fejl, eller en bemærkning (fx en kladde-PR, fordi arbejdet kan være ufærdigt) */
  besked: string | null;
  /** Forbruget ved arkitektens valg (implementeringen har sit eget) */
  forbrug: TokenForbrug | null;
  tilfoejetTidspunkt: string;
  startetTidspunkt: string | null;
  afsluttetTidspunkt: string | null;
}

export interface AutokoerTilstand {
  /** Arbejder køen lige nu? */
  koerer: boolean;
  /** Køen stopper efter den aktuelle opgave */
  stopper: boolean;
  aktivPostId: string | null;
  /** Hvorfor køen sidst stoppede */
  stopGrund: string | null;
  /** Antal autokørsler startet i dag, og loftet */
  idag: number;
  maxPrDag: number;
}

export interface AutokoerOversigt {
  tilstand: AutokoerTilstand;
  poster: AutokoerPost[];
}

/**
 * Grenens navn på GitHub: agentens gren + et læsbart stykke af titlen,
 * fx "agent/a3f29c1e-ny-farve-tema". Kun a-z, 0-9 og bindestreger.
 */
export function grennavnTilPr(gren: string, titel: string): string {
  const slug = titel
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug ? `${gren}-${slug}` : gren;
}
