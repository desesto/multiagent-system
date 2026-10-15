// Én opgave i autokør-køen: status, titel, pull request og — hvis
// arkitekten valgte retningen — hans begrundelse.

import { Link } from "react-router-dom";
import type { AutokoerPost, AutokoerStatus } from "../../../../../packages/domain/src/domain/autokoer";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";
import { IkonLuk } from "../Ikoner";

const STATUS: Record<AutokoerStatus, { tekst: string; farve: string }> = {
  venter: { tekst: "Venter", farve: "text-daempet" },
  koerer: { tekst: "Kører", farve: "text-t-feature animate-pulse" },
  faerdig: { tekst: "PR klar", farve: "text-t-feature" },
  fejlet: { tekst: "Fejlet", farve: "text-farelys" },
};

export function KoePost({ post, onFjern }: { post: AutokoerPost; onFjern: () => void }): Renderable {
  const s = post.status === "faerdig" && !post.prUrl ? { tekst: "Færdig", farve: "text-t-feature" } : STATUS[post.status];
  return (
    <li className="rounded-md border border-kant/70 px-3 py-2 text-[0.88rem]">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={cn("shrink-0 text-xs font-bold uppercase tracking-wider", s.farve)}>{s.tekst}</span>
          <Link to={`/opgaver/${post.opgaveId}`} className="truncate pointer-fine:hover:underline">
            {post.opgaveTitel}
          </Link>
        </span>
        {post.prUrl ? (
          <a href={post.prUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[0.82rem] font-semibold underline">
            Pull request ↗
          </a>
        ) : (
          post.status === "venter" && (
            <button
              type="button"
              onClick={onFjern}
              aria-label={`Tag "${post.opgaveTitel}" ud af køen`}
              className="shrink-0 cursor-pointer rounded p-0.5 text-daempet focus-visible:outline-2 focus-visible:outline-accent pointer-fine:hover:text-farelys"
            >
              <IkonLuk className="size-4" />
            </button>
          )
        )}
      </div>
      {post.valgtAf && (
        <p className="mt-1 text-[0.8rem] text-daempet">
          {post.valgtAf === "bruger" ? "Retning: dit eget valg" : `Retning valgt af arkitekten: ${post.begrundelse ?? ""}`}
        </p>
      )}
      {post.besked && (
        <p className={cn("mt-1 text-[0.8rem]", post.status === "fejlet" ? "text-farelys" : "text-daempet")}>
          {post.besked}
        </p>
      )}
    </li>
  );
}
