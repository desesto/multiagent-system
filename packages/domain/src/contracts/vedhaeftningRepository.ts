// Kontrakt for vedhæftede billeder.
//
// Et billede uploades FØR opgaven eller kommentaren gemmes (så det kan
// vises og tjekkes med det samme) og kobles på bagefter. Løse billeder,
// der aldrig blev koblet på, ryddes op ved opstart.

import type { Vedhaeftning, VedhaeftningType } from "../domain/vedhaeftning";

export interface NyVedhaeftning {
  navn: string;
  type: VedhaeftningType;
  data: Uint8Array;
}

/** Et billede klar til at blive vist for en agent */
export interface AgentBillede {
  /** Hvor billedet kommer fra, fx "Billede fra opgavebeskrivelsen: fejl.png" */
  etiket: string;
  type: VedhaeftningType;
  data: Uint8Array;
}

export interface IVedhaeftningRepository {
  gem(ny: NyVedhaeftning): Promise<Vedhaeftning>;
  /** Kobler LØSE billeder på — allerede koblede billeder flyttes aldrig. Returnerer antallet. */
  knytTilOpgave(ider: string[], opgaveId: string): Promise<number>;
  knytTilKommentar(ider: string[], kommentarId: string): Promise<number>;
  hentForOpgave(opgaveId: string): Promise<Vedhaeftning[]>;
  hentForKommentarer(kommentarIder: string[]): Promise<Map<string, Vedhaeftning[]>>;
  hentData(id: string): Promise<{ type: VedhaeftningType; data: Uint8Array } | null>;
  /** Opgavens billeder og kommentarernes, i den rækkefølge agenten skal se dem */
  agentBilleder(opgaveId: string, kommentarer: { id: string; tekst: string }[]): Promise<AgentBillede[]>;
  slet(id: string): Promise<boolean>;
  /** Løse billeder ældre end grænsen slettes. Returnerer antallet. */
  ryddLoese(aeldreEnd: Date): Promise<number>;
}
