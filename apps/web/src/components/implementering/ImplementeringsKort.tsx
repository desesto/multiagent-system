// Én implementering: status, ændrede filer, opsummering, pris og
// vejledning til at gennemse og flette med git. Fletning sker ALTID
// hos brugeren — systemet rører aldrig main.

import { useState } from "react";
import type { Implementering } from "../../../../../packages/domain/src/domain/implementering";
import { cn } from "../../lib/cn";
import { formaterForbrug, formaterPrisMedKroner } from "../../lib/forbrug";
import type { Renderable } from "../../lib/renderable";
import { IMPLEMENTERING_STATUS_FARVE, IMPLEMENTERING_STATUS_TEKST } from "../../tekster";
import { Knap } from "../Knapper";
import { BekraeftPopup } from "../Popup";
import { FilListe } from "./FilListe";
import { FoerEfter } from "./FoerEfter";

export function ImplementeringsKort({
  impl,
  onRyd,
}: {
  impl: Implementering;
  onRyd: (impl: Implementering) => Promise<void>;
}): Renderable {
  const [visPopup, setVisPopup] = useState(false);
  const kanRyddes =
    (impl.status === "klar" || impl.status === "fejlet") && impl.billedStatus !== "tages";
  const meta = [
    new Date(impl.oprettetTidspunkt).toLocaleString("da-DK"),
    formaterPrisMedKroner(impl.prisUsd),
    formaterForbrug(impl.forbrug),
  ].filter(Boolean);

  return (
    <li className="rounded-lg border border-kant bg-flade p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-sm font-semibold",
            IMPLEMENTERING_STATUS_FARVE[impl.status],
            impl.status === "koerer" && "animate-pulse"
          )}
        >
          {IMPLEMENTERING_STATUS_TEKST[impl.status]}
        </span>
        <code className="font-mono text-xs text-daempet">{impl.gren}</code>
      </div>

      {impl.fejl && (
        <p
          className={cn(
            "mt-2 text-[0.85rem]",
            impl.status === "fejlet" ? "text-farelys" : "text-t-prototype"
          )}
        >
          {impl.fejl}
        </p>
      )}

      <FilListe impl={impl} />

      <FoerEfter impl={impl} />

      {impl.opsummering && (
        <details className="mt-2.5">
          <summary className="cursor-pointer text-[0.85rem] text-daempet">
            Agentens opsummering
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-[0.88rem]">{impl.opsummering}</p>
        </details>
      )}

      {impl.prUrl && (
        <p className="mt-2.5 text-[0.85rem]">
          <a href={impl.prUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
            Pull request på GitHub ↗
          </a>{" "}
          <span className="text-daempet">— oprettet af autokør. Gennemse og flet den dér.</span>
        </p>
      )}
      {impl.status === "klar" && <GitVejledning gren={impl.gren} />}
      {impl.status === "flettet" && impl.commitHash && (
        <p className="mt-2.5 font-mono text-xs text-daempet">
          Fortryd i main: git revert {impl.commitHash.slice(0, 8)}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-daempet">{meta.join(" · ")}</p>
        {kanRyddes && <Knap onClick={() => setVisPopup(true)}>Ryd op</Knap>}
      </div>

      <BekraeftPopup
        aaben={visPopup}
        onLuk={() => setVisPopup(false)}
        advarsel={
          impl.status === "klar"
            ? "Har du ikke flettet grenen ind, går agentens arbejde tabt"
            : undefined
        }
        overskrift={`Fjern grenen ${impl.gren} og dens mappe?`}
        bekraeftTekst="Ryd op"
        onBekraeft={() => void onRyd(impl)}
      />
    </li>
  );
}

function GitVejledning({ gren }: { gren: string }): Renderable {
  return (
    <div className="mt-2.5 rounded-md bg-kort p-2.5 text-xs">
      <p className="mb-1 text-daempet">Gennemse og flet selv, fra projektets rod:</p>
      <pre className="overflow-x-auto font-mono text-tekst">
        {`git diff HEAD...${gren}\ngit merge ${gren}`}
      </pre>
      <p className="mt-1 text-daempet">Tryk derefter "Ryd op" for at fjerne grenen og mappen.</p>
    </div>
  );
}
