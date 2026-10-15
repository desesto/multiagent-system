// Dispatcheren: ét værktøjskald ind, ét resultat ud.
// Samme mønster som en panel-renderer med switch på panelType —
// her er diskriminatoren `kald.type`.
//
// Kanttilfælde nedbrydes blødt: en forbudt sti, en binær fil eller
// en fil der ikke findes får IKKE kørslen til at crashe. Agenten får
// en forklarende fejl tilbage og kan prøve noget andet — og hændelsen
// logges, så vi kan se mønstre over tid.

import {
  FilAdgangsFejl,
  type IFilAdgang,
  type VaerktoejsKald,
  type VaerktoejsResultat,
} from "../../../../packages/domain/src/contracts/filAdgang";

export async function udfoerVaerktoej(
  kald: VaerktoejsKald,
  filAdgang: IFilAdgang
): Promise<VaerktoejsResultat> {
  try {
    switch (kald.type) {
      case "list_filer": {
        const filer = await filAdgang.listFiler(kald.sti);
        return {
          tekst: filer.length > 0 ? filer.join("\n") : "(mappen er tom)",
          fejl: false,
        };
      }
      case "laes_fil": {
        const indhold = await filAdgang.laesFil(kald.sti);
        return { tekst: indhold, fejl: false, laestFil: kald.sti };
      }
      case "soeg": {
        const traef = await filAdgang.soeg(kald.tekst, kald.sti);
        return {
          tekst:
            traef.length > 0
              ? traef.map((t) => `${t.sti}:${t.linje}: ${t.tekst}`).join("\n")
              : `Ingen træf for "${kald.tekst}"`,
          fejl: false,
        };
      }
      default:
        return ukendtKald(kald);
    }
  } catch (fejl) {
    if (fejl instanceof FilAdgangsFejl) {
      console.warn(`[vaerktoej] ${kald.type} afvist: ${fejl.message}`);
      return { tekst: fejl.message, fejl: true };
    }
    console.error(`[vaerktoej] ${kald.type} fejlede uventet`, fejl);
    return { tekst: "Uventet fejl under fil-adgang", fejl: true };
  }
}

/**
 * Tilføjes der et nyt værktøj til VaerktoejsKald uden en case ovenfor,
 * bliver `kald` ikke længere `never` — og compileren fejler HER.
 */
function ukendtKald(kald: never): VaerktoejsResultat {
  return { tekst: `Ukendt værktøj: ${JSON.stringify(kald)}`, fejl: true };
}
