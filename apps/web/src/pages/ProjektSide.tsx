// Ét projekt: hoved med navn, sti og handlinger, og nedenunder projektets
// opgaver. Et klik på en opgave åbner dens egen side.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Projekt } from "../../../../packages/domain/src/domain/projekt";
import { arkiverProjekt, gendanProjekt, hentProjekt, redigerProjekt, sletProjektPermanent, type ProjektInput } from "../api";
import { FejlBesked } from "../components/FejlBesked";
import { ProjektFormular } from "../components/projekt/ProjektFormular";
import { ProjektHandlinger } from "../components/projekt/ProjektHandlinger";
import type { Renderable } from "../lib/renderable";
import { OpgaveListe } from "./OpgaveListe";
import { AutokoerPanel } from "../components/autokoer/AutokoerPanel";

export function ProjektSide(): Renderable {
  const { id } = useParams<{ id: string }>();
  const [projekt, setProjekt] = useState<Projekt | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const [redigerer, setRedigerer] = useState(false);
  const naviger = useNavigate();

  useEffect(() => {
    if (!id) return;
    setProjekt(null);
    hentProjekt(id)
      .then(setProjekt)
      .catch((e: Error) => setFejl(e.message));
  }, [id]);

  async function haandterGem(vaerdier: ProjektInput): Promise<void> {
    if (!projekt) return;
    setProjekt(await redigerProjekt(projekt.id, vaerdier));
    setRedigerer(false);
  }

  /** Fejl ved en handling vises — siden forbliver brugbar */
  async function udfoer(handling: () => Promise<void>): Promise<void> {
    setFejl(null);
    try {
      await handling();
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }

  if (!projekt) return fejl ? <FejlBesked besked={fejl} /> : <p className="mt-9 text-daempet">Henter projektet…</p>;

  return (
    <article className="mt-9">
      <Link to="/" className="mb-5 inline-block text-[0.9rem] text-daempet pointer-fine:hover:text-tekst">
        ← Alle projekter
      </Link>
      <h2 className="text-2xl font-semibold">{projekt.navn}</h2>
      {projekt.beskrivelse && <p className="mt-1.5 text-[0.9rem] text-daempet">{projekt.beskrivelse}</p>}
      <p className="mt-2 truncate font-mono text-xs text-daempet" title={projekt.sti ?? undefined}>
        {projekt.sti ?? "Ingen sti — tilføj en (Redigér), så agenterne kan læse og ændre koden"}
      </p>
      <ProjektHandlinger
        projekt={projekt}
        redigerer={redigerer}
        onRediger={() => setRedigerer((r) => !r)}
        onArkiver={() => udfoer(async () => setProjekt(await arkiverProjekt(projekt.id)))}
        onGendan={() => udfoer(async () => setProjekt(await gendanProjekt(projekt.id)))}
        onSletPermanent={() =>
          udfoer(async () => {
            await sletProjektPermanent(projekt.id);
            naviger("/");
          })
        }
      />
      {fejl && <FejlBesked besked={fejl} />}
      {redigerer && (
        <ProjektFormular
          start={{ navn: projekt.navn, beskrivelse: projekt.beskrivelse, sti: projekt.sti }}
          overskrift="Redigér projekt"
          submitTekst="Gem ændringer"
          onSubmit={haandterGem}
          onAnnuller={() => setRedigerer(false)}
        />
      )}

      <AutokoerPanel key={`autokoer-${projekt.id}`} projekt={projekt} />

      {/* key: nyt projekt = frisk liste, så intet fra det forrige hænger ved */}
      <OpgaveListe key={projekt.id} projekt={projekt} kanOprette={!projekt.arkiveretTidspunkt} />
    </article>
  );
}
