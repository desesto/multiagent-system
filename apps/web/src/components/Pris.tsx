// Et beløb i dollars med kroner i småt bagefter: 0,09 USD (≈ 60 øre).
// Dollars er det, der faktureres i; kronerne er til at forstå beløbet.

import { formaterKroner } from "../../../../packages/domain/src/domain/valuta";
import { formaterPris } from "../lib/forbrug";
import type { Renderable } from "../lib/renderable";

export function Pris({ usd }: { usd: number }): Renderable {
  return (
    <>
      {formaterPris(usd)}{" "}
      <span className="text-[0.75em] font-normal text-daempet">({formaterKroner(usd)})</span>
    </>
  );
}
