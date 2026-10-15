// De fire nøgletal øverst på forbrugssiden. I dag-kortet viser også,
// hvor meget af dagsbudgettet der er brugt.

import type { ForbrugsOversigt } from "../../../../../packages/domain/src/domain/forbrug";
import { cn } from "../../lib/cn";
import { Pris } from "../Pris";
import type { Renderable } from "../../lib/renderable";

export function NoegleTal({ o }: { o: ForbrugsOversigt }): Renderable {
  const budgetAndel = o.dagligtBudgetUsd ? Math.min(o.idagUsd / o.dagligtBudgetUsd, 1) : null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Kort titel="I dag" vaerdi={<Pris usd={o.idagUsd} />}>
        {budgetAndel === null ? (
          <p className="text-xs text-daempet">Intet dagsbudget — sæt DAGLIGT_BUDGET_USD i .env</p>
        ) : (
          <>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-flade"
              role="meter"
              aria-label="Andel af dagsbudgettet"
              aria-valuenow={Math.round(budgetAndel * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn("h-full rounded-full", budgetAndel >= 1 ? "bg-fare" : "bg-accent")}
                style={{ width: `${budgetAndel * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-daempet">af dagsbudgettet på <Pris usd={o.dagligtBudgetUsd ?? 0} /></p>
          </>
        )}
      </Kort>
      <Kort titel={`Sidste ${o.periodeDage} dage`} vaerdi={<Pris usd={o.totalUsd} />}>
        <p className="text-xs text-daempet">
          Analyser <Pris usd={o.analyseUsd} /> · Implementeringer <Pris usd={o.implementeringUsd} />
        </p>
      </Kort>
      <Kort titel="Fra cachen" vaerdi={`${Math.round(o.cacheAndel * 100)} %`}>
        <p className="text-xs text-daempet">af alt input — læst til en tiendedel af prisen</p>
      </Kort>
      <Kort titel="Tokens" vaerdi={tal(o.tokens.ind + o.tokens.cacheSkriv + o.tokens.cacheLaes + o.tokens.ud)}>
        <p className="text-xs text-daempet">
          ind {tal(o.tokens.ind)} · cache {tal(o.tokens.cacheSkriv + o.tokens.cacheLaes)} · ud {tal(o.tokens.ud)}
        </p>
      </Kort>
    </div>
  );
}

function Kort({ titel, vaerdi, children }: { titel: string; vaerdi: React.ReactNode; children: React.ReactNode }): Renderable {
  return (
    <div className="rounded-[10px] panel border p-4">
      <p className="text-[0.8rem] text-daempet">{titel}</p>
      <p className="mt-0.5 text-2xl font-semibold">{vaerdi}</p>
      {children}
    </div>
  );
}

function tal(n: number): string {
  return n.toLocaleString("da-DK");
}
