// Ét opgavekort — ren visning, alt via props.
// `afventer` = opgaven er vist optimistisk og findes endnu ikke på
// serveren: ingen link (detaljesiden findes ikke endnu) og en
// "agenterne tænker"-linje i stedet for beslutningen.

import { Link } from "react-router-dom";
import type {
  Opgave,
  Beslutningspunkt as Punkt,
} from "../../../../../packages/domain/src/domain/opgave";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { OMRAADE_TEKST, STATUS_TEKST } from "../../tekster";
import { Beslutning } from "../Beslutning";
import { TypeMaerkat } from "./TypeMaerkat";

export function OpgaveKort({
  opgave,
  aabentPunkt,
  afventer = false,
  onValgt,
}: {
  opgave: Opgave;
  aabentPunkt?: Punkt;
  afventer?: boolean;
  onValgt: (punkt: Punkt, mulighedId: string) => Promise<void>;
}): Renderable {
  return (
    <li
      className={cn(
        "rounded-[10px] px-[18px] py-4",
        afventer
          ? "border border-dashed border-accent/60 bg-kort"
          : "panel border",
        opgave.status === "afsluttet" && "opacity-60"
      )}
      aria-busy={afventer}
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-2.5">
          <TypeMaerkat type={opgave.type} />
          {opgave.omraade && <span className="text-[0.8rem] text-daempet">{OMRAADE_TEKST[opgave.omraade]}</span>}
        </span>
        <span className="text-[0.8rem] text-daempet">
          {afventer ? "Oprettes…" : STATUS_TEKST[opgave.status]}
        </span>
      </div>
      <h3 className="mt-2.5 text-[1.05rem] font-semibold">
        {afventer ? (
          opgave.titel
        ) : (
          <Link to={`/opgaver/${opgave.id}`} className="pointer-fine:hover:text-accent">
            {opgave.titel}
          </Link>
        )}
      </h3>
      {opgave.beskrivelse && (
        <p className="mt-1.5 text-[0.9rem] text-daempet">{opgave.beskrivelse}</p>
      )}
      {opgave.fokuspunkter.length > 0 && (
        <p className="mt-2 text-[0.85rem]">Fokus: {opgave.fokuspunkter.join(" · ")}</p>
      )}
      {afventer && (
        <p className="mt-3 animate-pulse text-[0.85rem] text-accent">
          Agenterne læser og tænker — det kan tage op til et halvt minut…
        </p>
      )}
      {aabentPunkt && <Beslutning punkt={aabentPunkt} onValgt={onValgt} />}
      <p className="mt-2.5 flex justify-between font-mono text-xs text-daempet">
        <time dateTime={opgave.oprettetTidspunkt}>
          {new Date(opgave.oprettetTidspunkt).toLocaleString("da-DK")}
        </time>
        {!afventer && <span className="opacity-70">{opgave.id.slice(0, 8)}</span>}
      </p>
    </li>
  );
}
