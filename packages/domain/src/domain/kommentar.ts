// Domæne: brugerens kommentarer til et beslutningspunkt. Sendes med til
// agenterne, både ved en ny vurdering og ved implementering.

import type { Vedhaeftning } from "./vedhaeftning";

export interface Kommentar {
  id: string;
  beslutningspunktId: string;
  tekst: string;
  /** Billeder, brugeren har vedhæftet kommentaren */
  vedhaeftninger: Vedhaeftning[];
  oprettetTidspunkt: string;
}
