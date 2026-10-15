// Fabrikken, der laver fil-adgang pr. opgave. Kender den tilladte
// rod fra konfigurationen, så ruterne aldrig selv læser miljøet.

import type {
  IFilAdgang,
  IFilAdgangFabrik,
} from "../../../../packages/domain/src/contracts/filAdgang";
import { FilAdgangLokal } from "./FilAdgangLokal";
import { validerProjektSti } from "./stiSikkerhed";

export class FilAdgangFabrikLokal implements IFilAdgangFabrik {
  constructor(private readonly tilladtRod: string | undefined) {}

  valider(projektSti: string): Promise<string | null> {
    return validerProjektSti(projektSti, this.tilladtRod);
  }

  forProjekt(projektSti: string): IFilAdgang {
    return new FilAdgangLokal(projektSti);
  }
}
