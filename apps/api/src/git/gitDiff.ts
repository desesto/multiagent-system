// Git-forespørgsler til gennemsyn af en agents commit. Virker mod
// repoets rod, så det også fungerer, efter worktreet er fjernet.

import type { AendretFil } from "../../../../packages/domain/src/domain/implementering";
import type { FilAendringsType } from "../../../../packages/domain/src/domain/diff";
import { git, gitBytes } from "./koerGit";

const TYPER: Record<string, FilAendringsType> = { A: "oprettet", D: "slettet" };

/**
 * Filerne i en commit med type og antal linjer. -z giver rå stier
 * (ellers skriver git æ/ø/å som \\303\\206-koder), og --no-renames gør
 * hver fil til enten oprettet, ændret eller slettet.
 */
export async function filerICommit(cwd: string, hash: string): Promise<AendretFil[]> {
  const faelles = ["diff-tree", "--no-commit-id", "-r", "--no-renames", "-z"];
  const status = (await git(cwd, [...faelles, "--name-status", hash])).split("\0").filter(Boolean);
  const numstat = (await git(cwd, [...faelles, "--numstat", hash])).split("\0").filter(Boolean);

  const linjer = new Map<string, { tilfoejet: number; fjernet: number }>();
  for (const post of numstat) {
    const [tilfoejet, fjernet, sti] = post.split("\t");
    linjer.set(sti, { tilfoejet: Number(tilfoejet) || 0, fjernet: Number(fjernet) || 0 });
  }
  const filer: AendretFil[] = [];
  for (let i = 0; i + 1 < status.length; i += 2) {
    const sti = status[i + 1];
    filer.push({
      sti,
      type: TYPER[status[i]] ?? "aendret",
      ...(linjer.get(sti) ?? { tilfoejet: 0, fjernet: 0 }),
    });
  }
  return filer;
}

/** Filens indhold i en bestemt version, eller null hvis den ikke findes dér */
export async function filIndhold(repoRod: string, ref: string, sti: string): Promise<Buffer | null> {
  return gitBytes(repoRod, ["show", `${ref}:${sti}`]).catch(() => null);
}

/**
 * Git's egen diff for én fil, med 5 linjers kontekst. Rå bytes, IKKE
 * trimmet: en tom kodelinje til sidst er et enkelt mellemrum i diffen.
 */
export async function unifiedDiff(repoRod: string, hash: string, sti: string): Promise<string> {
  const ud = await gitBytes(repoRod, ["diff", "--no-color", "--no-ext-diff", "-U5", `${hash}~1`, hash, "--", sti]);
  return ud.toString("utf8");
}
