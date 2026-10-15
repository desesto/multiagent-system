// Container for en opgaves implementeringer. Henter selv sine data og
// spørger serveren hvert 3. sekund — men KUN mens en agent arbejder
// eller før/efter-billederne tages.

import { useCallback, useEffect, useState } from "react";
import type { Implementering } from "../../../../../packages/domain/src/domain/implementering";
import { hentImplementeringer, rydImplementering } from "../../api";
import type { Renderable } from "../../lib/renderable";
import { FejlBesked } from "../FejlBesked";
import { ImplementeringsKort } from "./ImplementeringsKort";
import { AfslutKnap } from "../Knapper";

const OPDATERINGS_INTERVAL_MS = 3000;

export function ImplementeringsSektion({
  opgaveId,
  kanImplementere,
  opdatering,
  opgaveAfsluttet,
  onAfslut,
}: {
  opgaveId: string;
  /** false = opgaven har ingen projektsti */
  kanImplementere: boolean;
  /** Tælles op af siden, når en ny implementering er startet */
  opdatering: number;
  opgaveAfsluttet: boolean;
  onAfslut: () => Promise<void>;
}): Renderable {
  const [liste, setListe] = useState<Implementering[]>([]);
  const [fejl, setFejl] = useState<string | null>(null);

  const hent = useCallback(async (): Promise<void> => {
    try {
      setListe(await hentImplementeringer(opgaveId));
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }, [opgaveId]);

  useEffect(() => {
    void hent();
  }, [hent, opdatering]);

  const serverArbejder = liste.some((i) => i.status === "koerer" || i.billedStatus === "tages");
  useEffect(() => {
    if (!serverArbejder) return;
    const timer = setInterval(() => void hent(), OPDATERINGS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [serverArbejder, hent]);

  async function haandterRyd(impl: Implementering): Promise<void> {
    try {
      const opdateret = await rydImplementering(impl.id);
      setListe((nu) => nu.map((i) => (i.id === opdateret.id ? opdateret : i)));
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }

  return (
    <section className="mt-9">
      <h2 className="mb-3.5 text-[1.05rem] font-semibold">
        Implementeringer{" "}
        <span className="text-sm font-normal text-daempet">{liste.length}</span>
      </h2>
      {fejl && <FejlBesked besked={fejl} />}
      {!opgaveAfsluttet && liste.some((i) => i.status === "flettet") && (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-t-feature/40 bg-flade p-3.5">
          <p className="text-[0.9rem]">En implementering er flettet ind. Er opgaven færdig?</p>
          <AfslutKnap onClick={() => void onAfslut()} />
        </div>
      )}
      {liste.length === 0 ? (
        <p className="text-[0.9rem] text-daempet">
          {kanImplementere
            ? "Vælg en retning i historikken ovenfor, og tryk Implementér. Agenten skriver koden på sin egen git-gren."
            : "Tilføj en projektsti (Redigér), så agenten kan implementere den valgte retning."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {liste.map((i) => (
            <ImplementeringsKort key={i.id} impl={i} onRyd={haandterRyd} />
          ))}
        </ul>
      )}
    </section>
  );
}
