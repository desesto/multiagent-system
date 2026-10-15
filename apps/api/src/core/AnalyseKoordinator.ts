// AnalyseKoordinator — agenterne analyserer en opgave og fremlægger
// retninger i ét samlet beslutningspunkt. Bruges både når en opgave
// oprettes og ved en ny vurdering, så flowet kun findes ét sted.

import type { Opgave, Beslutningspunkt } from "../../../../packages/domain/src/domain/opgave";
import type { IFilAdgangFabrik } from "../../../../packages/domain/src/contracts/filAdgang";
import type { IOpgaveRepository } from "../../../../packages/domain/src/contracts/opgaveRepository";
import type { IBeslutningspunktRepository } from "../../../../packages/domain/src/contracts/beslutningspunktRepository";
import type { IAgentSvarRepository } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import type { IAgentRepository } from "../../../../packages/domain/src/contracts/agentRepository";
import type { IImplementeringRepository } from "../../../../packages/domain/src/contracts/implementeringRepository";
import type { IBudgetvagt } from "../../../../packages/domain/src/contracts/forbrug";
import type { IVedhaeftningRepository } from "../../../../packages/domain/src/contracts/vedhaeftningRepository";
import type { Kommentar } from "../../../../packages/domain/src/domain/kommentar";
import type { Orchestrator } from "./Orchestrator";
import { KoordinatorFejl } from "./KoordinatorFejl";
import { kommentarKaede } from "./kommentarKaede";
import { bygReevalueringsKontekst } from "./runnere/agentPrompt";

export interface AnalyseAfhaengigheder {
  orchestrator: Orchestrator;
  opgaveRepo: IOpgaveRepository;
  punktRepo: IBeslutningspunktRepository;
  svarRepo: IAgentSvarRepository;
  agentRepo: IAgentRepository;
  implRepo: IImplementeringRepository;
  filAdgangFabrik: IFilAdgangFabrik;
  budgetvagt: IBudgetvagt;
  vedhaeftningRepo: IVedhaeftningRepository;
}

export class AnalyseKoordinator {
  constructor(private readonly a: AnalyseAfhaengigheder) {}

  /**
   * Kører alle agenter parallelt og samler svarene i ét nyt beslutningspunkt.
   * Fejler en enkelt agent, fortsættes med resten; fejler alle, kastes 502.
   */
  async analyser(
    opgave: Opgave,
    kontekst: string,
    log: (fejl: string) => void,
    /** Ved en ny vurdering: kommentarerne, hvis billeder agenterne også skal se */
    kommentarer: Kommentar[] = []
  ): Promise<Beslutningspunkt> {
    await this.a.budgetvagt.tjek(); // FØR noget betalt sættes i gang
    const agenter = await this.a.agentRepo.hentAlle();
    if (agenter.length === 0) throw new KoordinatorFejl(500, "Ingen agenter i databasen — kør: npx tsx src/seed.ts");

    const filAdgang = opgave.projektSti ? this.a.filAdgangFabrik.forProjekt(opgave.projektSti) : undefined;
    const billeder = await this.a.vedhaeftningRepo.agentBilleder(opgave.id, kommentarer);
    const resultater = await Promise.allSettled(
      agenter.map((agent) => this.a.orchestrator.koerAgent(agent, opgave, kontekst, filAdgang, billeder))
    );
    const svarListe = resultater.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const fejl = resultater.flatMap((r, i) =>
      r.status === "rejected" ? [`${agenter[i].navn}: ${fejlTekst(r.reason)}`] : []
    );
    for (const f of fejl) log(`Agent fejlede — ${f}`);
    if (svarListe.length === 0) throw new KoordinatorFejl(502, `Ingen agenter kunne svare. ${fejl.join(" · ")}`);

    // Sekretæren samler til ÉT punkt; hvert fulde svar gemmes for sig
    const punkt = await this.a.punktRepo.opret(await this.a.orchestrator.samlBeslutningspunkt(opgave, svarListe));
    for (const svar of svarListe) {
      await this.a.svarRepo.gem({
        opgaveId: opgave.id,
        agentId: svar.agentId,
        beslutningspunktId: punkt.id,
        indhold: svar.indhold,
        resume: svar.resume,
        laesteFiler: svar.laesteFiler,
        forbrug: svar.forbrug,
      });
    }
    await this.a.opgaveRepo.opdaterStatus(opgave.id, "afventer_beslutning");
    return punkt;
  }

  /**
   * Ny vurdering: agenterne får de tidligere forslag og brugerens
   * kommentarer og fremlægger nye retninger. Det gamle punkt bevares i
   * historikken, markeret som erstattet af det nye.
   */
  async reevaluer(punktId: string, log: (fejl: string) => void): Promise<Beslutningspunkt> {
    const punkt = await this.a.punktRepo.hent(punktId);
    if (!punkt) throw new KoordinatorFejl(404, "Beslutningspunktet findes ikke");
    if (punkt.erstattetAf) throw new KoordinatorFejl(409, "Forslaget er allerede vurderet påny — brug det nyeste");
    if ((punkt.kommentarer ?? []).length === 0) {
      throw new KoordinatorFejl(400, "Skriv mindst én kommentar, så agenterne ved, hvad de skal gøre anderledes");
    }
    const opgave = await this.a.opgaveRepo.hent(punkt.opgaveId);
    if (!opgave) throw new KoordinatorFejl(404, "Opgaven findes ikke");
    if (opgave.status === "afsluttet") throw new KoordinatorFejl(409, "Opgaven er afsluttet — genåbn den først");
    const implementeringer = await this.a.implRepo.hentForOpgave(opgave.id);
    if (implementeringer.some((i) => i.status === "koerer")) {
      throw new KoordinatorFejl(409, "En agent implementerer stadig — vent, til den er færdig");
    }

    const kommentarer = kommentarKaede(await this.a.punktRepo.hentForOpgave(opgave.id), punkt.id);
    const navne = new Map((await this.a.agentRepo.hentAlle()).map((a) => [a.id, a.navn]));
    const tekster = kommentarer.map((k) => k.tekst);
    const kontekst = [opgave.beskrivelse, bygReevalueringsKontekst(punkt, tekster, navne)]
      .filter(Boolean)
      .join("\n\n");

    const nyt = await this.analyser(opgave, kontekst, log, kommentarer);
    await this.a.punktRepo.markerErstattet(punkt.id, nyt.id);
    return nyt;
  }
}

function fejlTekst(fejl: unknown): string {
  return fejl instanceof Error ? fejl.message : String(fejl);
}
