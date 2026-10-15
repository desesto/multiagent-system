// Handlinger på et projekt. Et aktivt projekt kan redigeres og arkiveres;
// et arkiveret kan gendannes eller — som et bevidst ekstra skridt —
// slettes permanent.

import { useState } from "react";
import type { Projekt } from "../../../../../packages/domain/src/domain/projekt";
import type { Renderable } from "../../lib/renderable";
import { Knap, RedigerKnap } from "../Knapper";
import { BekraeftPopup } from "../Popup";

export function ProjektHandlinger({
  projekt,
  redigerer,
  onRediger,
  onArkiver,
  onGendan,
  onSletPermanent,
}: {
  projekt: Projekt;
  redigerer: boolean;
  onRediger: () => void;
  onArkiver: () => Promise<void>;
  onGendan: () => Promise<void>;
  onSletPermanent: () => Promise<void>;
}): Renderable {
  const [popup, setPopup] = useState<"arkiver" | "slet" | null>(null);

  if (projekt.arkiveretTidspunkt) {
    return (
      <div className="mt-3.5 rounded-lg border border-t-prototype/50 bg-flade p-3.5">
        <p className="text-[0.9rem]">
          Projektet er arkiveret {new Date(projekt.arkiveretTidspunkt).toLocaleDateString("da-DK")} og vises ikke i
          oversigten. Opgaverne og historikken er bevaret.
        </p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <Knap variant="primaer" onClick={() => void onGendan()}>
            Gendan projekt
          </Knap>
          <Knap variant="fare" onClick={() => setPopup("slet")}>
            Slet permanent
          </Knap>
        </div>
        <BekraeftPopup
          aaben={popup === "slet"}
          onLuk={() => setPopup(null)}
          advarsel="Kan ikke fortrydes — opgaver, beslutninger, kommentarer og implementeringer slettes"
          overskrift={`Slet "${projekt.navn}" og al dets historik for altid?`}
          bekraeftTekst="Slet permanent"
          onBekraeft={() => void onSletPermanent()}
        />
      </div>
    );
  }

  return (
    <div className="mt-3.5 flex flex-wrap gap-2.5">
      <RedigerKnap aktiv={redigerer} onClick={onRediger} />
      <Knap onClick={() => setPopup("arkiver")}>Arkivér projekt</Knap>
      <BekraeftPopup
        aaben={popup === "arkiver"}
        onLuk={() => setPopup(null)}
        variant="primaer"
        advarsel="Kan gendannes — find det under Arkiverede projekter"
        overskrift={`Fjern "${projekt.navn}" fra oversigten?`}
        bekraeftTekst="Arkivér"
        onBekraeft={() => void onArkiver()}
      />
    </div>
  );
}
