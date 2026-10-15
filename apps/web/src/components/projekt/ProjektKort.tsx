// Ét projekt i oversigten. Hele kortet er et link til projektets opgaver.

import { Link } from "react-router-dom";
import type { ProjektMedTal } from "../../../../../packages/domain/src/domain/projekt";
import type { Renderable } from "../../lib/renderable";
import { IkonMappe } from "../Ikoner";

export function ProjektKort({ projekt }: { projekt: ProjektMedTal }): Renderable {
  const seneste = projekt.senesteAktivitet ?? projekt.oprettetTidspunkt;
  return (
    <li>
      <Link
        to={`/projekter/${projekt.id}`}
        className="panel block rounded-[10px] border px-[18px] py-4 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold">
            <IkonMappe className="text-vcs-aendret" />
            {projekt.navn}
          </h3>
          <span className="shrink-0 text-[0.8rem] text-daempet">
            {projekt.aktiveOpgaver} aktive · {projekt.antalOpgaver} i alt
          </span>
        </div>
        {projekt.beskrivelse && <p className="mt-1.5 text-[0.9rem] text-daempet">{projekt.beskrivelse}</p>}
        <p className="mt-2.5 flex justify-between gap-3 font-mono text-xs text-daempet">
          <span className="truncate" title={projekt.sti ?? undefined}>
            {projekt.sti ?? "Ingen sti — agenterne kan ikke læse kode"}
          </span>
          <time className="shrink-0" dateTime={seneste}>
            {new Date(seneste).toLocaleDateString("da-DK")}
          </time>
        </p>
      </Link>
    </li>
  );
}
