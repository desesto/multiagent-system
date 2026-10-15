// Stifelt med "Gennemse filer" — skriv stien selv, eller vælg mappen.

import { useState } from "react";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { IkonMappe } from "../Ikoner";
import { Knap } from "../Knapper";
import { MappeVaelger } from "./MappeVaelger";

export function StiFelt({
  etiket,
  vaerdi,
  onSkift,
  feltKlasse,
  etiketKlasse,
}: {
  etiket: string;
  vaerdi: string;
  onSkift: (sti: string) => void;
  feltKlasse: string;
  etiketKlasse: string;
}): Renderable {
  const [vaelgerAaben, setVaelgerAaben] = useState(false);
  return (
    <>
      <label className={etiketKlasse}>
        {etiket}
        <div className="flex gap-2">
          <input
            className={cn(feltKlasse, "min-w-0 flex-1 font-mono text-[0.85rem]")}
            value={vaerdi}
            onChange={(e) => onSkift(e.target.value)}
            placeholder="C:\Users\...\IdeaProjects\mit-projekt"
            spellCheck={false}
          />
          {/* type="button": ellers ville knappen indsende formularen */}
          <Knap type="button" className="shrink-0" onClick={() => setVaelgerAaben(true)}>
            Gennemse filer
            <IkonMappe />
          </Knap>
        </div>
      </label>
      <MappeVaelger aaben={vaelgerAaben} start={vaerdi} onVaelg={onSkift} onLuk={() => setVaelgerAaben(false)} />
    </>
  );
}
