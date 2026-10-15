// Et tekstfelt med et "+" i højre side til at vedhæfte billeder. Billeder
// kan også sættes ind direkte med Ctrl+V (fx et skærmbillede) eller
// trækkes ind i feltet. De ventende billeder vises som miniaturer under feltet.

import { useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import type { Vedhaeftninger } from "../../lib/useVedhaeftninger";
import { IkonLuk, IkonPlus } from "../Ikoner";

const TYPER = "image/png,image/jpeg,image/gif,image/webp";

function billedFiler(liste: FileList | null | undefined): File[] {
  return [...(liste ?? [])].filter((f) => f.type.startsWith("image/"));
}

export function TekstfeltMedBilleder({
  id,
  value,
  onChange,
  onKeyDown,
  rows,
  placeholder,
  className,
  billeder,
}: {
  id?: string;
  value: string;
  onChange: (tekst: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  rows: number;
  placeholder: string;
  /** Feltets egen stil — kanten, baggrunden osv. */
  className: string;
  billeder: Vedhaeftninger;
}): Renderable {
  const vaelger = useRef<HTMLInputElement>(null);
  const [traekker, setTraekker] = useState(false);

  function indsaet(e: ClipboardEvent<HTMLTextAreaElement>): void {
    const filer = billedFiler(e.clipboardData.files);
    if (filer.length === 0) return; // almindelig tekst indsættes som normalt
    e.preventDefault();
    billeder.tilfoej(filer);
  }

  function slip(e: DragEvent<HTMLDivElement>): void {
    const filer = billedFiler(e.dataTransfer.files);
    setTraekker(false);
    if (filer.length === 0) return;
    e.preventDefault();
    billeder.tilfoej(filer);
  }

  return (
    <div>
      <div
        className="relative"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setTraekker(true);
          }
        }}
        onDragLeave={() => setTraekker(false)}
        onDrop={slip}
      >
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={indsaet}
          rows={rows}
          placeholder={placeholder}
          className={cn("w-full pr-11", className, traekker && "outline-2 outline-accent")}
        />
        <button
          type="button"
          onClick={() => vaelger.current?.click()}
          disabled={!billeder.kanTilfoeje}
          aria-label="Vedhæft billede"
          title={billeder.kanTilfoeje ? "Vedhæft billede — eller indsæt med Ctrl+V" : "Der kan ikke vedhæftes flere billeder"}
          className="absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-md border border-kant bg-kort text-daempet focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 pointer-fine:hover:border-accent pointer-fine:hover:text-tekst"
        >
          <IkonPlus className="size-4" />
        </button>
        <input
          ref={vaelger}
          type="file"
          accept={TYPER}
          multiple
          hidden
          onChange={(e) => {
            billeder.tilfoej(billedFiler(e.target.files));
            e.target.value = ""; // så samme fil kan vælges igen
          }}
        />
      </div>
      {billeder.liste.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {billeder.liste.map((b) => (
            <li key={b.lokalId} className="relative">
              <img
                src={b.url}
                alt={b.navn}
                title={b.fejl ?? b.navn}
                className={cn(
                  "size-14 rounded-md border object-cover",
                  b.status === "fejl" ? "border-fare opacity-50" : "border-kant",
                  b.status === "uploader" && "animate-pulse"
                )}
              />
              <button
                type="button"
                onClick={() => billeder.fjern(b.lokalId)}
                aria-label={`Fjern ${b.navn}`}
                className="absolute -top-1.5 -right-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full border border-kant bg-kort text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-farelys"
              >
                <IkonLuk className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {billeder.liste.some((b) => b.fejl) && (
        <p className="mt-1 text-xs text-farelys">{billeder.liste.find((b) => b.fejl)?.fejl}</p>
      )}
    </div>
  );
}
