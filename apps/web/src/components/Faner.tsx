// Faner — fælles komponent uden domænekendskab. Bruger ARIA-rollerne
// tablist/tab, så skærmlæsere forstår dem som faner.

import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";

export interface Fane<T extends string> {
  id: T;
  tekst: string;
  antal?: number;
}

export function Faner<T extends string>({
  faner,
  aktiv,
  onSkift,
  etiket,
}: {
  faner: Fane<T>[];
  aktiv: T;
  onSkift: (id: T) => void;
  /** Beskrivelse af fanegruppen til skærmlæsere */
  etiket: string;
}): Renderable {
  return (
    <div role="tablist" aria-label={etiket} className="flex gap-1 border-b border-kant">
      {faner.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={f.id === aktiv}
          onClick={() => onSkift(f.id)}
          className={cn(
            "-mb-px cursor-pointer border-b-2 px-3 py-1.5 text-[0.82rem] font-semibold",
            "focus-visible:outline-2 focus-visible:outline-accent",
            f.id === aktiv
              ? "border-accent text-tekst"
              : "border-transparent text-daempet pointer-fine:hover:text-tekst"
          )}
        >
          {f.tekst}
          {f.antal !== undefined && (
            <span className="ml-1.5 rounded-full bg-kort px-1.5 text-xs font-normal">{f.antal}</span>
          )}
        </button>
      ))}
    </div>
  );
}
