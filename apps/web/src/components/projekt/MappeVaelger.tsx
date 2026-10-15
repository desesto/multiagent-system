// Mappevælgeren bag "Gennemse filer". Starter i den sti, der står i
// feltet — eller i roden (PROJEKT_ROD), hvis feltet er tomt eller
// stien ikke kan åbnes. Serveren lister mapperne; browseren må ikke.

import { useCallback, useEffect, useState } from "react";
import type { MappeListe } from "../../../../../packages/domain/src/domain/mappe";
import { hentMapper } from "../../api";
import type { Renderable } from "../../lib/renderable";
import { FejlBesked } from "../FejlBesked";
import { IkonLuk, IkonMappe } from "../Ikoner";
import { Knap } from "../Knapper";
import { Popup } from "../Popup";

const RAEKKE =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[0.9rem] focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:bg-flade";

export function MappeVaelger({
  aaben,
  start,
  onVaelg,
  onLuk,
}: {
  aaben: boolean;
  /** Stien i feltet — tom betyder roden */
  start: string;
  onVaelg: (sti: string) => void;
  onLuk: () => void;
}): Renderable {
  return (
    <Popup aaben={aaben} onLuk={onLuk} bredde="mellem" etiket="Vælg projektmappe">
      {aaben && <Indhold start={start} onVaelg={onVaelg} onLuk={onLuk} />}
    </Popup>
  );
}

function Indhold({
  start,
  onVaelg,
  onLuk,
}: {
  start: string;
  onVaelg: (sti: string) => void;
  onLuk: () => void;
}): Renderable {
  const [liste, setListe] = useState<MappeListe | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);

  const gaaTil = useCallback(async (sti?: string): Promise<void> => {
    setFejl(null);
    try {
      setListe(await hentMapper(sti));
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }, []);

  useEffect(() => {
    // Kan stien i feltet ikke åbnes, startes i roden i stedet
    hentMapper(start.trim() || undefined)
      .then(setListe)
      .catch(() => void gaaTil());
  }, [start, gaaTil]);

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-kant px-3.5 py-2.5">
        <h3 className="text-[0.95rem] font-semibold">Vælg projektmappe</h3>
        <button
          type="button"
          onClick={onLuk}
          aria-label="Luk"
          className="cursor-pointer rounded p-1 text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-tekst"
        >
          <IkonLuk className="size-5" />
        </button>
      </header>

      {liste && (
        <nav aria-label="Placering" className="flex shrink-0 flex-wrap items-center gap-1 px-3.5 pt-2.5 font-mono text-xs">
          {liste.brodkrummer.map((b, i) => (
            <span key={b.sti} className="flex items-center gap-1">
              {i > 0 && <span className="text-daempet">›</span>}
              <button
                type="button"
                onClick={() => void gaaTil(b.sti)}
                className="cursor-pointer rounded px-1 text-daempet pointer-fine:hover:text-accent"
              >
                {b.navn}
              </button>
            </span>
          ))}
        </nav>
      )}

      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {fejl && <div className="px-1.5"><FejlBesked besked={fejl} /></div>}
        {!liste && !fejl && <p className="px-2.5 py-1.5 text-daempet">Henter mapper…</p>}
        {liste && (
          <ul>
            {liste.overmappe && (
              <li>
                <button type="button" className={RAEKKE} onClick={() => void gaaTil(liste.overmappe!)}>
                  <span className="w-4 text-center text-daempet">↑</span>
                  <span className="text-daempet">Op</span>
                </button>
              </li>
            )}
            {liste.mapper.map((m) => (
              <li key={m.sti}>
                <button type="button" className={RAEKKE} onClick={() => void gaaTil(m.sti)}>
                  <IkonMappe className="text-vcs-aendret" />
                  <span className="truncate">{m.navn}</span>
                  {m.erGitRepo && (
                    <span className="ml-auto rounded-full border border-kant px-1.5 font-mono text-[0.7rem] text-daempet">
                      git
                    </span>
                  )}
                </button>
              </li>
            ))}
            {liste.mapper.length === 0 && (
              <li className="px-2.5 py-1.5 text-[0.85rem] text-daempet">Ingen undermapper</li>
            )}
          </ul>
        )}
      </div>

      <footer className="shrink-0 border-t border-kant px-3.5 py-3">
        {liste && (
          <>
            <p className="truncate font-mono text-xs" title={liste.sti}>{liste.sti}</p>
            {!liste.erGitRepo && (
              <p className="mt-1 text-xs text-t-prototype">
                Ikke et git-repo — agenterne kan læse koden, men ikke implementere.
              </p>
            )}
          </>
        )}
        <div className="mt-2.5 flex justify-end gap-2">
          <Knap type="button" onClick={onLuk}>Annullér</Knap>
          <Knap
            type="button"
            variant="primaer"
            disabled={!liste}
            onClick={() => {
              if (!liste) return;
              onVaelg(liste.sti);
              onLuk();
            }}
          >
            Vælg denne mappe
          </Knap>
        </div>
      </footer>
    </>
  );
}
