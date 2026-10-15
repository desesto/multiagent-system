// En billedfil før og efter, side om side — fx en tekstur i et spil
// eller et ikon i en app. Små billeder (som 16×16-teksturer) forstørres
// med skarpe pixels, så man kan se hver enkelt. Ternet baggrund viser,
// hvor billedet er gennemsigtigt.

import { useState } from "react";
import type { FilVersion } from "../../../../../packages/domain/src/domain/diff";
import { filBilledUrl } from "../../api";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";

/** Billeder op til denne størrelse forstørres til mindst MAAL_PX */
const LILLE_PX = 64;
const MAAL_PX = 256;

const SIDER: { version: FilVersion; tekst: string }[] = [
  { version: "foer", tekst: "Før" },
  { version: "efter", tekst: "Efter" },
];

export function BilledDiff({
  implId,
  sti,
  versioner,
}: {
  implId: string;
  sti: string;
  versioner: Record<FilVersion, boolean>;
}): Renderable {
  const sider = SIDER.filter((s) => versioner[s.version]);
  return (
    <div className={cn("grid gap-3 border-b border-kant p-3.5", sider.length === 2 && "sm:grid-cols-2")}>
      {sider.map((s) => (
        <Side key={s.version} url={filBilledUrl(implId, sti, s.version)} tekst={sider.length === 2 ? s.tekst : enkeltTekst(versioner)} />
      ))}
    </div>
  );
}

function enkeltTekst(v: Record<FilVersion, boolean>): string {
  return v.efter ? "Ny fil" : "Slettet fil";
}

function Side({ url, tekst }: { url: string; tekst: string }): Renderable {
  const [str, setStr] = useState<{ b: number; h: number } | null>(null);
  const [fejl, setFejl] = useState(false);
  const lille = str !== null && Math.max(str.b, str.h) <= LILLE_PX;
  const faktor = lille && str ? Math.max(1, Math.floor(MAAL_PX / Math.max(str.b, str.h))) : 1;

  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold">{tekst}</span>
        {str && (
          <span className="font-mono text-daempet">
            {str.b} × {str.h} px{faktor > 1 && ` · vist ${faktor}×`}
          </span>
        )}
      </figcaption>
      <div className="flex min-h-[120px] items-center justify-center overflow-auto rounded-md border border-kant bg-[conic-gradient(var(--color-kant)_25%,var(--color-kort)_0_50%,var(--color-kant)_0_75%,var(--color-kort)_0)] bg-[length:16px_16px] p-3">
        {fejl ? (
          <p className="text-xs text-farelys">Billedet kunne ikke vises</p>
        ) : (
          <img
            src={url}
            alt={tekst}
            onLoad={(e) => setStr({ b: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            onError={() => setFejl(true)}
            style={str && lille ? { width: str.b * faktor, height: str.h * faktor } : undefined}
            className={cn("max-w-full", lille && "[image-rendering:pixelated]")}
          />
        )}
      </div>
    </figure>
  );
}
