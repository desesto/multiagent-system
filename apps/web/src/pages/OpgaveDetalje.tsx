// Detaljesiden: én opgave med hele beslutningshistorikken —
// dit revisionsspor.

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Beslutningspunkt as Punkt } from "../../../../packages/domain/src/domain/opgave";
import type { GemtAgentSvar } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import {
  fortrydValg,
  hentAgentSvarForOpgave,
  hentBeslutningspunkterForOpgave,
  hentOpgave,
  redigerOpgave,
  reevaluer,
  skiftOpgaveStatus,
  sletOpgave,
  startImplementering,
  vaelgMulighed,
} from "../api";
import { Beslutning } from "../components/Beslutning";
import { FejlBesked } from "../components/FejlBesked";
import type { FormularVaerdier } from "../components/opgave/OpgaveFormular";
import { OpgaveHoved } from "../components/opgave/OpgaveHoved";
import { ProjektSti } from "../components/projekt/ProjektSti";
import { OpgaveForbrug } from "../components/opgave/OpgaveForbrug";
import { ImplementeringsSektion } from "../components/implementering/ImplementeringsSektion";
import {
  efterFortryd,
  efterValg,
  medServerPunkt,
  type DetaljeTilstand,
} from "../lib/beslutningsOensker";
import type { Renderable } from "../lib/renderable";
import { useOptimistisk } from "../lib/useOptimistisk";

export function OpgaveDetalje(): Renderable {
  const { id } = useParams<{ id: string }>();
  const [tilstand, setTilstand] = useState<DetaljeTilstand>({ opgave: null, punkter: [] });
  const [{ opgave, punkter }, koerOptimistisk] = useOptimistisk(tilstand);
  const [svar, setSvar] = useState<GemtAgentSvar[]>([]);
  const [indlaeser, setIndlaeser] = useState(true);
  const [fejl, setFejl] = useState<string | null>(null);
  const [handlingsFejl, setHandlingsFejl] = useState<string | null>(null);
  const [implOpdatering, setImplOpdatering] = useState(0);
  const naviger = useNavigate();

  /** Henter opgave, historik og svar — ved indlæsning og efter en ny vurdering */
  const hentAlt = useCallback(async (): Promise<void> => {
    if (!id) return;
    const [o, p, s] = await Promise.all([
      hentOpgave(id),
      hentBeslutningspunkterForOpgave(id),
      hentAgentSvarForOpgave(id),
    ]);
    setTilstand({ opgave: o, punkter: p });
    setSvar(s);
  }, [id]);

  useEffect(() => {
    hentAlt()
      .catch((e: Error) => setFejl(e.message))
      .finally(() => setIndlaeser(false));
  }, [hentAlt]);

  /** Fejl ved en handling vises ved historikken — siden forbliver brugbar */
  function visFejl(e: unknown): void {
    setHandlingsFejl(e instanceof Error ? e.message : "Ukendt fejl");
  }

  async function haandterValgt(punkt: Punkt, mulighedId: string): Promise<void> {
    setHandlingsFejl(null);
    try {
      await koerOptimistisk(efterValg(punkt.id, mulighedId), async () => {
        const fraServer = await vaelgMulighed(punkt.id, mulighedId);
        return () => setTilstand(medServerPunkt(fraServer, "i_gang"));
      });
    } catch (e) {
      visFejl(e);
    }
  }

  async function haandterFortryd(punkt: Punkt): Promise<void> {
    setHandlingsFejl(null);
    try {
      await koerOptimistisk(efterFortryd(punkt.id), async () => {
        const fraServer = await fortrydValg(punkt.id);
        return () => setTilstand(medServerPunkt(fraServer, "afventer_beslutning"));
      });
    } catch (e) {
      visFejl(e);
    }
  }

  /** Afslut eller genåbn — optimistisk, så knappen reagerer med det samme */
  async function skiftStatus(handling: "afslut" | "genaabn"): Promise<void> {
    setHandlingsFejl(null);
    const status = handling === "afslut" ? "afsluttet" : "i_gang";
    try {
      await koerOptimistisk((nu) => ({ ...nu, opgave: nu.opgave && { ...nu.opgave, status } }), async () => {
        const opdateret = await skiftOpgaveStatus(opgave!.id, handling);
        return () => setTilstand((nu) => ({ ...nu, opgave: opdateret }));
      });
    } catch (e) {
      visFejl(e);
    }
  }

  /** Ny vurdering: agenterne kører igen — kan tage op til et halvt minut */
  async function haandterReevaluer(punkt: Punkt): Promise<void> {
    setHandlingsFejl(null);
    try {
      await reevaluer(punkt.id);
      await hentAlt();
    } catch (e) {
      visFejl(e);
    }
  }

  async function haandterImplementer(punkt: Punkt): Promise<void> {
    setHandlingsFejl(null);
    try {
      await startImplementering(punkt.id);
      setImplOpdatering((n) => n + 1); // sektionen henter og følger kørslen
    } catch (e) {
      visFejl(e);
    }
  }

  async function haandterRediger(vaerdier: FormularVaerdier): Promise<void> {
    if (!opgave) return;
    await redigerOpgave(opgave.id, {
      titel: vaerdier.titel,
      beskrivelse: vaerdier.beskrivelse,
      fokuspunkter: vaerdier.fokuspunkter,
      omraade: vaerdier.omraade,
      ...(vaerdier.vedhaeftningIder.length > 0 ? { vedhaeftningIder: vaerdier.vedhaeftningIder } : {}),
    });
    naviger(-1); // tilbage til forrige side efter gem
  }

  async function haandterSlet(): Promise<void> {
    if (!opgave) return;
    try {
      await sletOpgave(opgave.id);
      naviger(opgave.projektId ? `/projekter/${opgave.projektId}` : "/");
    } catch (e) {
      visFejl(e);
    }
  }

  if (indlaeser) return <p className="mt-9 text-daempet">Henter opgaven…</p>;
  if (fejl) return <FejlBesked besked={fejl} />;
  if (!opgave)
    return <p className="mt-9 text-daempet">Opgaven findes ikke.</p>;

  const afsluttet = opgave.status === "afsluttet";

  return (
    <article className="mt-9">
      <ProjektSti projektId={opgave.projektId} />

      <OpgaveHoved
        opgave={opgave}
        onSkiftStatus={skiftStatus}
        onGem={haandterRediger}
        onSlet={haandterSlet}
      />
      <OpgaveForbrug opgaveId={opgave.id} opdatering={implOpdatering + punkter.length} />

      <section className="mt-9">
        <h2 className="mb-3.5 text-[1.05rem] font-semibold">
          Beslutningshistorik{" "}
          <span className="text-sm font-normal text-daempet">
            {punkter.length}
          </span>
        </h2>
        {handlingsFejl && <FejlBesked besked={handlingsFejl} />}
        {punkter.length === 0 ? (
          <p className="text-daempet">Ingen beslutningspunkter endnu.</p>
        ) : (
          punkter.map((p) => (
            <Beslutning
              key={p.id}
              punkt={p}
              svar={svar.filter((s) => s.beslutningspunktId === p.id)}
              onValgt={haandterValgt}
              onFortryd={haandterFortryd}
              onImplementer={opgave.projektSti && !afsluttet ? haandterImplementer : undefined}
              onReevaluer={afsluttet ? undefined : haandterReevaluer}
              medKommentarer
            />
          ))
        )}
      </section>

      <ImplementeringsSektion
        opgaveId={opgave.id}
        kanImplementere={opgave.projektSti !== null}
        opdatering={implOpdatering}
        opgaveAfsluttet={afsluttet}
        onAfslut={() => skiftStatus("afslut")}
      />
    </article>
  );
}
