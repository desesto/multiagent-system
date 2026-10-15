// Før/efter-billeder på implementeringskortet: pr. side to miniaturer
// side om side. Et klik åbner siden i fuld størrelse, hvor man skifter
// mellem før og efter på SAMME plads — så springer forskellen i øjnene.

import { useEffect, useState } from "react";
import type { Implementering } from "../../../../../packages/domain/src/domain/implementering";
import type { Skaermbillede, SkaermbilledTilstand } from "../../../../../packages/domain/src/domain/skaermbillede";
import { hentSkaermbilleder, skaermbilledUrl } from "../../api";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { Faner } from "../Faner";
import { IkonLuk } from "../Ikoner";
import { Popup } from "../Popup";

const TILSTANDE: { id: SkaermbilledTilstand; tekst: string }[] = [
  { id: "foer", tekst: "Før" },
  { id: "efter", tekst: "Efter" },
];

type Par = { rute: string } & Partial<Record<SkaermbilledTilstand, Skaermbillede>>;

function parPrRute(billeder: Skaermbillede[]): Par[] {
  const par = new Map<string, Par>();
  for (const b of billeder) par.set(b.rute, { ...par.get(b.rute), rute: b.rute, [b.tilstand]: b });
  return [...par.values()];
}

export function FoerEfter({ impl }: { impl: Implementering }): Renderable {
  const [billeder, setBilleder] = useState<Skaermbillede[]>([]);
  const [aaben, setAaben] = useState<Par | null>(null);
  const status = impl.billedStatus;

  useEffect(() => {
    if (status !== "klar" && status !== "fejlet") return;
    let aktuel = true;
    hentSkaermbilleder(impl.id).then(
      (b) => aktuel && setBilleder(b),
      () => aktuel && setBilleder([])
    );
    return () => {
      aktuel = false;
    };
  }, [impl.id, status]);

  if (!status) return null;
  return (
    <div className="mt-2.5">
      <p className="mb-1.5 text-[0.85rem] text-daempet">
        Før og efter
        {status === "tages" && <span className="ml-2 animate-pulse">— tager billeder af siderne …</span>}
      </p>
      {impl.billedBesked && (
        <p
          className={cn(
            "mb-2 whitespace-pre-wrap text-[0.82rem]",
            status === "fejlet" ? "text-farelys" : "text-t-prototype"
          )}
        >
          {impl.billedBesked}
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {parPrRute(billeder).map((p) => (
          <li key={p.rute}>
            <code className="font-mono text-xs text-daempet">{p.rute}</code>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {TILSTANDE.map((t) => (
                <Miniature key={t.id} billede={p[t.id]} tekst={t.tekst} onAaben={() => setAaben(p)} />
              ))}
            </div>
          </li>
        ))}
      </ul>
      {aaben && <StortBillede par={aaben} onLuk={() => setAaben(null)} />}
    </div>
  );
}

function Miniature({
  billede,
  tekst,
  onAaben,
}: {
  billede: Skaermbillede | undefined;
  tekst: string;
  onAaben: () => void;
}): Renderable {
  if (!billede) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-md border border-dashed border-kant text-xs text-daempet">
        {tekst}: ikke taget
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onAaben}
      aria-label={`Se ${tekst.toLowerCase()} for ${billede.rute} i fuld størrelse`}
      className="group relative block h-[120px] cursor-pointer overflow-hidden rounded-md border border-kant bg-kort focus-visible:outline-2 focus-visible:outline-accent"
    >
      <img
        src={skaermbilledUrl(billede.id)}
        alt=""
        loading="lazy"
        className="size-full object-cover object-top"
      />
      <span className="absolute bottom-1.5 left-1.5 rounded bg-kort/90 px-1.5 py-0.5 text-xs font-semibold pointer-fine:group-hover:text-accent">
        {tekst}
      </span>
    </button>
  );
}

function StortBillede({ par, onLuk }: { par: Par; onLuk: () => void }): Renderable {
  const [vist, setVist] = useState<SkaermbilledTilstand>(par.efter ? "efter" : "foer");
  const billede = par[vist];
  return (
    <Popup aaben onLuk={onLuk} bredde="bred" etiket={`Før og efter: ${par.rute}`}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-kant px-3.5 pt-2.5">
        <Faner
          etiket="Før eller efter"
          faner={TILSTANDE.filter((t) => par[t.id])}
          aktiv={vist}
          onSkift={setVist}
        />
        <div className="flex items-center gap-3 pb-2">
          <code className="truncate font-mono text-xs text-daempet">{par.rute}</code>
          <button
            type="button"
            onClick={onLuk}
            aria-label="Luk"
            autoFocus
            className="cursor-pointer rounded p-1 text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-tekst"
          >
            <IkonLuk className="size-5" />
          </button>
        </div>
      </header>
      <div className="min-h-0 overflow-y-auto bg-flade">
        {billede && (
          <img
            src={skaermbilledUrl(billede.id)}
            alt={`${vist === "foer" ? "Før" : "Efter"}: ${par.rute}`}
            width={billede.bredde}
            height={billede.hoejde}
            className="block h-auto w-full"
          />
        )}
      </div>
      <p className="shrink-0 border-t border-kant px-3.5 py-2 text-xs text-daempet">
        Før = grenens udgangspunkt · Efter = agentens commit. Siderne er fotograferet med dine data, kun med læseadgang.
      </p>
    </Popup>
  );
}
