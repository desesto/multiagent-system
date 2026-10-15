// Opgavetypens farvede mærkat — var kopieret i kort og detaljeside.

import type { OpgaveType } from "../../../../../packages/domain/src/domain/opgave";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { TYPE_FARVE, TYPE_TEKST } from "../../tekster";

export function TypeMaerkat({ type }: { type: OpgaveType }): Renderable {
  return (
    <span
      className={cn(
        "rounded-full border border-current px-2 py-[3px] text-[0.72rem] font-bold uppercase tracking-[0.06em]",
        TYPE_FARVE[type]
      )}
    >
      {TYPE_TEKST[type]}
    </span>
  );
}
