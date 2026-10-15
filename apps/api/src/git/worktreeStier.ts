// Navngivningen af agentens worktree — samlet ét sted, fordi både
// koordinatoren og gennemsynet skal kunne regne frem og tilbage.

import type { Implementering } from "../../../../packages/domain/src/domain/implementering";

/** Worktreet ligger ved siden af repoet: <repo>-agent-<kort id> */
export function worktreeStiFor(repoRod: string, id: string): string {
  return `${repoRod}-agent-${id.slice(0, 8)}`;
}

/** Omvendt: repoets rod ud fra worktree-stien — virker også, når worktreet er fjernet */
export function repoRodFor(impl: Implementering): string {
  return impl.worktreeSti.slice(0, -`-agent-${impl.id.slice(0, 8)}`.length);
}
