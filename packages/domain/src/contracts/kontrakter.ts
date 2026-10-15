// Kontrakter: interfaces der beskriver OPFØRSEL uden at binde sig til
// en implementering. Det er her udskifteligheden bor — Postgres kan
// byttes ud med in-memory i tests, LLM-udbyderen kan skiftes, og
// komprimeringsstrategien kan udvikles uden at røre orchestratoren.

import type { AiAgent, AgentId } from "../domain/agent";
import type { AgentHukommelse, ConfigLayer, Refleksion } from "../domain/hukommelse";
import type { Opgave, Valgmulighed } from "../domain/opgave";
import type { Rolle } from "../domain/rolle";
import type { IFilAdgang } from "./filAdgang";
import type { TokenForbrug } from "../domain/forbrug";
import type { AgentBillede } from "./vedhaeftningRepository";

/** Hvad en agent svarer med efter en kørsel. */
export interface AgentSvar {
  agentId: AgentId;
  /** Kort, direkte spørgsmål til brugeren — beslutningspunktets overskrift */
  spoergsmaal: string;
  /** Fuldt ræsonnement — kan altid foldes ud af brugeren, ALDRIG i orchestratorens kontekst */
  indhold: string;
  /** 2-3 sætninger — det ENESTE orchestratoren bærer videre i sin kontekst */
  resume: string;
  /** Muligheder agenten vil have brugeren til at vælge imellem */
  foreslaaedeValgmuligheder: Valgmulighed[];
  /** Udfyldes ved opgaveafslutning */
  refleksion: Refleksion | null;
  /** Filer agenten faktisk læste — revisionssporet for dens forslag */
  laesteFiler: string[];
  /** Rådata til analyse af tokens og priser — null for mocken */
  forbrug: TokenForbrug | null;
}

/**
 * Kørslen af en agent mod en LLM. Orchestratoren kender kun denne
 * kontrakt — ikke hvilken model eller udbyder der ligger bagved.
 */
export interface IAgentRunner {
  koer(
    agent: AiAgent,
    hukommelse: AgentHukommelse,
    opgave: Opgave,
    kontekst: string,
    /** Udeladt = opgaven har intet projekt, agenten kan ikke læse filer */
    filAdgang?: IFilAdgang,
    /** Billeder, brugeren har vedhæftet opgaven og kommentarerne */
    billeder?: AgentBillede[]
  ): Promise<AgentSvar>;
}

/** Alt, en implementeringskørsel skal vide */
export interface ImplementeringsBestilling {
  agent: AiAgent;
  hukommelse: AgentHukommelse;
  opgave: Opgave;
  valgtMulighed: Valgmulighed;
  /** Ræsonnementet fra den agent, der foreslog den valgte retning */
  raesonnement: string;
  /** Brugerens kommentarer — har forrang for retningsbeskrivelsen ved konflikt */
  kommentarer: string[];
  /** Billeder fra opgaven og kommentarerne */
  billeder: AgentBillede[];
  /** Mappen agenten arbejder i — et worktree på agentens egen gren */
  arbejdsmappe: string;
}

export interface ImplementeringsResultat {
  /** Agentens opsummering til brugeren */
  opsummering: string;
  laesteFiler: string[];
  forbrug: TokenForbrug | null;
  prisUsd: number | null;
  /** Sat hvis kørslen blev stoppet af et loft — arbejdet kan være ufærdigt */
  stoppetAf: "runder" | "budget" | null;
}

/**
 * Skriver koden til en valgt retning i en given arbejdsmappe.
 * Committer IKKE — det gør koordinatoren, så git-historikken altid
 * er under systemets kontrol, uanset hvilken motor der skriver.
 */
export interface IImplementerer {
  implementer(bestilling: ImplementeringsBestilling): Promise<ImplementeringsResultat>;
}

/**
 * Persistens og komprimering af agenthukommelse.
 * Komprimeringstriggeren (efter N projekter? M tokens?) er et åbent
 * designspørgsmål — derfor er den gemt bag skalKomprimeres().
 */
export interface IMemoryStore {
  hent(agentId: AgentId): Promise<AgentHukommelse>;
  tilfoejRefleksion(agentId: AgentId, refleksion: Refleksion): Promise<void>;
  /** Må KUN kaldes af orchestratoren efter godkendelse */
  opdaterConfig(agentId: AgentId, nyConfig: ConfigLayer): Promise<void>;
  skalKomprimeres(agentId: AgentId): Promise<boolean>;
  /** Destillerer refleksioner til nyt wisdom-dokument, returnerer det */
  komprimer(agentId: AgentId): Promise<string>;
}

/** Rolleregistret inkl. deduplikeringstjekket (embedding-similaritet). */
export interface IRolleRegistry {
  hentAlle(): Promise<Rolle[]>;
  /** Returnerer nærmeste eksisterende rolle hvis similariteten er over tærsklen */
  findLignende(
    formaal: string
  ): Promise<{ rolle: Rolle; similaritet: number } | null>;
  opret(rolle: Omit<Rolle, "id" | "oprettetTidspunkt">): Promise<Rolle>;
}

// ---------------------------------------------------------------
// Observation vs. rapport — to niveauer med hver sin læser.
// Princippet er det samme som wisdom-dokumentet: rå data i fuldt
// omfang ét sted, destillat i konteksten. Orchestratorens svaghed
// er store kontekster, så den ser ALDRIG den rå strøm.
// ---------------------------------------------------------------

/** Rå observation. Skrives og læses KUN af Intern Analyser. */
export interface Observation {
  niveau: 1 | 2 | 3 | 4; // eskaleringsstigen fra designdokumentet (afsnit 6.2)
  agentId: AgentId | null;
  besked: string;
  tidspunkt: string;
}

/** Intern Analysers eget arbejdslager — orchestratoren har ingen adgang. */
export interface IObservationslog {
  skriv(observation: Observation): Promise<void>;
  laesAlle(agentId?: AgentId): Promise<Observation[]>;
}

/** Én eskalation, destilleret: én sætning problem, én sætning anbefaling. */
export interface Eskalation {
  niveau: 3 | 4; // kun hard flag og emergency halt når orchestratoren
  agentId: AgentId | null;
  problem: string;
  anbefaling: string;
}

/**
 * Destilleret rapport genereret af Intern Analyser ved projektgrænser
 * (batch-analysen fra afsnit 6.3). Det ENESTE orchestratoren læser.
 * Niveau 1-2 observationer forbliver i loggen som Analyserens
 * arbejdsmateriale og indgår kun aggregeret i resuméet.
 */
export interface AnalyseRapport {
  id: string;
  /** Få sætningers overblik over systemets tilstand */
  resume: string;
  eskalationer: Eskalation[];
  driftScores: Record<AgentId, number>;
  genereretTidspunkt: string;
}

/** Orchestratorens ENESTE vindue ind til Intern Analyserens arbejde. */
export interface IRapportKilde {
  hentSenesteRapport(): Promise<AnalyseRapport | null>;
  /** Niveau 3-eskalationer kræver kvittering før næste projekt (afsnit 6.2) */
  kvitter(rapportId: string): Promise<void>;
}

// ---------------------------------------------------------------
// Sekretæren — orchestratorens kontekstforvalter.
// Komprimerer og forbereder; ruter aldrig, beslutter aldrig,
// taler aldrig direkte med brugeren. Implementeres som en helt
// almindelig agent i registret (egen rolle, hukommelse, wisdom),
// så den bliver bedre til at briefe over tid.
// ---------------------------------------------------------------

export interface Briefing {
  opgaveId: string;
  /** Samlet situationsbillede på få sætninger — orchestratorens arbejdskontekst */
  resume: string;
  /** Uafklarede punkter der kræver beslutning */
  aabneSpoergsmaal: string[];
  /**
   * Sekretærens anbefaling — ALDRIG en beslutning. Hvis rådgiverdelen
   * vokser, er det et split-kandidat jf. dokumentets ét-formål-princip.
   */
  indstilling: string | null;
  genereretTidspunkt: string;
}

export interface ISekretaer {
  /** Konsoliderer flere agenters svar til én briefing for orchestratoren */
  lavBriefing(opgave: Opgave, svar: AgentSvar[]): Promise<Briefing>;
}
