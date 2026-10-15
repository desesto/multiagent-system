// Domæne: visning af en fils ændringer i en implementering, som på
// GitHub. Bygges af serveren ud fra git, så visningen altid er den
// samme som `git diff`.

export type FilAendringsType = "oprettet" | "aendret" | "slettet";

/** Filens version før agentens commit eller efter */
export type FilVersion = "foer" | "efter";

export interface DiffSide {
  /** Linjenummer i den version, siden viser */
  nr: number;
  tekst: string;
  art: "uaendret" | "fjernet" | "tilfoejet";
}

/** Én række i side-om-side-visningen */
export type DiffRaekke =
  /** Overskrift for et udsnit, fx "@@ -10,7 +10,9 @@" */
  | { type: "udsnit"; tekst: string }
  /** Venstre = gammel version, højre = ny. null = tom celle (linjen findes kun på den anden side) */
  | { type: "linje"; venstre: DiffSide | null; hoejre: DiffSide | null };

export interface FilDiff {
  sti: string;
  type: FilAendringsType;
  /** Hele filen — for oprettede (ny version) og slettede (gammel version) filer */
  linjer: string[] | null;
  /** Side-om-side-rækker — for ændrede filer */
  raekker: DiffRaekke[] | null;
  binaer: boolean;
  forStor: boolean;
  /**
   * Billedfiler (png, jpg, svg …): hvilke versioner der kan vises som
   * billede — en oprettet fil har intet "før". null = ikke et billede.
   */
  billede: Record<FilVersion, boolean> | null;
}
