// Sidehovedet på en opgave: type, status, titel, handlinger og metadata.
// Ejer selv tilstanden for redigering og slet-bekræftelse; selve
// handlingerne udføres af siden via callbacks.

import { useEffect, useState } from "react";
import type { Opgave } from "../../../../../packages/domain/src/domain/opgave";
import type { Vedhaeftning } from "../../../../../packages/domain/src/domain/vedhaeftning";
import { hentOpgavensVedhaeftninger, sletVedhaeftning } from "../../api";
import { BilledGalleri } from "../vedhaeftning/BilledGalleri";
import type { Renderable } from "../../lib/renderable";
import { OMRAADE_TEKST, STATUS_TEKST } from "../../tekster";
import { AfslutKnap, GenaabnKnap, RedigerKnap, SletKnap } from "../Knapper";
import { BekraeftPopup } from "../Popup";
import { OpgaveFormular, type FormularVaerdier } from "./OpgaveFormular";
import { TypeMaerkat } from "./TypeMaerkat";

export function OpgaveHoved({
  opgave,
  onSkiftStatus,
  onGem,
  onSlet,
}: {
  opgave: Opgave;
  onSkiftStatus: (handling: "afslut" | "genaabn") => Promise<void>;
  onGem: (vaerdier: FormularVaerdier) => Promise<void>;
  onSlet: () => Promise<void>;
}): Renderable {
  const [redigerer, setRedigerer] = useState(false);
  const [visSletPopup, setVisSletPopup] = useState(false);
  const afsluttet = opgave.status === "afsluttet";
  const [billeder, setBilleder] = useState<Vedhaeftning[]>([]);

  useEffect(() => {
    let aktuel = true;
    hentOpgavensVedhaeftninger(opgave.id).then(
      (b) => aktuel && setBilleder(b),
      () => aktuel && setBilleder([])
    );
    return () => {
      aktuel = false;
    };
  }, [opgave.id]);

  /** Kun under redigering — billedet forsvinder også for agenterne fremover */
  async function sletBillede(v: Vedhaeftning): Promise<void> {
    await sletVedhaeftning(v.id);
    setBilleder((nu) => nu.filter((b) => b.id !== v.id));
  }

  return (
    <>
      <div className="flex items-center gap-3.5">
        <TypeMaerkat type={opgave.type} />
        {opgave.omraade && <span className="text-[0.8rem] text-daempet">{OMRAADE_TEKST[opgave.omraade]}</span>}
        <span className="text-[0.8rem] text-daempet">{STATUS_TEKST[opgave.status]}</span>
      </div>
      <h2 className="mt-2.5 text-2xl font-semibold">{opgave.titel}</h2>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {afsluttet ? (
          <GenaabnKnap onClick={() => void onSkiftStatus("genaabn")} />
        ) : (
          <AfslutKnap onClick={() => void onSkiftStatus("afslut")} />
        )}
        <RedigerKnap aktiv={redigerer} onClick={() => setRedigerer((r) => !r)} />
        <SletKnap onClick={() => setVisSletPopup(true)} />
      </div>
      <BekraeftPopup
        aaben={visSletPopup}
        onLuk={() => setVisSletPopup(false)}
        advarsel="Opgaven forsvinder fra listen — historikken bevares i databasen"
        overskrift={`Er du sikker på, at du vil slette "${opgave.titel}"?`}
        bekraeftTekst="Slet opgave"
        onBekraeft={() => void onSlet()}
      />
      {redigerer && (
        <OpgaveFormular
          start={{
            titel: opgave.titel,
            beskrivelse: opgave.beskrivelse,
            type: opgave.type,
            omraade: opgave.omraade,
            fokuspunkter: opgave.fokuspunkter,
          }}
          laasType
          optagneBilleder={billeder.length}
          overskrift="Redigér opgave"
          submitTekst="Gem ændringer"
          gemmerTekst="Gemmer…"
          onSubmit={onGem}
        />
      )}
      {opgave.beskrivelse && <p className="mt-1.5 text-[0.9rem] text-daempet">{opgave.beskrivelse}</p>}
      <BilledGalleri billeder={billeder} onSlet={redigerer ? (v) => void sletBillede(v) : undefined} />
      {opgave.fokuspunkter.length > 0 && (
        <p className="mt-2 text-[0.85rem]">Fokus: {opgave.fokuspunkter.join(" · ")}</p>
      )}
      {opgave.projektSti && (
        <p className="mt-2 truncate font-mono text-xs text-daempet" title={opgave.projektSti}>
          Projekt: {opgave.projektSti}
        </p>
      )}
      <p className="mt-2.5 flex justify-between font-mono text-xs text-daempet">
        <span>Oprettet {new Date(opgave.oprettetTidspunkt).toLocaleString("da-DK")}</span>
        <span className="opacity-70">{opgave.id.slice(0, 8)}</span>
      </p>
    </>
  );
}
