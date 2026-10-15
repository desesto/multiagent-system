// Før/efter-billeder af en færdig implementering:
//  1. "efter": agentens commit, som worktreet allerede står på
//  2. "før":   grenens udgangspunkt (commit'ens forælder) — checkes ud i
//              SAMME worktree og sættes tilbage bagefter
// For hver udgave startes en midlertidig Vite-server, siderne fotograferes,
// og serveren stoppes igen. Brugerens egen mappe og dev-server røres aldrig.

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Browser } from "playwright-core";
import type { Implementering } from "../../../../packages/domain/src/domain/implementering";
import type { IImplementeringRepository } from "../../../../packages/domain/src/contracts/implementeringRepository";
import type {
  IFoerEfterFotograf,
  ISkaermbilledRepository,
} from "../../../../packages/domain/src/contracts/skaermbilleder";
import { ruterFraOpsummering, type SkaermbilledTilstand } from "../../../../packages/domain/src/domain/skaermbillede";
import { git } from "../git/koerGit";
import { fjernNodeModulesLaenker, laenkNodeModules } from "../git/nodeModules";
import { repoRodFor } from "../git/worktreeStier";
import { aabnBrowser, fotograferSider } from "./browserFotograf";
import { findViteApp, usikkerAendring, type ViteApp } from "./viteApp";
import { MIDLERTIDIG_KONFIG, startVite } from "./viteServer";
import { kandidatMapper } from "../vaerktoejer/monorepoMapper";

interface Kontekst {
  impl: Implementering;
  repoRod: string;
  app: ViteApp;
  ruter: string[];
  cacheMappe: string;
  browser: Browser;
}

export class FoerEfterFotograf implements IFoerEfterFotograf {
  constructor(
    private readonly implRepo: IImplementeringRepository,
    private readonly billedRepo: ISkaermbilledRepository,
    /** Systemets eget API — det eneste, siderne må læse fra */
    private readonly apiPort: number
  ) {}

  async tag(id: string): Promise<void> {
    const impl = await this.implRepo.hent(id);
    if (!impl?.commitHash) return;
    await this.implRepo.opdater(id, { billedStatus: "tages", billedBesked: null });
    const repoRod = repoRodFor(impl);
    const beskeder: string[] = [];
    let cacheMappe: string | null = null;
    let browser: Browser | null = null;
    let udcheckket = false;
    try {
      await laenkNodeModules(repoRod, impl.worktreeSti);
      const app = await findViteApp(impl.worktreeSti, impl.aendredeFiler);
      if (!app) throw new Error("Fandt ingen Vite-frontend i projektet (en mappe med vite.config og installeret vite)");
      cacheMappe = await mkdtemp(path.join(os.tmpdir(), "multiagent-vite-"));
      browser = await aabnBrowser();
      const k: Kontekst = { impl, repoRod, app, ruter: ruterFraOpsummering(impl.opsummering), cacheMappe, browser };

      const usikker = usikkerAendring(app, impl.aendredeFiler);
      if (usikker) {
        beskeder.push(
          `Efter-billeder er sprunget over: agenten ændrede ${usikker}, som Vite ville køre direkte på din maskine. ` +
            `Gennemse koden, flet den, og se resultatet i din egen browser.`
        );
      } else {
        await this.fotografer(k, "efter", beskeder);
      }
      await git(impl.worktreeSti, ["checkout", "--quiet", "--detach", `${impl.commitHash}~1`]);
      udcheckket = true;
      await this.fotografer(k, "foer", beskeder);
      await this.implRepo.opdater(id, { billedStatus: "klar", billedBesked: beskeder.join("\n") || null });
    } catch (fejl) {
      console.error(`[før/efter ${impl.gren}] fejlede`, fejl);
      await this.implRepo.opdater(id, {
        billedStatus: "fejlet",
        billedBesked: [...beskeder, (fejl as Error).message].join("\n"),
      });
    } finally {
      await browser?.close().catch(() => undefined);
      if (udcheckket) await git(impl.worktreeSti, ["checkout", "--quiet", impl.gren]).catch(() => "");
      await fjernNodeModulesLaenker(impl.worktreeSti).catch(() => 0);
      if (cacheMappe) await rm(cacheMappe, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async fotografer(k: Kontekst, tilstand: SkaermbilledTilstand, beskeder: string[]): Promise<void> {
    const vite = await startVite({ worktree: k.impl.worktreeSti, repoRod: k.repoRod, app: k.app, cacheMappe: k.cacheMappe });
    try {
      const { fotos, blokeret } = await fotograferSider(k.browser, vite.url, this.apiPort, k.ruter);
      for (const f of fotos) {
        await this.billedRepo.gem({ implementeringId: k.impl.id, tilstand, ...f });
      }
      if (blokeret.length > 0) {
        beskeder.push(
          `${tilstand === "foer" ? "Før" : "Efter"}: siderne forsøgte kald, der blev afvist ` +
            `(de må kun læse fra systemets eget API): ${blokeret.join(", ")}`
        );
      }
    } finally {
      await vite.stop();
    }
  }

  async ryddOpEfterGenstart(): Promise<void> {
    for (const impl of await this.implRepo.markerAfbrudteBilleder()) {
      // Worktreet kan stå på udgangspunktet og have en midlertidig konfiguration liggende
      await git(impl.worktreeSti, ["checkout", "--quiet", impl.gren]).catch(() => "");
      await fjernNodeModulesLaenker(impl.worktreeSti).catch(() => 0);
      for (const mappe of await kandidatMapper(impl.worktreeSti)) {
        await rm(path.join(impl.worktreeSti, mappe, MIDLERTIDIG_KONFIG), { force: true });
      }
      console.warn(`[før/efter ${impl.gren}] afbrudt af genstart — ryddet op`);
    }
  }
}
