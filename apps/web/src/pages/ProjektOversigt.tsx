// Forsiden: alle projekter. Et klik på et projekt viser dets opgaver.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProjektMedTal } from "../../../../packages/domain/src/domain/projekt";
import { hentProjekter, opretProjekt, type ProjektInput } from "../api";
import { FejlBesked } from "../components/FejlBesked";
import { Knap } from "../components/Knapper";
import { ProjektFormular } from "../components/projekt/ProjektFormular";
import { ProjektKort } from "../components/projekt/ProjektKort";
import { ArkiveredeProjekter } from "../components/projekt/ArkiveredeProjekter";
import type { Renderable } from "../lib/renderable";

export function ProjektOversigt(): Renderable {
  const [projekter, setProjekter] = useState<ProjektMedTal[] | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const [opretter, setOpretter] = useState(false);
  const naviger = useNavigate();

  useEffect(() => {
    hentProjekter()
      .then(setProjekter)
      .catch((e: Error) => setFejl(e.message));
  }, []);

  /** Et nyt projekt åbnes med det samme, så man kan oprette dets første opgave */
  async function haandterOpret(vaerdier: ProjektInput): Promise<void> {
    const nyt = await opretProjekt(vaerdier);
    naviger(`/projekter/${nyt.id}`);
  }

  const tomt = projekter !== null && projekter.length === 0;

  return (
    <article className="mt-9">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">
          Projekter{" "}
          {projekter && <span className="text-sm font-normal text-daempet">{projekter.length}</span>}
        </h2>
        {!opretter && !tomt && (
          <Knap variant="primaer" onClick={() => setOpretter(true)}>
            Nyt projekt
          </Knap>
        )}
      </div>

      {(opretter || tomt) && (
        <ProjektFormular
          overskrift={tomt ? "Opret dit første projekt" : "Nyt projekt"}
          submitTekst="Opret projekt"
          onSubmit={haandterOpret}
          onAnnuller={tomt ? undefined : () => setOpretter(false)}
        />
      )}

      {fejl && <FejlBesked besked={fejl} />}
      {projekter === null && !fejl && <p className="mt-6 text-daempet">Henter projekter…</p>}
      {projekter && projekter.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {projekter.map((p) => (
            <ProjektKort key={p.id} projekt={p} />
          ))}
        </ul>
      )}
      <ArkiveredeProjekter />
    </article>
  );
}
