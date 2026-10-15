// Gemte billeder på en opgave eller en kommentar: små miniaturer, der
// åbnes i fuld størrelse ved klik. Små billeder (fx teksturer) forstørres
// med skarpe pixels.

import { useState } from "react";
import type { Vedhaeftning } from "../../../../../packages/domain/src/domain/vedhaeftning";
import { vedhaeftningUrl } from "../../api";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { IkonLuk } from "../Ikoner";
import { Popup } from "../Popup";

const LILLE_PX = 64;

export function BilledGalleri({
  billeder,
  stoerrelse = "size-16",
  onSlet,
}: {
  billeder: Vedhaeftning[];
  /** Tailwind-størrelse på miniaturerne */
  stoerrelse?: string;
  /** Udeladt = billederne kan kun ses */
  onSlet?: (v: Vedhaeftning) => void;
}): Renderable {
  const [aaben, setAaben] = useState<Vedhaeftning | null>(null);
  if (billeder.length === 0) return null;
  return (
    <>
      <ul className="mt-2 flex flex-wrap gap-2">
        {billeder.map((v) => (
          <li key={v.id} className="relative">
            <button
              type="button"
              onClick={() => setAaben(v)}
              aria-label={`Se ${v.navn} i fuld størrelse`}
              className="block cursor-pointer overflow-hidden rounded-md border border-kant focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:border-accent"
            >
              <img src={vedhaeftningUrl(v.id)} alt={v.navn} loading="lazy" className={cn(stoerrelse, "object-cover")} />
            </button>
            {onSlet && (
              <button
                type="button"
                onClick={() => onSlet(v)}
                aria-label={`Fjern ${v.navn}`}
                className="absolute -top-1.5 -right-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full border border-kant bg-kort text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-farelys"
              >
                <IkonLuk className="size-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {aaben && <StortBillede billede={aaben} onLuk={() => setAaben(null)} />}
    </>
  );
}

function StortBillede({ billede, onLuk }: { billede: Vedhaeftning; onLuk: () => void }): Renderable {
  const [str, setStr] = useState<{ b: number; h: number } | null>(null);
  const lille = str !== null && Math.max(str.b, str.h) <= LILLE_PX;
  const faktor = lille && str ? Math.floor(320 / Math.max(str.b, str.h)) : 1;
  return (
    <Popup aaben onLuk={onLuk} bredde="bred" etiket={billede.navn}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-kant px-3.5 py-2.5">
        <p className="truncate font-mono text-[0.85rem]">
          {billede.navn}
          {str && <span className="ml-2 text-xs text-daempet">{str.b} × {str.h} px</span>}
        </p>
        <button
          type="button"
          onClick={onLuk}
          aria-label="Luk"
          autoFocus
          className="cursor-pointer rounded p-1 text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-tekst"
        >
          <IkonLuk className="size-5" />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-flade p-3.5">
        <img
          src={vedhaeftningUrl(billede.id)}
          alt={billede.navn}
          onLoad={(e) => setStr({ b: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          style={lille && str ? { width: str.b * faktor, height: str.h * faktor } : undefined}
          className={cn("max-h-[75vh] max-w-full object-contain", lille && "[image-rendering:pixelated]")}
        />
      </div>
    </Popup>
  );
}
