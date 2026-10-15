// Autokør på projektsiden: sæt opgaver i kø, start og stop køen, og
// følg hver opgave til dens pull request. Køen arbejder én opgave ad
// gangen og stopper ved første fejl. Intet flettes uden dig.

import { useCallback, useEffect, useState } from "react";
import type { AutokoerOversigt } from "../../../../../packages/domain/src/domain/autokoer";
import type { Projekt } from "../../../../../packages/domain/src/domain/projekt";
import { hentAutokoer, startAutokoer, stopAutokoer, tagUdAfKoe } from "../../api";
import type { Renderable } from "../../lib/renderable";
import { FejlBesked } from "../FejlBesked";
import { Knap } from "../Knapper";
import { KoePost } from "./KoePost";
import { VaelgOpgaver } from "./VaelgOpgaver";

const OPDATERINGS_INTERVAL_MS = 3000;

export function AutokoerPanel({ projekt }: { projekt: Projekt }): Renderable {
  const [data, setData] = useState<AutokoerOversigt | null>(null);
  const [vaelger, setVaelger] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  const hent = useCallback(async (): Promise<void> => {
    try {
      setData(await hentAutokoer(projekt.id));
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }, [projekt.id]);

  useEffect(() => {
    void hent();
  }, [hent]);

  const arbejder = Boolean(data?.tilstand.koerer || data?.poster.some((p) => p.status === "koerer"));
  useEffect(() => {
    if (!arbejder) return;
    const timer = setInterval(() => void hent(), OPDATERINGS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [arbejder, hent]);

  async function udfoer(handling: () => Promise<unknown>): Promise<void> {
    setFejl(null);
    try {
      await handling();
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
    await hent();
  }

  if (!data || !projekt.sti || projekt.arkiveretTidspunkt) return null;
  const { tilstand, poster } = data;
  const venter = poster.filter((p) => p.status === "venter").length;
  const aktivHer = poster.some((p) => p.id === tilstand.aktivPostId);

  return (
    <section className="panel mt-7 rounded-[10px] border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[1.05rem] font-semibold">Autokør</h3>
        <span className="text-[0.82rem] text-daempet">
          {tilstand.koerer ? (tilstand.stopper ? "Stopper efter den aktuelle opgave" : "Kører") : "Stoppet"} ·{" "}
          {tilstand.idag}/{tilstand.maxPrDag} i dag
        </span>
      </div>
      <p className="mt-1 text-[0.85rem] text-daempet">
        Opgaverne i køen tages én ad gangen: arkitekten vælger retning (har du valgt, bruges dit valg), Kodey
        implementerer, og der oprettes en pull request på GitHub. Intet flettes uden dig.
      </p>
      {tilstand.koerer && tilstand.aktivPostId && !aktivHer && (
        <p className="mt-2 text-[0.85rem] text-daempet">Køen arbejder lige nu på en opgave i et andet projekt.</p>
      )}
      {!tilstand.koerer && tilstand.stopGrund && (
        <p className="mt-2 text-[0.85rem] text-t-prototype">{tilstand.stopGrund}</p>
      )}

      {poster.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {poster.map((p) => (
            <KoePost key={p.id} post={p} onFjern={() => void udfoer(() => tagUdAfKoe(p.id))} />
          ))}
        </ul>
      )}

      {vaelger ? (
        <VaelgOpgaver
          projektId={projekt.id}
          iKoeen={new Set(poster.filter((p) => p.status === "venter" || p.status === "koerer").map((p) => p.opgaveId))}
          onFaerdig={() => {
            setVaelger(false);
            void hent();
          }}
        />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Knap onClick={() => setVaelger(true)}>Tilføj opgaver</Knap>
          {tilstand.koerer ? (
            <Knap disabled={tilstand.stopper} onClick={() => void udfoer(stopAutokoer)}>
              Stop efter den aktuelle
            </Knap>
          ) : (
            <Knap variant="primaer" disabled={venter === 0} onClick={() => void udfoer(startAutokoer)}>
              Start køen{venter > 0 && ` (${venter})`}
            </Knap>
          )}
        </div>
      )}
      {fejl && <FejlBesked besked={fejl} />}
    </section>
  );
}
