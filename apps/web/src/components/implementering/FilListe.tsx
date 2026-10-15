// Implementeringens filer i to faner: ændrede (inkl. slettede) og
// oprettede. Et klik åbner filens ændringer i en popup.

import { useState } from "react";
import type { Implementering } from "../../../../../packages/domain/src/domain/implementering";
import type { Renderable } from "../../lib/renderable";
import { cn } from "../../lib/cn";
import { FIL_TYPE_FARVE } from "../../tekster";
import { Faner } from "../Faner";
import { FilDiffPopup } from "../diff/FilDiffPopup";

type FaneId = "aendret" | "oprettet";

export function FilListe({ impl }: { impl: Implementering }): Renderable {
  const aendrede = impl.aendredeFiler.filter((f) => f.type !== "oprettet");
  const oprettede = impl.aendredeFiler.filter((f) => f.type === "oprettet");
  const [valgtSti, setValgtSti] = useState<string | null>(null);
  const [aktiv, setAktiv] = useState<FaneId>(
    aendrede.length > 0 || oprettede.length === 0 ? "aendret" : "oprettet"
  );
  if (impl.aendredeFiler.length === 0) return null;
  const viste = aktiv === "aendret" ? aendrede : oprettede;

  return (
    <div className="mt-2.5">
      <Faner
        etiket="Filer i implementeringen"
        aktiv={aktiv}
        onSkift={setAktiv}
        faner={[
          { id: "aendret", tekst: "Filer ændret", antal: aendrede.length },
          { id: "oprettet", tekst: "Filer oprettet", antal: oprettede.length },
        ]}
      />
      {viste.length === 0 ? (
        <p className="mt-2 text-xs text-daempet">Ingen filer her.</p>
      ) : (
        <ul role="tabpanel" className="mt-1.5 font-mono text-xs">
          {viste.map((f) => (
            <li key={f.sti}>
              <button
                type="button"
                onClick={() => setValgtSti(f.sti)}
                className="flex w-full cursor-pointer justify-between gap-3 rounded px-1.5 py-1 text-left focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:bg-kort"
              >
                {/* Farven viser arten; "(slettet)" sikrer, at den også kan læses uden farver */}
                <span className={cn("truncate", FIL_TYPE_FARVE[f.type])}>
                  {f.sti}
                  {f.type === "slettet" && <span className="ml-2">(slettet)</span>}
                </span>
                <span className="shrink-0">
                  <span className="text-t-feature">+{f.tilfoejet}</span>{" "}
                  <span className="text-t-bugfix">−{f.fjernet}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <FilDiffPopup implId={impl.id} sti={valgtSti} onLuk={() => setValgtSti(null)} />
    </div>
  );
}
