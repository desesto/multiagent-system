// Omdanner git's "unified diff" til rækker til en side-om-side-visning
// som på GitHub. Ren funktion uden git — derfor let at teste.
//
// I git's format står fjernede linjer (-) samlet før de tilføjede (+).
// En blok af fjernede linjer parres række for række med den efterfølgende
// blok af tilføjede, så en ændret linje står ud for sin nye version.

import type { DiffRaekke, DiffSide } from "../../../../packages/domain/src/domain/diff";

const UDSNIT = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseUnifiedDiff(diff: string): DiffRaekke[] {
  const raekker: DiffRaekke[] = [];
  let fjernede: DiffSide[] = [];
  let tilfoejede: DiffSide[] = [];
  let venstreNr = 0;
  let hoejreNr = 0;
  let iUdsnit = false;

  /** Parrer de ventende fjernede og tilføjede linjer til rækker */
  function toem(): void {
    for (let i = 0; i < Math.max(fjernede.length, tilfoejede.length); i++) {
      raekker.push({ type: "linje", venstre: fjernede[i] ?? null, hoejre: tilfoejede[i] ?? null });
    }
    fjernede = [];
    tilfoejede = [];
  }

  for (const raa of diff.split("\n")) {
    const linje = raa.replace(/\r$/, "");
    const udsnit = UDSNIT.exec(linje);
    if (udsnit) {
      toem();
      venstreNr = Number(udsnit[1]);
      hoejreNr = Number(udsnit[2]);
      iUdsnit = true;
      raekker.push({ type: "udsnit", tekst: linje });
      continue;
    }
    if (!iUdsnit || linje.startsWith("\\")) continue; // filhoved, "\ No newline at end of file"

    const tegn = linje[0];
    const tekst = linje.slice(1);
    if (tegn === "-") {
      if (tilfoejede.length > 0) toem(); // en ny ændringsblok begynder
      fjernede.push({ nr: venstreNr++, tekst, art: "fjernet" });
    } else if (tegn === "+") {
      tilfoejede.push({ nr: hoejreNr++, tekst, art: "tilfoejet" });
    } else if (tegn === " ") {
      toem();
      raekker.push({
        type: "linje",
        venstre: { nr: venstreNr++, tekst, art: "uaendret" },
        hoejre: { nr: hoejreNr++, tekst, art: "uaendret" },
      });
    }
  }
  toem();
  return raekker;
}
