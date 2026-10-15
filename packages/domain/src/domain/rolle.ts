// Domæne: Rolle — registreringen af hvad agenter må og kan.
// Matcher rolleregistret fra designdokumentet (afsnit 3).

export type RolleId = string;

export interface Karakteristik {
  navn: string;
  beskrivelse: string;
}

export type RolleStatus = "aktiv" | "drifting" | "deprecated" | "suspenderet";

export interface Rolle {
  id: RolleId;
  navn: string; // fx "Programmør", "Arkitekt", "Tester"
  /** Purpose statement — 1-2 sætninger. Bruges til deduplikeringstjek. */
  formaal: string;
  /** Eksplicit liste over hvad rollen IKKE må — forebygger drift */
  scopeGraenser: string[];
  anbefaledeKarakteristika: Karakteristik[];
  /** Vælges til/fra pr. tildeling — se Tildeling.valgteKarakteristika */
  valgfrieKarakteristika: Karakteristik[];
  /** Sat hvis rollen er splittet fra en anden rolle (drift-debat) */
  parentRolleId: RolleId | null;
  status: RolleStatus;
  /** Inkrementeres når formålet formelt opdateres efter bekræftet drift */
  version: number;
  oprettetTidspunkt: string;
}
