// Kommentarerne langs kæden af ny vurdering: et punkt og alle de punkter,
// det har erstattet — ældste først. Så går intet af det, brugeren har
// skrevet undervejs, tabt, når der implementeres på et nyere punkt.

import type { Beslutningspunkt } from "../../../../packages/domain/src/domain/opgave";
import type { Kommentar } from "../../../../packages/domain/src/domain/kommentar";

export function kommentarKaede(punkter: Beslutningspunkt[], punktId: string): Kommentar[] {
  const kaede: Beslutningspunkt[] = [];
  let nuvaerende = punkter.find((p) => p.id === punktId);
  while (nuvaerende) {
    kaede.unshift(nuvaerende);
    const id = nuvaerende.id;
    nuvaerende = punkter.find((p) => p.erstattetAf === id);
  }
  return kaede.flatMap((p) => p.kommentarer ?? []);
}
