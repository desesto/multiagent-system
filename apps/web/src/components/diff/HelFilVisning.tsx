// En hel fil med linjenumre — grøn for en ny fil, rød for en slettet.

import { cn } from "../../lib/cn";
import type { Renderable } from "../../lib/renderable";

export function HelFilVisning({
  linjer,
  art,
}: {
  linjer: string[];
  art: "tilfoejet" | "fjernet";
}): Renderable {
  const ny = art === "tilfoejet";
  return (
    <table className="w-full table-fixed border-collapse font-mono text-[0.8rem] leading-5">
      <colgroup>
        <col className="w-12" />
        <col />
      </colgroup>
      <tbody>
        {linjer.map((tekst, i) => (
          <tr key={i} className={ny ? "bg-diff-tilfoejet" : "bg-diff-fjernet"}>
            <td
              className={cn(
                "select-none px-2 text-right align-top text-daempet",
                ny ? "bg-diff-tilfoejet-nr" : "bg-diff-fjernet-nr"
              )}
            >
              {i + 1}
            </td>
            <td className="whitespace-pre-wrap break-all pr-3 align-top">
              <span className="inline-block w-4 select-none text-center text-daempet">
                {ny ? "+" : "−"}
              </span>
              {tekst}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
