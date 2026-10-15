// Ønskede sluttilstande for beslutninger på detaljesiden — rene
// funktioner uden React, så de kan testes isoleret. Hver funktion
// beskriver, hvordan siden SKAL se ud, når handlingen er lykkedes.

import type {
  Beslutningspunkt as Punkt,
  Opgave,
} from "../../../../packages/domain/src/domain/opgave";
import type { Oenske } from "./useOptimistisk";

export interface DetaljeTilstand {
  opgave: Opgave | null;
  punkter: Punkt[];
}

export function efterValg(punktId: string, mulighedId: string): Oenske<DetaljeTilstand> {
  return (nu) => ({
    opgave: nu.opgave && { ...nu.opgave, status: "i_gang" },
    punkter: nu.punkter.map((p) =>
      p.id === punktId
        ? { ...p, valgtMulighedId: mulighedId, besluttetTidspunkt: new Date().toISOString() }
        : p
    ),
  });
}

/** Spejler serverens regel: det gamle valg flyttes til loggen, det slettes aldrig */
export function efterFortryd(punktId: string): Oenske<DetaljeTilstand> {
  return (nu) => ({
    opgave: nu.opgave && { ...nu.opgave, status: "afventer_beslutning" },
    punkter: nu.punkter.map((p) => {
      if (p.id !== punktId || !p.valgtMulighedId || !p.besluttetTidspunkt) return p;
      return {
        ...p,
        valgtMulighedId: null,
        besluttetTidspunkt: null,
        tidligereValg: [
          ...(p.tidligereValg ?? []),
          {
            mulighedId: p.valgtMulighedId,
            valgtTidspunkt: p.besluttetTidspunkt,
            fortrudtTidspunkt: new Date().toISOString(),
          },
        ],
      };
    }),
  });
}

/** Når serveren har svaret: erstat punktet med serverens version */
export function medServerPunkt(
  punkt: Punkt,
  status: Opgave["status"]
): Oenske<DetaljeTilstand> {
  return (nu) => ({
    opgave: nu.opgave && { ...nu.opgave, status },
    punkter: nu.punkter.map((p) => (p.id === punkt.id ? punkt : p)),
  });
}
