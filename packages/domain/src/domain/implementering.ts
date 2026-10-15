// Domæne: Implementering — én agentkørsel, der skriver kode på sin
// egen git-gren. Brugeren gennemgår grenen og fletter den selv med git;
// systemet rører aldrig brugerens arbejdsmappe eller main.

import type { AgentId } from "./agent";
import type { OpgaveId } from "./opgave";
import type { TokenForbrug } from "./forbrug";
import type { FilAendringsType } from "./diff";
import type { BilledStatus } from "./skaermbillede";

export type ImplementeringStatus =
  /** Agenten arbejder i sit worktree */
  | "koerer"
  /** Færdig og committet — klar til brugerens gennemsyn */
  | "klar"
  | "fejlet"
  /** Grenen er fjernet uden at være flettet ind */
  | "kasseret"
  /** Grenen var flettet ind, da den blev ryddet op */
  | "flettet";

export interface AendretFil {
  /** Sti relativt til repoets rod, med / */
  sti: string;
  type: FilAendringsType;
  tilfoejet: number;
  fjernet: number;
}

export interface Implementering {
  id: string;
  opgaveId: OpgaveId;
  beslutningspunktId: string;
  agentId: AgentId;
  status: ImplementeringStatus;
  /** Git-grenen, fx agent/a3f29c1e */
  gren: string;
  /** Mappen med agentens worktree — ved siden af projektet */
  worktreeSti: string;
  /** Agentens commit — null indtil kørslen er færdig */
  commitHash: string | null;
  aendredeFiler: AendretFil[];
  laesteFiler: string[];
  /** Agentens egen opsummering af, hvad den lavede */
  opsummering: string | null;
  /** Fejl, eller en advarsel (fx stoppet af budgetloftet) */
  fejl: string | null;
  forbrug: TokenForbrug | null;
  /** Udbyderens eget prisestimat i USD, når det findes */
  prisUsd: number | null;
  /** Pull request på GitHub — sat af autokør */
  prUrl: string | null;
  /** Før/efter-billeder: null, når opgaven ikke er visuel (eller fra før funktionen) */
  billedStatus: BilledStatus | null;
  /** Hvorfor billederne mangler, eller hvad der blev blokeret undervejs */
  billedBesked: string | null;
  oprettetTidspunkt: string;
  afsluttetTidspunkt: string | null;
}
