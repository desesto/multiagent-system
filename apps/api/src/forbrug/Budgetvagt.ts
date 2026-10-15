// Budgetvagten: tjekker dagens forbrug FØR en betalt kørsel starter.
// Den hårde mur er stadig kreditterne uden auto-reload — vagten er den
// bløde, der stopper dig før muren og fortæller hvorfor.

import type { IBudgetvagt, IForbrugRepository } from "../../../../packages/domain/src/contracts/forbrug";
import { KoordinatorFejl } from "../core/KoordinatorFejl";
import { dagensStart } from "./forbrugsBeregner";
import { koerselsPris } from "./priser";
import { formaterKroner } from "../../../../packages/domain/src/domain/valuta";

export class Budgetvagt implements IBudgetvagt {
  constructor(
    private readonly repo: IForbrugRepository,
    /** null = ingen grænse */
    private readonly dagligtBudgetUsd: number | null,
    /** false i mock-tilstand: gratis kørsler må aldrig blokeres */
    private readonly aktiv: boolean,
    private readonly nu: () => Date = () => new Date()
  ) {}

  async brugtIdag(): Promise<number> {
    const koersler = await this.repo.hentKoersler(dagensStart(this.nu()));
    return koersler.reduce((sum, k) => sum + (koerselsPris(k) ?? 0), 0);
  }

  async tjek(): Promise<void> {
    if (!this.aktiv || this.dagligtBudgetUsd === null) return;
    const brugt = await this.brugtIdag();
    if (brugt >= this.dagligtBudgetUsd) {
      throw new KoordinatorFejl(
        429,
        `Dagsbudgettet på ${usd(this.dagligtBudgetUsd)} er brugt (${usd(brugt)} i dag). ` +
          "Det nulstilles ved midnat — eller hæv DAGLIGT_BUDGET_USD i .env."
      );
    }
  }
}

/** Læser DAGLIGT_BUDGET_USD — tom eller ugyldig betyder "ingen grænse" */
export function laesDagligtBudget(vaerdi: string | undefined): number | null {
  if (!vaerdi?.trim()) return null;
  const tal = Number(vaerdi.replace(",", "."));
  return Number.isFinite(tal) && tal > 0 ? tal : null;
}

/** Fx "1,00 USD (≈ 6,70 kr.)" */
function usd(beloeb: number): string {
  return `${beloeb.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (${formaterKroner(beloeb)})`;
}
