// Generisk popup til bekræftelser og dialoger. Popup ejer KUN
// visning og lukning — indhold og handlinger kommer udefra.
// Lukkes med klik udenfor eller Escape; siden bagved kan ikke scrolles
// imens. Tegnes i <body> via en portal, så ingen omgivende boks kan
// beskære den.

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Knap } from "./Knapper";
import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";

const BREDDER = {
  /** Bekræftelser og korte dialoger */
  smal: "w-[calc(100%-40px)] max-w-[420px] p-[22px]",
  /** Fx mappevælgeren — mellemstor, indholdet scroller selv */
  mellem: "flex max-h-[80vh] w-[min(560px,calc(100vw-2.5rem))] flex-col overflow-hidden",
  /** Fx kodevisning — fylder det meste af skærmen, indholdet scroller selv */
  bred: "flex max-h-[90vh] w-[min(1280px,calc(100vw-2.5rem))] flex-col overflow-hidden",
};

export function Popup({
  aaben,
  onLuk,
  children,
  bredde = "smal",
  etiket,
}: {
  aaben: boolean;
  onLuk: () => void;
  children: ReactNode;
  bredde?: keyof typeof BREDDER;
  /** Beskrivelse til skærmlæsere */
  etiket?: string;
}): Renderable {
  // Ref, så Escape-lytteren ikke skal registreres forfra ved hver render
  const onLukRef = useRef(onLuk);
  onLukRef.current = onLuk;

  useEffect(() => {
    if (!aaben) return;
    const tast = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onLukRef.current();
    };
    const tidligereOverflow = document.body.style.overflow;
    document.addEventListener("keydown", tast);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tast);
      document.body.style.overflow = tidligereOverflow;
    };
  }, [aaben]);

  if (!aaben) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/55"
      onClick={onLuk}
    >
      <div
        className={cn("rounded-[10px] panel border", BREDDER[bredde])}
        role="dialog"
        aria-modal="true"
        aria-label={etiket}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Færdigpakket bekræftelsesdialog til destruktive handlinger */
export function BekraeftPopup({
  aaben,
  overskrift,
  advarsel,
  bekraeftTekst,
  onBekraeft,
  onLuk,
  variant = "fare",
}: {
  aaben: boolean;
  /** "primaer" til handlinger, der kan fortrydes (fx arkivering) */
  variant?: "fare" | "primaer";
  overskrift: string;
  advarsel?: string;
  bekraeftTekst: string;
  onBekraeft: () => void;
  onLuk: () => void;
}): Renderable {
  return (
    <Popup aaben={aaben} onLuk={onLuk}>
      {advarsel && (
        <p className="mb-2 text-center text-[0.72rem] uppercase tracking-wider text-daempet">
          {advarsel}
        </p>
      )}
      <h3 className="mb-[18px] text-center text-[1.05rem] font-semibold">
        {overskrift}
      </h3>
      <div className="flex justify-center gap-2.5">
        <Knap variant="sekundaer" onClick={onLuk}>
          Annullér
        </Knap>
        <Knap
          variant={variant}
          onClick={() => {
            onLuk();
            onBekraeft();
          }}
        >
          {bekraeftTekst}
        </Knap>
      </div>
    </Popup>
  );
}
