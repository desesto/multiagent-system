// Domæne: Projekt — toppen af hierarkiet. Et projekt samler opgaver om
// den samme kodebase, og opgaverne arver projektets sti.

export type ProjektId = string;

export interface Projekt {
  id: ProjektId;
  navn: string;
  beskrivelse: string;
  /** Absolut sti til kodebasen — null = et projekt uden kode endnu */
  sti: string | null;
  /** Sat, når projektet er fjernet fra oversigten — kan gendannes */
  arkiveretTidspunkt: string | null;
  oprettetTidspunkt: string;
}

/** Til projektoversigten: projektet plus et overblik over dets opgaver */
export interface ProjektMedTal extends Projekt {
  antalOpgaver: number;
  /** Opgaver, der ikke er afsluttet */
  aktiveOpgaver: number;
  /** Seneste oprettede opgave — null, hvis projektet ingen opgaver har */
  senesteAktivitet: string | null;
}
