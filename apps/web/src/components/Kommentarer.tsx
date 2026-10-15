// Brugerens kommentarer til et beslutningspunkt. Sendes med til agenterne
// ved implementering og ved en ny vurdering. Ejer selv sin liste og
// taler selv med serveren.

import { useState, type KeyboardEvent } from "react";
import type { Kommentar } from "../../../../packages/domain/src/domain/kommentar";
import { sletKommentar, tilfoejKommentar } from "../api";
import type { Renderable } from "../lib/renderable";
import { FejlBesked } from "./FejlBesked";
import { IkonLuk } from "./Ikoner";
import { Knap, ReevaluerKnap } from "./Knapper";
import { useVedhaeftninger } from "../lib/useVedhaeftninger";
import { BilledGalleri } from "./vedhaeftning/BilledGalleri";
import { TekstfeltMedBilleder } from "./vedhaeftning/TekstfeltMedBilleder";

export function Kommentarer({
  punktId,
  start,
  laast,
  onReevaluer,
}: {
  punktId: string;
  start: Kommentar[];
  /** Erstattede punkter og afsluttede opgaver kan kun læses */
  laast: boolean;
  onReevaluer?: () => Promise<void>;
}): Renderable {
  const [liste, setListe] = useState(start);
  const [tekst, setTekst] = useState("");
  const [arbejder, setArbejder] = useState<"gemmer" | "vurderer" | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const billeder = useVedhaeftninger();

  async function tilfoej(): Promise<boolean> {
    if (!tekst.trim()) return true;
    if (billeder.uploader) {
      setFejl("Vent, til billederne er uploadet");
      return false;
    }
    setArbejder("gemmer");
    setFejl(null);
    try {
      const ny = await tilfoejKommentar(punktId, tekst.trim(), billeder.ider);
      setListe((nu) => [...nu, ny]);
      setTekst("");
      billeder.nulstil();
      return true;
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
      return false;
    } finally {
      setArbejder(null);
    }
  }

  async function slet(k: Kommentar): Promise<void> {
    try {
      await sletKommentar(k.id);
      setListe((nu) => nu.filter((x) => x.id !== k.id));
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }

  /** Det, der står i feltet, gemmes først, så intet går tabt */
  async function vurderIgen(): Promise<void> {
    if (!onReevaluer || !(await tilfoej())) return;
    setArbejder("vurderer");
    try {
      await onReevaluer();
    } finally {
      setArbejder(null);
    }
  }

  function tast(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void tilfoej();
  }

  if (laast && liste.length === 0) return null;
  return (
    <div className="mt-3 border-t border-kant pt-3">
      <p className="mb-1.5 text-[0.85rem] font-semibold">
        Dine kommentarer <span className="font-normal text-daempet">{liste.length}</span>
      </p>
      {liste.length === 0 && (
        <p className="text-xs text-daempet">
          Skriv ønsker eller rettelser. De sendes med, når der implementeres, og bruges, hvis du beder om en ny vurdering.
        </p>
      )}
      <ul className="space-y-1.5">
        {liste.map((k) => (
          <li key={k.id} className="flex items-start justify-between gap-2 rounded-md bg-kort px-2.5 py-1.5 text-[0.85rem]">
            <div className="min-w-0">
              <span className="whitespace-pre-wrap">{k.tekst}</span>
              <BilledGalleri billeder={k.vedhaeftninger ?? []} stoerrelse="size-14" />
            </div>
            {!laast && (
              <button
                type="button"
                aria-label="Slet kommentar"
                onClick={() => void slet(k)}
                className="shrink-0 cursor-pointer rounded p-0.5 text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-farelys"
              >
                <IkonLuk className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!laast && (
        <>
          <div className="mt-2">
            <TekstfeltMedBilleder
              value={tekst}
              onChange={setTekst}
              onKeyDown={tast}
              rows={2}
              placeholder="Fx: Brug Tailwind og ingen nye pakker (Ctrl+Enter tilføjer, + eller Ctrl+V vedhæfter billeder)"
              className="rounded-md border border-kant bg-flade px-3 py-2 text-[0.9rem] text-tekst focus-visible:outline-2 focus-visible:outline-accent"
              billeder={billeder}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Knap disabled={!tekst.trim() || arbejder !== null || billeder.uploader} onClick={() => void tilfoej()}>
              Tilføj kommentar
            </Knap>
            {onReevaluer && (
              <ReevaluerKnap
                vurderer={arbejder === "vurderer"}
                disabled={(liste.length === 0 && !tekst.trim()) || arbejder !== null}
                onClick={() => void vurderIgen()}
              />
            )}
          </div>
          {arbejder === "vurderer" && (
            <p className="mt-2 animate-pulse text-[0.85rem] text-accent">
              Agenterne vurderer forslaget igen — det kan tage op til et halvt minut…
            </p>
          )}
        </>
      )}
      {fejl && <FejlBesked besked={fejl} />}
    </div>
  );
}
