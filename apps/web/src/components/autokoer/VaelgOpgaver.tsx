// Vælg opgaver til autokør-køen: projektets åbne opgaver med flueben.
// De sættes i kø i den rækkefølge, de står i.

import { useEffect, useState } from "react";
import type { Opgave } from "../../../../../packages/domain/src/domain/opgave";
import { hentOpgaver, saetIKoe } from "../../api";
import type { Renderable } from "../../lib/renderable";
import { STATUS_TEKST } from "../../tekster";
import { FejlBesked } from "../FejlBesked";
import { Knap } from "../Knapper";

export function VaelgOpgaver({
  projektId,
  iKoeen,
  onFaerdig,
}: {
  projektId: string;
  /** Opgaver, der allerede venter eller kører */
  iKoeen: Set<string>;
  onFaerdig: () => void;
}): Renderable {
  const [opgaver, setOpgaver] = useState<Opgave[] | null>(null);
  const [valgte, setValgte] = useState<string[]>([]);
  const [fejl, setFejl] = useState<string | null>(null);
  const [gemmer, setGemmer] = useState(false);

  useEffect(() => {
    hentOpgaver(true, projektId).then(
      (liste) => setOpgaver(liste.filter((o) => !iKoeen.has(o.id))),
      (e: Error) => setFejl(e.message)
    );
    // iKoeen er et nyt Set ved hver render — listen hentes kun én gang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projektId]);

  function skift(id: string): void {
    setValgte((nu) => (nu.includes(id) ? nu.filter((v) => v !== id) : [...nu, id]));
  }

  async function gem(): Promise<void> {
    setGemmer(true);
    setFejl(null);
    try {
      // Rækkefølgen i listen bestemmer rækkefølgen i køen
      await saetIKoe((opgaver ?? []).map((o) => o.id).filter((id) => valgte.includes(id)));
      onFaerdig();
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
      setGemmer(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-kant/70 p-3">
      <p className="mb-2 text-[0.85rem] font-semibold">Vælg opgaver til køen</p>
      {opgaver === null && !fejl && <p className="text-[0.85rem] text-daempet">Henter opgaver…</p>}
      {opgaver?.length === 0 && (
        <p className="text-[0.85rem] text-daempet">Alle åbne opgaver er allerede i køen.</p>
      )}
      <ul className="flex flex-col gap-1">
        {opgaver?.map((o) => (
          <li key={o.id}>
            <label className="flex cursor-pointer items-center gap-2.5 text-[0.88rem]">
              <input
                type="checkbox"
                checked={valgte.includes(o.id)}
                onChange={() => skift(o.id)}
                className="size-4 accent-accent"
              />
              <span className="truncate">{o.titel}</span>
              <span className="shrink-0 text-xs text-daempet">{STATUS_TEKST[o.status]}</span>
            </label>
          </li>
        ))}
      </ul>
      {fejl && <FejlBesked besked={fejl} />}
      <div className="mt-3 flex gap-2">
        <Knap variant="primaer" disabled={valgte.length === 0 || gemmer} onClick={() => void gem()}>
          Sæt i kø{valgte.length > 0 && ` (${valgte.length})`}
        </Knap>
        <Knap onClick={onFaerdig}>Annullér</Knap>
      </div>
    </div>
  );
}
