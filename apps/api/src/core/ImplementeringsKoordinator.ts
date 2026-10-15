// ImplementeringsKoordinator — fra valgt retning til commit på en gren.
// Validerer, opretter worktree, kører motoren i baggrunden, committer
// og registrerer resultatet. Brugeren fletter selv; systemet rører
// aldrig brugerens arbejdsmappe eller main.

import path from "node:path";
import type { AiAgent } from "../../../../packages/domain/src/domain/agent";
import type { Implementering } from "../../../../packages/domain/src/domain/implementering";
import type { Opgave, Valgmulighed } from "../../../../packages/domain/src/domain/opgave";
import type { IImplementerer, IMemoryStore } from "../../../../packages/domain/src/contracts/kontrakter";
import type {
  IImplementeringRepository,
  ImplementeringsOpdatering,
} from "../../../../packages/domain/src/contracts/implementeringRepository";
import type { IBeslutningspunktRepository } from "../../../../packages/domain/src/contracts/beslutningspunktRepository";
import type { IOpgaveRepository } from "../../../../packages/domain/src/contracts/opgaveRepository";
import type { IAgentSvarRepository } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import type { IAgentRepository } from "../../../../packages/domain/src/contracts/agentRepository";
import type { IBudgetvagt } from "../../../../packages/domain/src/contracts/forbrug";
import type { IFoerEfterFotograf } from "../../../../packages/domain/src/contracts/skaermbilleder";
import type { AgentBillede, IVedhaeftningRepository } from "../../../../packages/domain/src/contracts/vedhaeftningRepository";
import {
  commitAlt, erFlettet, findRepoRod, fjernWorktree, harAendringer, opretWorktree,
} from "../git/gitWorktree";
import { filerICommit } from "../git/gitDiff";
import { KoordinatorFejl } from "./KoordinatorFejl";
import { kommentarKaede } from "./kommentarKaede";
import { skalHaveDesign } from "./runnere/designSkitse";

export { KoordinatorFejl };
import { repoRodFor, worktreeStiFor } from "../git/worktreeStier";
import { fjernNodeModulesLaenker, laenkNodeModules } from "../git/nodeModules";

/** Rollen, der skriver kode. Arkitekten har reglen "Skriver ikke selv implementeringskode". */
const IMPLEMENTERENDE_ROLLE = "Programmør";

export interface KoordinatorAfhaengigheder {
  implementerer: IImplementerer;
  memory: IMemoryStore;
  implRepo: IImplementeringRepository;
  punktRepo: IBeslutningspunktRepository;
  opgaveRepo: IOpgaveRepository;
  svarRepo: IAgentSvarRepository;
  agentRepo: IAgentRepository;
  budgetvagt: IBudgetvagt;
  vedhaeftningRepo: IVedhaeftningRepository;
  /** Før/efter-billeder ved visuelle opgaver — udeladt = slået fra */
  fotograf?: IFoerEfterFotograf;
}

interface Koersel {
  repoRod: string;
  arbejdsmappe: string;
  agent: AiAgent;
  opgave: Opgave;
  valgt: Valgmulighed;
  raesonnement: string;
  kommentarer: string[];
  billeder: AgentBillede[];
}

export class ImplementeringsKoordinator {
  constructor(private readonly a: KoordinatorAfhaengigheder) {}

  /** Starter en implementering og returnerer straks — agenten arbejder i baggrunden */
  async start(punktId: string): Promise<Implementering> {
    const punkt = await this.a.punktRepo.hent(punktId);
    if (!punkt) throw new KoordinatorFejl(404, "Beslutningspunktet findes ikke");
    const valgt = punkt.valgmuligheder.find((m) => m.id === punkt.valgtMulighedId);
    if (punkt.erstattetAf) {
      throw new KoordinatorFejl(409, "Forslaget er erstattet af en ny vurdering — implementér fra det nyeste");
    }
    if (!valgt) throw new KoordinatorFejl(409, "Vælg en retning, før den kan implementeres");
    const opgave = await this.a.opgaveRepo.hent(punkt.opgaveId);
    if (!opgave) throw new KoordinatorFejl(404, "Opgaven findes ikke");
    if (opgave.status === "afsluttet") {
      throw new KoordinatorFejl(409, "Opgaven er afsluttet — genåbn den, før der implementeres mere");
    }
    if (!opgave.projektSti) {
      throw new KoordinatorFejl(400, "Opgaven har ingen projektsti — tilføj en, så agenten ved, hvor koden skal skrives");
    }
    const tidligere = await this.a.implRepo.hentForOpgave(opgave.id);
    if (tidligere.some((i) => i.status === "koerer")) {
      throw new KoordinatorFejl(409, "Der kører allerede en implementering for denne opgave");
    }
    const [agent] = await this.a.agentRepo.hentMedRolle(IMPLEMENTERENDE_ROLLE);
    if (!agent) throw new KoordinatorFejl(500, `Ingen agent har rollen ${IMPLEMENTERENDE_ROLLE} — kør seed`);

    await this.a.budgetvagt.tjek(); // FØR worktree og agent sættes i gang
    const repoRod = await findRepoRod(opgave.projektSti).catch(() => {
      throw new KoordinatorFejl(400, "Projektstien er ikke et git-repo. Kør git init og lav en første commit.");
    });
    const id = crypto.randomUUID();
    const gren = `agent/${id.slice(0, 8)}`;
    const worktreeSti = worktreeStiFor(repoRod, id);
    await opretWorktree(repoRod, worktreeSti, gren).catch((e: Error) => {
      throw new KoordinatorFejl(400, `Kunne ikke oprette git-gren: ${e.message}`);
    });

    const impl = await this.a.implRepo.opret({
      id, opgaveId: opgave.id, beslutningspunktId: punkt.id, agentId: agent.id, gren, worktreeSti,
    });
    const svar = await this.a.svarRepo.hentForBeslutningspunkt(punkt.id);
    const raesonnement = svar.find((s) => s.agentId === valgt.foreslaaetAf)?.indhold ?? "";
    const kaede = kommentarKaede(await this.a.punktRepo.hentForOpgave(opgave.id), punkt.id);
    const kommentarer = kaede.map((k) => k.tekst);
    const billeder = await this.a.vedhaeftningRepo.agentBilleder(opgave.id, kaede);
    const arbejdsmappe = path.join(worktreeSti, path.relative(repoRod, opgave.projektSti));

    void this.koer(impl, { repoRod, arbejdsmappe, agent, opgave, valgt, raesonnement, kommentarer, billeder });
    return impl;
  }

  private async koer(impl: Implementering, k: Koersel): Promise<void> {
    try {
      await laenkNodeModules(k.repoRod, impl.worktreeSti);
      const r = await this.a.implementerer.implementer({
        agent: k.agent,
        hukommelse: await this.a.memory.hent(k.agent.id),
        opgave: k.opgave,
        valgtMulighed: k.valgt,
        raesonnement: k.raesonnement,
        kommentarer: k.kommentarer,
        billeder: k.billeder,
        arbejdsmappe: k.arbejdsmappe,
      });
      await fjernNodeModulesLaenker(impl.worktreeSti); // ALTID før commit
      const faelles = { laesteFiler: r.laesteFiler, opsummering: r.opsummering, forbrug: r.forbrug, prisUsd: r.prisUsd };

      if (!(await harAendringer(impl.worktreeSti))) {
        await fjernWorktree(k.repoRod, impl.worktreeSti, impl.gren);
        await this.afslut(impl.id, { ...faelles, status: "fejlet", fejl: "Agenten lavede ingen ændringer" });
        return;
      }
      const hash = await commitAlt(impl.worktreeSti, commitBesked(k, impl.beslutningspunktId), k.agent.navn);
      const fotograf = skalHaveDesign(k.opgave) ? this.a.fotograf : undefined;
      await this.afslut(impl.id, {
        ...faelles,
        status: "klar",
        // Sættes sammen med "klar", så browseren bliver ved med at spørge, til billederne er der
        billedStatus: fotograf ? "tages" : null,
        commitHash: hash,
        aendredeFiler: await filerICommit(impl.worktreeSti, hash),
        fejl: r.stoppetAf
          ? `Stoppet af ${r.stoppetAf === "budget" ? "budgetloftet" : "loftet over runder"} — arbejdet kan være ufærdigt. Gennemse grenen grundigt.`
          : null,
      });
      if (fotograf) void fotograf.tag(impl.id);
    } catch (fejl) {
      console.error(`[implementering ${impl.gren}] fejlede`, fejl);
      await fjernNodeModulesLaenker(impl.worktreeSti).catch(() => 0);
      await fjernWorktree(k.repoRod, impl.worktreeSti, impl.gren);
      await this.afslut(impl.id, { status: "fejlet", fejl: (fejl as Error).message });
    }
  }

  /** Fjerner gren og mappe. Var grenen flettet ind, registreres den som flettet. */
  async ryd(id: string): Promise<Implementering> {
    const impl = await this.a.implRepo.hent(id);
    if (!impl) throw new KoordinatorFejl(404, "Implementeringen findes ikke");
    if (impl.status === "koerer") throw new KoordinatorFejl(409, "Agenten arbejder stadig");
    if (impl.billedStatus === "tages") {
      throw new KoordinatorFejl(409, "Før/efter-billederne tages stadig — vent et øjeblik");
    }
    if (impl.status === "kasseret" || impl.status === "flettet") {
      throw new KoordinatorFejl(409, "Implementeringen er allerede ryddet op");
    }
    if (impl.status === "fejlet") return (await this.a.implRepo.opdater(id, { status: "kasseret" }))!;

    const repoRod = repoRodFor(impl);
    const flettet = impl.commitHash ? await erFlettet(repoRod, impl.commitHash) : false;
    await fjernNodeModulesLaenker(impl.worktreeSti).catch(() => 0);
    await fjernWorktree(repoRod, impl.worktreeSti, impl.gren);
    return (await this.a.implRepo.opdater(id, { status: flettet ? "flettet" : "kasseret" }))!;
  }

  /** Ved opstart: kørsler, der blev afbrudt af en genstart, ryddes op */
  async ryddOpEfterGenstart(): Promise<void> {
    for (const impl of await this.a.implRepo.markerAfbrudte()) {
      await fjernNodeModulesLaenker(impl.worktreeSti).catch(() => 0);
      await fjernWorktree(repoRodFor(impl), impl.worktreeSti, impl.gren);
      console.warn(`[implementering ${impl.gren}] afbrudt af genstart — ryddet op`);
    }
    await this.a.fotograf?.ryddOpEfterGenstart();
  }

  private afslut(id: string, felter: ImplementeringsOpdatering): Promise<Implementering | null> {
    return this.a.implRepo.opdater(id, { ...felter, afsluttetTidspunkt: new Date().toISOString() });
  }
}

/** Første linje er kort; resten gør commit'en sporbar til opgave og beslutning */
function commitBesked(k: Koersel, punktId: string): string {
  return [
    `${k.agent.navn}: ${k.opgave.titel}`,
    ``,
    `Retning: ${k.valgt.beskrivelse}`,
    `Opgave: ${k.opgave.id}`,
    `Beslutning: ${punktId}`,
  ].join("\n");
}
