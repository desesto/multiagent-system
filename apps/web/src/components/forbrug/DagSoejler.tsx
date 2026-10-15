// Forbrug pr. dag som stablede søjler: analyser nederst, implementeringer
// ovenpå. Ren CSS — ingen diagram-afhængighed. Hver søjle har en
// beskrivelse til skærmlæsere og en tooltip med de præcise beløb.

import type { ForbrugsOversigt } from "../../../../../packages/domain/src/domain/forbrug";
import { formaterPris, formaterPrisMedKroner } from "../../lib/forbrug";
import type { Renderable } from "../../lib/renderable";

export function DagSoejler({ dage }: { dage: ForbrugsOversigt["prDag"] }): Renderable {
  const max = Math.max(...dage.map((d) => d.analyseUsd + d.implementeringUsd), 0.000001);
  return (
    <div>
      <div className="flex h-40 items-end gap-[3px]">
        {dage.map((d) => {
          const total = d.analyseUsd + d.implementeringUsd;
          const beskrivelse = `${kortDato(d.dato)}: ${formaterPrisMedKroner(total)} — analyser ${formaterPris(d.analyseUsd)}, implementeringer ${formaterPris(d.implementeringUsd)}`;
          return (
            <div
              key={d.dato}
              className="flex h-full flex-1 flex-col justify-end"
              title={beskrivelse}
              aria-label={beskrivelse}
              role="img"
            >
              <div className="bg-t-feature" style={{ height: `${(d.implementeringUsd / max) * 100}%` }} />
              <div className="rounded-b-sm bg-accent" style={{ height: `${(d.analyseUsd / max) * 100}%` }} />
              {total === 0 && <div className="h-px bg-kant" />}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-xs text-daempet">
        <span>{kortDato(dage[0]?.dato)}</span>
        <span>{kortDato(dage.at(-1)?.dato)}</span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-daempet">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-accent" />Analyser</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-t-feature" />Implementeringer</span>
      </div>
    </div>
  );
}

function kortDato(dato: string | undefined): string {
  if (!dato) return "";
  const [, maaned, dag] = dato.split("-");
  return `${Number(dag)}/${Number(maaned)}`;
}
