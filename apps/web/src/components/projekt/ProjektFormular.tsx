// Formular til oprettelse og redigering af et projekt.

import { useState, type FormEvent } from "react";
import type { ProjektInput } from "../../api";
import type { Renderable } from "../../lib/renderable";
import { FejlBesked } from "../FejlBesked";
import { Knap } from "../Knapper";
import { StiFelt } from "./StiFelt";

const FELT =
  "rounded-md border border-kant bg-flade px-3 py-2 text-[0.95rem] text-tekst " +
  "focus-visible:outline-2 focus-visible:outline-accent";
const ETIKET = "flex flex-col gap-1.5 text-[0.85rem] text-daempet";

export function ProjektFormular({
  start,
  overskrift,
  submitTekst,
  onSubmit,
  onAnnuller,
}: {
  start?: ProjektInput;
  overskrift: string;
  submitTekst: string;
  onSubmit: (vaerdier: ProjektInput) => Promise<void>;
  onAnnuller?: () => void;
}): Renderable {
  const [navn, setNavn] = useState(start?.navn ?? "");
  const [beskrivelse, setBeskrivelse] = useState(start?.beskrivelse ?? "");
  const [sti, setSti] = useState(start?.sti ?? "");
  const [gemmer, setGemmer] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  async function haandterSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setGemmer(true);
    setFejl(null);
    try {
      await onSubmit({ navn: navn.trim(), beskrivelse, sti: sti.trim() || null });
      if (!start) {
        setNavn("");
        setBeskrivelse("");
        setSti("");
      }
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      setGemmer(false);
    }
  }

  return (
    <form
      className="mt-6 flex flex-col gap-3.5 rounded-[10px] panel border p-5"
      onSubmit={haandterSubmit}
    >
      <h2 className="text-[1.05rem] font-semibold">{overskrift}</h2>
      <label className={ETIKET}>
        Navn
        <input className={FELT} value={navn} onChange={(e) => setNavn(e.target.value)} required placeholder="Fx: Multiagent" />
      </label>
      <StiFelt
        etiket="Sti til koden (valgfri — giver agenterne adgang til projektets filer)"
        vaerdi={sti}
        onSkift={setSti}
        feltKlasse={FELT}
        etiketKlasse={ETIKET}
      />
      <label className={ETIKET}>
        Beskrivelse og formål
        <textarea
          className={FELT}
          value={beskrivelse}
          onChange={(e) => setBeskrivelse(e.target.value)}
          rows={2}
          placeholder="Hvad er projektet, og hvem er det til?"
        />
      </label>
      {fejl && <FejlBesked besked={fejl} />}
      <div className="flex gap-2">
        <Knap variant="primaer" type="submit" disabled={gemmer || navn.trim() === ""}>
          {gemmer ? "Gemmer…" : submitTekst}
        </Knap>
        {onAnnuller && (
          <Knap type="button" onClick={onAnnuller}>
            Annullér
          </Knap>
        )}
      </div>
    </form>
  );
}
