// Git-operationer for agenternes worktrees. Alt køres med execFile og
// FASTE argumentlister — aldrig gennem en shell, og aldrig med tekst,
// en agent har skrevet. Grennavne og stier laver systemet selv.
//
// Et worktree er en ekstra arbejdsmappe til samme repo, på sin egen
// gren. Brugerens egen mappe og main røres aldrig.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { git } from "./koerGit";

const koerFil = promisify(execFile);

/** Repoets rodmappe — projektstien kan være en undermappe */
export async function findRepoRod(sti: string): Promise<string> {
  return git(sti, ["rev-parse", "--show-toplevel"]);
}

/** Ny gren fra den nuværende commit, i en separat mappe */
export async function opretWorktree(
  repoRod: string,
  worktreeSti: string,
  gren: string
): Promise<void> {
  await git(repoRod, ["worktree", "add", "-b", gren, worktreeSti, "HEAD"]);
}

export async function harAendringer(worktreeSti: string): Promise<boolean> {
  return (await git(worktreeSti, ["status", "--porcelain"])) !== "";
}

/**
 * Committer alle ændringer med agenten som forfatter, så agentens
 * arbejde altid kan skelnes fra brugerens i git-historikken.
 * node_modules udelukkes eksplicit, også hvis et link skulle hænge ved.
 */
export async function commitAlt(
  worktreeSti: string,
  besked: string,
  agentNavn: string
): Promise<string> {
  await git(worktreeSti, ["add", "-A", "--", ".", ":(exclude)**/node_modules", ":(exclude)node_modules"]);
  await git(worktreeSti, [
    "-c", `user.name=${agentNavn} (agent)`,
    "-c", "user.email=agent@multiagent.lokal",
    "commit", "-m", besked,
  ]);
  return git(worktreeSti, ["rev-parse", "HEAD"]);
}

/**
 * Er agentens commit allerede flettet ind i det, brugeren har tjekket
 * ud? Bruges ved oprydning til at skelne "flettet" fra "kasseret".
 */
export async function erFlettet(repoRod: string, commitHash: string): Promise<boolean> {
  try {
    await koerFil("git", ["merge-base", "--is-ancestor", commitHash, "HEAD"], { cwd: repoRod });
    return true;
  } catch {
    return false; // exit-kode 1 betyder "ikke forfader"
  }
}

/**
 * Fjerner worktree og gren. Tåler, at brugeren allerede har fjernet
 * dem selv. Kald ALTID fjernNodeModulesLinks først (se nodeModules.ts).
 */
export async function fjernWorktree(
  repoRod: string,
  worktreeSti: string,
  gren: string
): Promise<void> {
  await git(repoRod, ["worktree", "remove", "--force", worktreeSti]).catch(() => undefined);
  await git(repoRod, ["worktree", "prune"]).catch(() => undefined);
  await git(repoRod, ["branch", "-D", gren]).catch(() => undefined);
}
