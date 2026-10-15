// Push og pull request via GitHub CLI (gh). Brugeren logger ind én gang
// med `gh auth login` — systemet gemmer intet token selv.
//
// SIKKERHED: Kun agentens EGEN gren pushes, og kun til et navn under
// agent/ — aldrig main eller en anden eksisterende gren. Alle kommandoer
// køres med faste argumentlister (execFile), aldrig gennem en shell, så
// titler og tekst fra opgaven kan ikke blive til kommandoer.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IPullRequestOpretter, NyPullRequest } from "../../../../packages/domain/src/contracts/autokoer";
import { git } from "./koerGit";

const koerFil = promisify(execFile);
/** Windows har et loft over kommandolinjens længde — teksten afkortes i god tid */
const MAX_KROP = 12_000;

async function gh(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await koerFil("gh", args, { cwd, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
    return stdout.trim();
  } catch (fejl) {
    const f = fejl as { code?: string; stderr?: string; message: string };
    if (f.code === "ENOENT") {
      throw new Error("GitHub CLI (gh) er ikke installeret. Hent den på cli.github.com, og kør derefter: gh auth login");
    }
    throw new Error(`gh ${args[0]} fejlede: ${f.stderr?.trim() || f.message}`);
  }
}

export class PullRequestGh implements IPullRequestOpretter {
  async tjekKlar(): Promise<void> {
    await gh(process.cwd(), ["--version"]);
    await gh(process.cwd(), ["auth", "status"]).catch(() => {
      throw new Error("Du er ikke logget ind i GitHub CLI. Kør i en terminal: gh auth login");
    });
  }

  async opret(pr: NyPullRequest): Promise<string> {
    if (!/^agent\/[a-z0-9-]+$/.test(pr.fjernGren)) {
      throw new Error(`Ugyldigt grennavn til GitHub: ${pr.fjernGren}`);
    }
    await git(pr.repoRod, ["remote", "get-url", "origin"]).catch(() => {
      throw new Error("Repoet har ingen remote ved navn origin — forbind det til GitHub først");
    });
    const base = await basisGren(pr.repoRod);
    // Agentens lokale gren → et nyt navn under agent/ på GitHub
    await git(pr.worktreeSti, ["push", "origin", `${pr.lokalGren}:refs/heads/${pr.fjernGren}`]);
    const krop = pr.krop.length > MAX_KROP ? `${pr.krop.slice(0, MAX_KROP)}\n\n…(afkortet)` : pr.krop;
    const ud = await gh(pr.repoRod, [
      "pr", "create",
      "--head", pr.fjernGren,
      "--base", base,
      "--title", pr.titel.slice(0, 200),
      "--body", krop,
      ...(pr.kladde ? ["--draft"] : []),
    ]);
    // gh skriver adressen som sidste linje
    return ud.split("\n").map((l) => l.trim()).filter(Boolean).at(-1) ?? ud;
  }
}

/** Den gren, brugeren står på (typisk main) — eller repoets standardgren */
async function basisGren(repoRod: string): Promise<string> {
  const aktuel = await git(repoRod, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (aktuel && aktuel !== "HEAD") return aktuel;
  return gh(repoRod, ["repo", "view", "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"]);
}

/** I mock-tilstand pushes intet — så testkørsler aldrig ender på GitHub */
export class PullRequestMock implements IPullRequestOpretter {
  async tjekKlar(): Promise<void> {}

  async opret(): Promise<null> {
    return null;
  }
}
