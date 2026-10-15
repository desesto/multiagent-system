// Orchestrator: en RIGTIG klasse, fordi den har opførsel og
// orkestrerer tilstand. Den kender kun kontrakterne — aldrig
// konkrete implementeringer. Alt injiceres via constructoren,
// så hele flowet kan testes med mocks.
//
// Husk princippet fra designdokumentet: orchestratoren koordinerer,
// den løser ikke. Agenterne løser.

import type { AgentBillede } from "../../../../packages/domain/src/contracts/vedhaeftningRepository";
import type {
  IAgentRunner,
  IMemoryStore,
  IRolleRegistry,
  IRapportKilde,
  ISekretaer,
  AgentSvar,
} from "../../../../packages/domain/src/contracts/kontrakter";
import type { IFilAdgang } from "../../../../packages/domain/src/contracts/filAdgang";
import type { AiAgent, AgentId } from "../../../../packages/domain/src/domain/agent";
import type {
  Opgave,
  OpgaveType,
  Tildeling,
  Beslutningspunkt,
  Retrospektiv,
} from "../../../../packages/domain/src/domain/opgave";
import type { ConfigLayer } from "../../../../packages/domain/src/domain/hukommelse";

export class Orchestrator {
  constructor(
    private readonly runner: IAgentRunner,
    private readonly memory: IMemoryStore,
    private readonly registry: IRolleRegistry,
    /** Bemærk: IKKE den rå observationslog — kun destillerede rapporter */
    private readonly rapporter: IRapportKilde,
    /** Sekretæren: komprimerer og forbereder, beslutter aldrig */
    private readonly sekretaer: ISekretaer
  ) {}

  /**
   * Konsoliderer flere agenters svar til ÉT beslutningspunkt via
   * sekretæren, i stedet for at brugeren mødes af N separate punkter.
   * Orchestratoren rører aldrig de fulde svar — sekretæren briefer,
   * og valgmulighederne føres uændret videre til brugeren.
   */
  async samlBeslutningspunkt(
    opgave: Opgave,
    svar: AgentSvar[]
  ): Promise<Beslutningspunkt> {
    const briefing = await this.sekretaer.lavBriefing(opgave, svar);
    return {
      id: crypto.randomUUID(),
      opgaveId: opgave.id,
      stilletAf: "orchestrator",
      spoergsmaal: briefing.resume,
      valgmuligheder: svar.flatMap((s) => s.foreslaaedeValgmuligheder),
      valgtMulighedId: null,
      besluttetTidspunkt: null,
    };
  }

  /**
   * Trin 1 i flowet: brugeren opretter en opgave.
   * TODO: persistér i Postgres og returnér den gemte record.
   */
  async opretOpgave(
    brugerId: string,
    titel: string,
    beskrivelse: string,
    type: OpgaveType,
    fokuspunkter: string[]
  ): Promise<Opgave> {
    const opgave: Opgave = {
      id: crypto.randomUUID(),
      titel,
      beskrivelse,
      type,
      omraade: null,
      status: "oprettet",
      fokuspunkter,
      oprettetAfBrugerId: brugerId,
      projektId: null,
      projektSti: null,
      oprettetTidspunkt: new Date().toISOString(),
    };
    // TODO: gem i database
    return opgave;
  }

  /**
   * Trin 2: nedbryd opgaven og foreslå agenter via registret.
   * Kører deduplikeringstjek før der foreslås nye roller.
   * TODO: brug en LLM-kald (via runner) til selve nedbrydningen.
   */
  async nedbrydOpgave(opgave: Opgave): Promise<{
    deltrin: string[];
    foreslaaedeAgenter: AiAgent[];
  }> {
    // TODO: nedbryd via LLM, match deltrin mod registry.findLignende()
    throw new Error("Ikke implementeret endnu");
  }

  /**
   * Trin 3: brugeren tildeler agenter og vælger valgfrie
   * karakteristika. De valgte karakteristika lever på Tildelingen.
   */
  async tildelAgent(
    opgave: Opgave,
    agentId: AgentId,
    valgteKarakteristika: string[]
  ): Promise<Tildeling> {
    const tildeling: Tildeling = {
      id: crypto.randomUUID(),
      opgaveId: opgave.id,
      agentId,
      valgteKarakteristika,
      tildeltTidspunkt: new Date().toISOString(),
    };
    // TODO: gem i database
    return tildeling;
  }

  /**
   * Trin 4a: kør ÉN agent og få dens svar. Bruges parallelt for alle
   * opgavens agenter — konsolideringen sker i samlBeslutningspunkt.
   */
  async koerAgent(
    agent: AiAgent,
    opgave: Opgave,
    kontekst: string,
    filAdgang?: IFilAdgang,
    billeder: AgentBillede[] = []
  ): Promise<AgentSvar> {
    const hukommelse = await this.memory.hent(agent.id);
    return this.runner.koer(agent, hukommelse, opgave, kontekst, filAdgang, billeder);
  }

  /**
   * Trin 5: brugeren har valgt retning — registrér beslutningen.
   * TODO: opdatér beslutningspunktet i databasen og injicér valget
   * i agenternes videre kontekst.
   */
  async registrerBeslutning(
    punkt: Beslutningspunkt,
    valgtMulighedId: string
  ): Promise<Beslutningspunkt> {
    return {
      ...punkt,
      valgtMulighedId,
      besluttetTidspunkt: new Date().toISOString(),
    };
  }

  /**
   * Trin 6: afslut opgaven. Refleksioner skrives til memory-laget,
   * config-ændringer godkendes eksplicit, og komprimering køres
   * hvis storens trigger siger til.
   */
  async afslutOpgave(
    opgave: Opgave,
    retrospektiv: Retrospektiv,
    agentSvar: AgentSvar[]
  ): Promise<void> {
    for (const svar of agentSvar) {
      if (svar.refleksion) {
        await this.memory.tilfoejRefleksion(svar.agentId, svar.refleksion);
      }
      if (await this.memory.skalKomprimeres(svar.agentId)) {
        await this.memory.komprimer(svar.agentId);
      }
    }
    // TODO: gem retrospektiv og sæt opgave.status = "afsluttet".

    // Projektgrænse: Intern Analyser har kørt sin batch-analyse.
    // Orchestratoren læser KUN destillatet — aldrig rå observationer.
    const rapport = await this.rapporter.hentSenesteRapport();
    if (rapport) {
      const hardFlags = rapport.eskalationer.filter((e) => e.niveau >= 3);
      if (hardFlags.length > 0) {
        // TODO: håndtér eskalationer (fx udløs drift-debat eller
        // forelæg for brugeren) FØR næste projekt må starte.
        await this.rapporter.kvitter(rapport.id);
      }
    }
  }

  /**
   * Godkendelsesporten: en agents foreslåede config-ændring skrives
   * kun igennem her. En enkelt dårlig opgave kan ikke korrumpere
   * en veltunet agents config.
   */
  async godkendConfigAendring(
    agentId: AgentId,
    nyConfig: ConfigLayer
  ): Promise<void> {
    await this.memory.opdaterConfig(agentId, {
      ...nyConfig,
      version: nyConfig.version + 1,
    });
  }
}
