// Projektets filtræ som overblik til agentens FØRSTE besked.
// Sparer en hel runde med list_filer, og fordi træet ligger i
// starten af samtalen, bliver det cachet i alle følgende kald.

import type { IFilAdgang } from "../../../../packages/domain/src/contracts/filAdgang";
import { udfoerVaerktoej } from "./udfoerVaerktoej";

export async function hentProjektOverblik(filAdgang: IFilAdgang): Promise<string> {
  const resultat = await udfoerVaerktoej({ type: "list_filer", sti: "." }, filAdgang);
  return resultat.fejl ? "" : resultat.tekst;
}
