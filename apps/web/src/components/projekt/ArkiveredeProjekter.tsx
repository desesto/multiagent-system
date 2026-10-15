// Arkiverede projekter nederst på forsiden. Hentes først, når sektionen
// foldes ud. Et klik åbner projektet, hvor det kan gendannes.

import { useState } from "react";
import type { ProjektMedTal } from "../../../../../packages/domain/src/domain/projekt";
import { hentProjekter } from "../../api";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { FejlBesked } from "../FejlBesked";
import { IkonPil } from "../Ikoner";
import { ProjektKort } from "./ProjektKort";

export function ArkiveredeProjekter(): Renderable {
  const [aaben, setAaben] = useState(false);
  const [projekter, setProjekter] = useState<ProjektMedTal[] | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);

  async function skift(): Promise<void> {
    const nu = !aaben;
    setAaben(nu);
    if (!nu || projekter !== null) return;
    try {
      setProjekter(await hentProjekter(true));
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }

  return (
    <section className="mt-8">
      <button
        type="button"
        aria-expanded={aaben}
        onClick={() => void skift()}
        className="flex cursor-pointer items-center gap-1.5 text-[1.05rem] font-semibold pointer-fine:hover:text-accent"
      >
        <IkonPil className={cn("transition-transform", aaben && "rotate-90")} />
        Arkiverede projekter
        {projekter && <span className="text-sm font-normal text-daempet">{projekter.length}</span>}
      </button>
      {aaben && fejl && <FejlBesked besked={fejl} />}
      {aaben && !fejl && (
        projekter === null ? (
          <p className="mt-3 text-daempet">Henter arkiverede projekter…</p>
        ) : projekter.length === 0 ? (
          <p className="mt-3 text-daempet">Ingen arkiverede projekter.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3 opacity-70">
            {projekter.map((p) => (
              <ProjektKort key={p.id} projekt={p} />
            ))}
          </ul>
        )
      )}
    </section>
  );
}
