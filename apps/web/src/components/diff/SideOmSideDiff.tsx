// Side-om-side-visning af en ændret fil som på GitHub: gammel version
// til venstre, ny til højre. Farve OG fortegn (−/+), så visningen også
// kan læses uden at skelne rød fra grøn. Lange linjer ombrydes, så
// rækkerne altid står ud for hinanden.

import type { DiffRaekke, DiffSide } from "../../../../../packages/domain/src/domain/diff";
import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";

export function SideOmSideDiff({ raekker }: { raekker: DiffRaekke[] }): Renderable {
  return (
    <table className="w-full table-fixed border-collapse font-mono text-[0.8rem] leading-5">
      <colgroup>
        <col className="w-12" />
        <col />
        <col className="w-12" />
        <col />
      </colgroup>
      <tbody>
        {raekker.map((r, i) =>
          r.type === "udsnit" ? (
            <tr key={i} className="bg-accent/10">
              <td colSpan={4} className="px-3 py-1 text-daempet">
                {r.tekst}
              </td>
            </tr>
          ) : (
            <tr key={i}>
              <Celler side={r.venstre} />
              <Celler side={r.hoejre} hoejre />
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}

const BAGGRUND = { fjernet: "bg-diff-fjernet", tilfoejet: "bg-diff-tilfoejet", uaendret: "" };
const NR_BAGGRUND = { fjernet: "bg-diff-fjernet-nr", tilfoejet: "bg-diff-tilfoejet-nr", uaendret: "" };
const FORTEGN = { fjernet: "−", tilfoejet: "+", uaendret: " " };

/** Linjenummer + kode for én side. null = tom celle */
function Celler({ side, hoejre = false }: { side: DiffSide | null; hoejre?: boolean }): Renderable {
  const kant = hoejre && "border-l border-kant";
  if (!side) {
    return (
      <>
        <td className={cn("bg-diff-tom", kant)} />
        <td className="bg-diff-tom" />
      </>
    );
  }
  return (
    <>
      <td className={cn("select-none px-2 text-right align-top text-daempet", NR_BAGGRUND[side.art], kant)}>
        {side.nr}
      </td>
      <td className={cn("whitespace-pre-wrap break-all pr-3 align-top", BAGGRUND[side.art])}>
        <span className="inline-block w-4 select-none text-center text-daempet">{FORTEGN[side.art]}</span>
        {side.tekst}
      </td>
    </>
  );
}
