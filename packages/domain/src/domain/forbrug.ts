// Tokenforbrug som RÅDATA — grundlaget for et fremtidigt analyseværktøj.
// Priser beregnes ikke her: de ændrer sig over tid, tokental gør ikke.
// Gemmes pr. agentsvar og pr. implementering.

export interface TokenForbrug {
  model: string;
  /** Antal API-kald (runder) i kørslen */
  kald: number;
  /** Input efter sidste cache-punkt — fuld inputpris */
  ind: number;
  /** Skrevet til cachen */
  cacheSkriv: number;
  /** Læst fra cachen */
  cacheLaes: number;
  ud: number;
}

/** Pris i USD pr. million tokens for én model */
export interface ModelPris {
  input: number;
  cacheSkriv: number;
  cacheLaes: number;
  output: number;
}

/** Én kørsel, der har brugt tokens — en analyse eller en implementering */
export interface Koersel {
  type: "analyse" | "implementering";
  tidspunkt: string;
  opgaveId: string;
  opgaveTitel: string;
  agentNavn: string;
  forbrug: TokenForbrug | null;
  /** Udbyderens eget prisestimat, når det findes (implementeringer) */
  prisUsd: number | null;
}

/** Samlet overblik til forbrugssiden. Alle beløb i USD. */
export interface ForbrugsOversigt {
  periodeDage: number;
  totalUsd: number;
  idagUsd: number;
  /** null = budgetvagten er slået fra */
  dagligtBudgetUsd: number | null;
  analyseUsd: number;
  implementeringUsd: number;
  prDag: { dato: string; analyseUsd: number; implementeringUsd: number }[];
  prOpgave: { opgaveId: string; titel: string; usd: number }[];
  prAgent: { navn: string; usd: number; koersler: number }[];
  tokens: { ind: number; cacheSkriv: number; cacheLaes: number; ud: number };
  /** Andel af alt input, der kom fra cachen (0–1) */
  cacheAndel: number;
  /** Kørsler, der ikke kunne prissættes — fx ukendt model eller gamle kørsler uden tokens */
  uprisedeKoersler: number;
  /** Hvornår pristabellen sidst er tjekket mod Anthropics priser */
  priserTjekket: string;
}
