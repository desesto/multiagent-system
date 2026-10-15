// Indstillinger. Første indstilling er temaet; hvert tema vises som et
// lille levende eksempel, tegnet med temaets egne farver (data-tema på
// boksen), så man kan se det, før man vælger det.

import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";
import { TEMAER, useTema, type TemaId } from "../lib/tema";

export function Indstillinger(): Renderable {
  const [tema, vaelgTema] = useTema();
  return (
    <article className="mt-9">
      <h2 className="text-2xl font-semibold">Indstillinger</h2>
      <p className="mt-1 text-[0.9rem] text-daempet">Gemmes i denne browser.</p>

      <section className="mt-7">
        <h3 className="text-[1.05rem] font-semibold" id="tema-overskrift">
          Tema
        </h3>
        <div role="radiogroup" aria-labelledby="tema-overskrift" className="mt-3 grid gap-3.5 sm:grid-cols-2">
          {TEMAER.map((t) => (
            <TemaValg key={t.id} {...t} valgt={t.id === tema} onVaelg={() => vaelgTema(t.id)} />
          ))}
        </div>
      </section>
    </article>
  );
}

function TemaValg({
  id,
  navn,
  beskrivelse,
  valgt,
  onVaelg,
}: {
  id: TemaId;
  navn: string;
  beskrivelse: string;
  valgt: boolean;
  onVaelg: () => void;
}): Renderable {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={valgt}
      onClick={onVaelg}
      className={cn(
        "cursor-pointer rounded-[12px] border-2 p-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        valgt ? "border-accent" : "border-transparent pointer-fine:hover:border-kant"
      )}
    >
      {/* Eksemplet tegnes i temaets egne farver — uafhængigt af det valgte tema */}
      <div data-tema={id} className="pointer-events-none rounded-[8px] p-3.5" aria-hidden="true">
        <p className="font-jetbrains-mono text-lg font-bold">Multiagent</p>
        <div className="panel mt-2.5 rounded-[10px] border px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-t-feature">Ny feature</span>
            <span className="text-[0.75rem] text-daempet">I gang</span>
          </div>
          <p className="mt-1.5 text-[0.9rem] font-semibold text-tekst">Byg login-flow</p>
          <p className="text-[0.8rem] text-daempet">To agenter har fremlagt forslag</p>
          <span className="mt-2.5 inline-block rounded-md bg-accent px-2.5 py-1 text-[0.75rem] font-semibold text-paa-accent">
            Vælg retning
          </span>
        </div>
      </div>
      <p className="mt-2 px-1.5 font-semibold">
        {navn}
        {valgt && <span className="ml-2 text-xs font-normal text-accent">Valgt</span>}
      </p>
      <p className="px-1.5 pb-1 text-[0.85rem] text-daempet">{beskrivelse}</p>
    </button>
  );
}
