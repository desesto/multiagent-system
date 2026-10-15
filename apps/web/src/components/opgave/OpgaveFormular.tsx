// Én formular, to jobs: oprettelse (projektsiden) og redigering
// (detaljesiden). Typen kan låses ved redigering — den styrer processen.
// Stien vælges ikke her: opgaven arver den fra sit projekt.

import { useId, useState } from "react";
import type { FormEvent } from "react";
import type { OpgaveOmraade, OpgaveType } from "../../../../../packages/domain/src/domain/opgave";
import { OMRAADE_TEKST, TYPE_TEKST } from "../../tekster";
import { Knap } from "../Knapper";
import { FejlBesked } from "../FejlBesked";
import type { Renderable } from "../../lib/renderable";
import { useVedhaeftninger } from "../../lib/useVedhaeftninger";
import { TekstfeltMedBilleder } from "../vedhaeftning/TekstfeltMedBilleder";

export interface FormularVaerdier {
  titel: string;
  beskrivelse: string;
  type: OpgaveType;
  /** null = ikke angivet */
  omraade: OpgaveOmraade | null;
  fokuspunkter: string[];
  /** Nye billeder til beskrivelsen — allerede uploadet */
  vedhaeftningIder: string[];
}

const FELT =
  "rounded-md border border-kant bg-flade px-3 py-2 text-[0.95rem] text-tekst " +
  "focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60";
const ETIKET = "flex flex-col gap-1.5 text-[0.85rem] text-daempet";

export function OpgaveFormular({
  start,
  laasType = false,
  optagneBilleder = 0,
  overskrift,
  submitTekst,
  gemmerTekst,
  onSubmit,
}: {
  start?: Omit<FormularVaerdier, "vedhaeftningIder">;
  /** Ved redigering: antal billeder, opgaven allerede har */
  optagneBilleder?: number;
  laasType?: boolean;
  overskrift: string;
  submitTekst: string;
  gemmerTekst: string;
  onSubmit: (vaerdier: FormularVaerdier) => Promise<void>;
}): Renderable {
  const [titel, setTitel] = useState(start?.titel ?? "");
  const [beskrivelse, setBeskrivelse] = useState(start?.beskrivelse ?? "");
  const [type, setType] = useState<OpgaveType>(start?.type ?? "prototype");
  const [omraade, setOmraade] = useState<OpgaveOmraade | "">(start?.omraade ?? "");
  const [fokuspunkter, setFokuspunkter] = useState(
    start?.fokuspunkter.join(", ") ?? ""
  );
  const [gemmer, setGemmer] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const billeder = useVedhaeftninger(optagneBilleder);
  const beskrivelseId = useId();

  async function haandterSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setGemmer(true);
    setFejl(null);
    try {
      await onSubmit({
        titel,
        beskrivelse,
        type,
        omraade: omraade || null,
        fokuspunkter: fokuspunkter
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        vedhaeftningIder: billeder.ider,
      });
      billeder.nulstil();
      if (!start) {
        setTitel("");
        setBeskrivelse("");
        setFokuspunkter("");
        setOmraade("");
      }
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      setGemmer(false);
    }
  }

  return (
    <form
      className="mt-9 flex flex-col gap-3.5 rounded-[10px] panel border p-5"
      onSubmit={haandterSubmit}
    >
      <h2 className="text-[1.05rem] font-semibold">{overskrift}</h2>
      <label className={ETIKET}>
        Titel
        <input
          className={FELT}
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          required
          placeholder="Fx: Byg login-flow"
        />
      </label>
      <div className={ETIKET}>
        <label htmlFor={beskrivelseId}>
          Beskrivelse <span className="text-xs">(+ eller Ctrl+V vedhæfter billeder, som agenterne kan se)</span>
        </label>
        <TekstfeltMedBilleder
          id={beskrivelseId}
          className={FELT}
          value={beskrivelse}
          onChange={setBeskrivelse}
          rows={3}
          placeholder="Hvad skal agenterne vide om opgaven?"
          billeder={billeder}
        />
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        <label className={ETIKET}>
          <span>
            Type{" "}
            {laasType && (
              <span className="text-xs">(låst — styrer processen)</span>
            )}
          </span>
          <select
            className={FELT}
            value={type}
            onChange={(e) => setType(e.target.value as OpgaveType)}
            disabled={laasType}
          >
            {Object.entries(TYPE_TEKST).map(([vaerdi, tekst]) => (
              <option key={vaerdi} value={vaerdi}>
                {tekst}
              </option>
            ))}
          </select>
        </label>
        <label className={ETIKET}>
          <span>
            Område <span className="text-xs">(frontend og fuldstack får design-skitser)</span>
          </span>
          <select
            className={FELT}
            value={omraade}
            onChange={(e) => setOmraade(e.target.value as OpgaveOmraade | "")}
          >
            <option value="">Ikke angivet</option>
            {Object.entries(OMRAADE_TEKST).map(([vaerdi, tekst]) => (
              <option key={vaerdi} value={vaerdi}>
                {tekst}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={ETIKET}>
        Fokuspunkter (kommasepareret)
        <input
          className={FELT}
          value={fokuspunkter}
          onChange={(e) => setFokuspunkter(e.target.value)}
          placeholder="sikkerhed, genbrugelighed"
        />
      </label>
      {fejl && <FejlBesked besked={fejl} />}
      <Knap
        variant="primaer"
        type="submit"
        className="self-start"
        disabled={gemmer || titel.trim() === "" || billeder.uploader}
      >
        {gemmer ? gemmerTekst : submitTekst}
      </Knap>
    </form>
  );
}
