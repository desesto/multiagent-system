// Én fils ændringer i en popup foran implementeringen — som på GitHub.
// Lukkes med krydset, klik udenfor eller Escape.

import { useEffect, useState } from "react";
import type { FilDiff } from "../../../../../packages/domain/src/domain/diff";
import { hentFilDiff } from "../../api";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { FIL_TYPE_FARVE, FIL_TYPE_TEKST } from "../../tekster";
import { FejlBesked } from "../FejlBesked";
import { IkonLuk } from "../Ikoner";
import { Popup } from "../Popup";
import { HelFilVisning } from "./HelFilVisning";
import { SideOmSideDiff } from "./SideOmSideDiff";
import { BilledDiff } from "./BilledDiff";

export function FilDiffPopup({
  implId,
  sti,
  onLuk,
}: {
  implId: string;
  /** null = lukket */
  sti: string | null;
  onLuk: () => void;
}): Renderable {
  return (
    <Popup aaben={sti !== null} onLuk={onLuk} bredde="bred" etiket={`Ændringer i ${sti ?? ""}`}>
      {/* key: ny fil = nyt indhold, så den gamle aldrig vises et øjeblik */}
      {sti && <Indhold key={sti} implId={implId} sti={sti} onLuk={onLuk} />}
    </Popup>
  );
}

function Indhold({ implId, sti, onLuk }: { implId: string; sti: string; onLuk: () => void }): Renderable {
  const [diff, setDiff] = useState<FilDiff | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);

  useEffect(() => {
    hentFilDiff(implId, sti)
      .then(setDiff)
      .catch((e: Error) => setFejl(e.message));
  }, [implId, sti]);

  // Et rent billede har ingen linjer at tælle
  const antal = diff && (diff.raekker || diff.linjer) ? taelLinjer(diff) : null;

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-kant px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {diff && (
            <span className={cn("text-xs font-bold uppercase tracking-wider", FIL_TYPE_FARVE[diff.type])}>
              {FIL_TYPE_TEKST[diff.type]}
            </span>
          )}
          <code className="truncate font-mono text-[0.85rem]">{sti}</code>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {antal && (
            <span className="font-mono text-xs">
              <span className="text-t-feature">+{antal.tilfoejet}</span>{" "}
              <span className="text-t-bugfix">−{antal.fjernet}</span>
            </span>
          )}
          <button
            type="button"
            onClick={onLuk}
            aria-label="Luk"
            autoFocus
            className="cursor-pointer rounded p-1 text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:bg-flade pointer-fine:hover:text-tekst"
          >
            <IkonLuk className="size-5" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto bg-flade">
        {fejl && <div className="p-4"><FejlBesked besked={fejl} /></div>}
        {!diff && !fejl && <p className="p-4 text-daempet">Henter filen…</p>}
        {diff?.billede && <BilledDiff implId={implId} sti={sti} versioner={diff.billede} />}
        {diff && <Visning diff={diff} />}
      </div>
    </>
  );
}

function Visning({ diff }: { diff: FilDiff }): Renderable {
  if (diff.billede && !diff.raekker && !diff.linjer && !diff.binaer && !diff.forStor) return null;
  if (diff.binaer) return <p className="p-4 text-daempet">Binær fil — kan ikke vises som tekst.</p>;
  if (diff.forStor) {
    return <p className="p-4 text-daempet">Filen er for stor til at blive vist her. Brug git diff i terminalen.</p>;
  }
  if (diff.raekker) return <SideOmSideDiff raekker={diff.raekker} />;
  if (diff.linjer) {
    return <HelFilVisning linjer={diff.linjer} art={diff.type === "slettet" ? "fjernet" : "tilfoejet"} />;
  }
  return null;
}

function taelLinjer(diff: FilDiff): { tilfoejet: number; fjernet: number } {
  if (diff.linjer) {
    return diff.type === "slettet"
      ? { tilfoejet: 0, fjernet: diff.linjer.length }
      : { tilfoejet: diff.linjer.length, fjernet: 0 };
  }
  let tilfoejet = 0;
  let fjernet = 0;
  for (const r of diff.raekker ?? []) {
    if (r.type !== "linje") continue;
    if (r.hoejre?.art === "tilfoejet") tilfoejet++;
    if (r.venstre?.art === "fjernet") fjernet++;
  }
  return { tilfoejet, fjernet };
}
