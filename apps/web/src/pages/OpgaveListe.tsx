// Container for ét projekts opgaver: ejer data og handlere, delegerer AL
// visning til komponenter. Vises på projektsiden.
// Opret og vælg er OPTIMISTISKE: ønsket vises med det samme, og fejler
// serveren, falder listen selv tilbage (se lib/useOptimistisk.ts).
// Afsluttede opgaver hentes lazy — kun når brugeren klikker sektionen op.

import { useEffect, useState } from "react";
import type {
  Opgave,
  Beslutningspunkt as Punkt,
} from "../../../../packages/domain/src/domain/opgave";
import type { Projekt } from "../../../../packages/domain/src/domain/projekt";
import {
  DEV_BRUGER_ID,
  hentAabneBeslutningspunkter,
  hentOpgaver,
  opretOpgave,
  vaelgMulighed,
} from "../api";
import { FejlBesked } from "../components/FejlBesked";
import { IkonPil } from "../components/Ikoner";
import { OpgaveFormular, type FormularVaerdier } from "../components/opgave/OpgaveFormular";
import { OpgaveKort } from "../components/opgave/OpgaveKort";
import { TomOpgaveListe } from "../components/opgave/TomOpgaveListe";
import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";
import { useOptimistisk } from "../lib/useOptimistisk";

/** Samlet tilstand, så ét ønske kan beskrive hele sluttilstanden */
interface ListeTilstand {
  opgaver: Opgave[];
  punkter: Punkt[];
}

/** Optimistiske opgaver har et id, serveren aldrig ville give */
const OPTIMISTISK = "optimistisk-";

export function OpgaveListe({
  projekt,
  kanOprette = true,
}: {
  projekt: Projekt;
  /** false for arkiverede projekter — de kan kun læses */
  kanOprette?: boolean;
}): Renderable {
  const [tilstand, setTilstand] = useState<ListeTilstand>({ opgaver: [], punkter: [] });
  const [vist, koerOptimistisk] = useOptimistisk(tilstand);
  const [indlaeser, setIndlaeser] = useState(true);
  const [fejl, setFejl] = useState<string | null>(null);

  // Afsluttede opgaver hentes kun on-demand
  const [afsluttedeOpgaver, setAfsluttedeOpgaver] = useState<Opgave[] | null>(null);
  const [visAfsluttede, setVisAfsluttede] = useState(false);
  const [henterAfsluttede, setHenterAfsluttede] = useState(false);

  useEffect(() => {
    Promise.all([hentOpgaver(true, projekt.id), hentAabneBeslutningspunkter()])
      .then(([opgaver, punkter]) => setTilstand({ opgaver, punkter }))
      .catch((e: Error) => setFejl(e.message))
      .finally(() => setIndlaeser(false));
  }, [projekt.id]);

  /** Ønsket: listen MED den nye opgave øverst — mens agenterne tænker */
  function haandterOpret(vaerdier: FormularVaerdier): Promise<void> {
    const pladsholder: Opgave = {
      ...vaerdier,
      projektId: projekt.id,
      projektSti: projekt.sti,
      id: OPTIMISTISK + crypto.randomUUID(),
      status: "oprettet",
      oprettetAfBrugerId: DEV_BRUGER_ID,
      oprettetTidspunkt: new Date().toISOString(),
    };
    return koerOptimistisk(
      (nu) => ({ ...nu, opgaver: [pladsholder, ...nu.opgaver] }),
      async () => {
        const ny = await opretOpgave({ ...vaerdier, projektId: projekt.id });
        const punkter = await hentAabneBeslutningspunkter();
        return () => setTilstand((nu) => ({ opgaver: [ny, ...nu.opgaver], punkter }));
      }
    );
    // Fejl afviser promiset → OpgaveFormular viser den ved knappen
  }

  /** Ønsket: punktet er væk, og opgaven er i gang */
  async function haandterValgt(punkt: Punkt, mulighedId: string): Promise<void> {
    const efterValg = (nu: ListeTilstand): ListeTilstand => ({
      punkter: nu.punkter.filter((p) => p.id !== punkt.id),
      opgaver: nu.opgaver.map((o) =>
        o.id === punkt.opgaveId ? { ...o, status: "i_gang" } : o
      ),
    });
    try {
      await koerOptimistisk(efterValg, async () => {
        await vaelgMulighed(punkt.id, mulighedId);
        return () => setTilstand(efterValg);
      });
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }

  async function haandterToggleAfsluttede(): Promise<void> {
    const nyTilstand = !visAfsluttede;
    setVisAfsluttede(nyTilstand);
    if (!nyTilstand || afsluttedeOpgaver !== null) return;
    setHenterAfsluttede(true);
    try {
      const alle = await hentOpgaver(false, projekt.id);
      setAfsluttedeOpgaver(alle.filter((o) => o.status === "afsluttet"));
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      setHenterAfsluttede(false);
    }
  }

  return (
    <>
      {kanOprette && (
        <OpgaveFormular
          overskrift="Opret opgave"
          submitTekst="Opret opgave"
          gemmerTekst="Agenterne tænker…"
          onSubmit={haandterOpret}
        />
      )}

      {fejl && <FejlBesked besked={fejl} />}

      <section className="mt-9">
        <h2 className="mb-3.5 text-[1.05rem] font-semibold">
          Opgaver{" "}
          <span className="text-sm font-normal text-daempet">
            {indlaeser ? "…" : vist.opgaver.length}
          </span>
        </h2>
        {indlaeser ? (
          <p className="text-daempet">Henter opgaver…</p>
        ) : vist.opgaver.length === 0 ? (
          <TomOpgaveListe />
        ) : (
          <ul className="flex flex-col gap-3">
            {vist.opgaver.map((o) => (
              <OpgaveKort
                key={o.id}
                opgave={o}
                afventer={o.id.startsWith(OPTIMISTISK)}
                aabentPunkt={vist.punkter.find((p) => p.opgaveId === o.id)}
                onValgt={haandterValgt}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <button
          type="button"
          onClick={() => void haandterToggleAfsluttede()}
          className="flex items-center gap-1.5 text-[1.05rem] font-semibold pointer-fine:hover:text-accent"
        >
          <IkonPil
            className={cn("transition-transform", visAfsluttede && "rotate-90")}
          />
          Afsluttede opgaver
          {afsluttedeOpgaver !== null && (
            <span className="text-sm font-normal text-daempet">
              {afsluttedeOpgaver.length}
            </span>
          )}
        </button>
        {visAfsluttede && (
          henterAfsluttede ? (
            <p className="mt-3 text-daempet">Henter afsluttede opgaver…</p>
          ) : afsluttedeOpgaver && afsluttedeOpgaver.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {afsluttedeOpgaver.map((o) => (
                <OpgaveKort
                  key={o.id}
                  opgave={o}
                  onValgt={haandterValgt}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-daempet">Ingen afsluttede opgaver.</p>
          )
        )}
      </section>
    </>
  );
}
