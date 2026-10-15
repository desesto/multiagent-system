// Rangeret liste med beløb og en vandret søjle — bruges til både opgaver
// og agenter. Kender ikke domænet: får navn og beløb som props.

import type { ReactNode } from "react";
import { Pris } from "../Pris";
import type { Renderable } from "../../lib/renderable";

export interface TopPost {
  noegle: string;
  navn: ReactNode;
  usd: number;
  ekstra?: string;
}

export function TopListe({ titel, poster }: { titel: string; poster: TopPost[] }): Renderable {
  const max = Math.max(...poster.map((p) => p.usd), 0.000001);
  return (
    <section className="rounded-[10px] panel border p-4">
      <h3 className="mb-3 text-[0.95rem] font-semibold">{titel}</h3>
      {poster.length === 0 ? (
        <p className="text-[0.85rem] text-daempet">Intet forbrug i perioden.</p>
      ) : (
        <ul className="space-y-2.5">
          {poster.map((p) => (
            <li key={p.noegle}>
              <div className="flex justify-between gap-3 text-[0.85rem]">
                <span className="truncate">{p.navn}</span>
                <span className="shrink-0 font-mono text-xs">
                  <Pris usd={p.usd} />
                  {p.ekstra && <span className="text-daempet"> · {p.ekstra}</span>}
                </span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-flade">
                <div className="h-full rounded-full bg-accent/70" style={{ width: `${(p.usd / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
