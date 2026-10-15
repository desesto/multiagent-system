// En agents design-skitse af et løsningsforslag. Vises som et lille
// eksempel på kortet; et klik åbner den i fuld størrelse i en popup.
//
// SIKKERHED: skitsen er HTML skrevet af en AI og vises derfor i en
// iframe med sandbox="" — ingen scripts, ingen formularer, ingen adgang
// til appen. Vores egen CSP-regel øverst blokerer desuden alt netværk,
// så skitsen ikke kan hente noget udefra. Flere CSP-regler gælder samtidig,
// så skitsen kan ikke løsne reglen ved at skrive sin egen.

import { useState } from "react";
import type { Renderable } from "../../lib/renderable";
import { IkonLuk } from "../Ikoner";
import { Popup } from "../Popup";

const CSP =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">`;

function Ramme({ html, titel, className }: { html: string; titel: string; className: string }): Renderable {
  return (
    <iframe
      title={titel}
      sandbox=""
      srcDoc={CSP + html}
      loading="lazy"
      className={className}
    />
  );
}

export function DesignSkitse({ html, titel }: { html: string; titel: string }): Renderable {
  const [aaben, setAaben] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAaben(true)}
        aria-label={`Se designet for: ${titel}`}
        className="group relative block h-[150px] w-full cursor-pointer overflow-hidden rounded-md border border-kant bg-flade text-left focus-visible:outline-2 focus-visible:outline-accent"
      >
        {/* Tegnes i dobbelt bredde og skaleres ned, så det ligner en miniature af en rigtig skærm */}
        <Ramme
          html={html}
          titel={`Miniature: ${titel}`}
          className="pointer-events-none h-[300px] w-[200%] origin-top-left scale-50 border-0"
        />
        <span className="absolute right-1.5 bottom-1.5 rounded bg-kort/90 px-1.5 py-0.5 text-xs text-daempet pointer-fine:group-hover:text-tekst">
          Se design
        </span>
      </button>
      <Popup aaben={aaben} onLuk={() => setAaben(false)} bredde="bred" etiket={`Design: ${titel}`}>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-kant px-3.5 py-2.5">
          <p className="truncate text-[0.9rem] font-semibold">{titel}</p>
          <button
            type="button"
            onClick={() => setAaben(false)}
            aria-label="Luk"
            autoFocus
            className="cursor-pointer rounded p-1 text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-tekst"
          >
            <IkonLuk className="size-5" />
          </button>
        </header>
        <Ramme html={html} titel={`Design: ${titel}`} className="h-[75vh] w-full border-0 bg-white" />
        <p className="shrink-0 border-t border-kant px-3.5 py-2 text-xs text-daempet">
          Skitse tegnet af agenten — den endelige implementering bygges med projektets egne komponenter.
        </p>
      </Popup>
    </>
  );
}
