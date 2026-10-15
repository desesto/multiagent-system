// Kontrakter for autokør: køen, arkitektens valg og pull requests.

import type { AiAgent } from "../domain/agent";
import type { AutokoerPost } from "../domain/autokoer";
import type { TokenForbrug } from "../domain/forbrug";
import type { Beslutningspunkt, Opgave } from "../domain/opgave";

export type AutokoerOpdatering = Partial<
  Pick<
    AutokoerPost,
    | "status"
    | "valgtAf"
    | "begrundelse"
    | "implementeringId"
    | "prUrl"
    | "besked"
    | "forbrug"
    | "startetTidspunkt"
    | "afsluttetTidspunkt"
  >
> & { valgtAfAgentId?: string | null };

export interface IAutokoerRepository {
  /** Sætter opgaverne i kø. Opgaver, der allerede venter eller kører, springes over. */
  tilfoej(opgaveIder: string[]): Promise<number>;
  hentForProjekt(projektId: string): Promise<AutokoerPost[]>;
  /** Den post, der har ventet længst — på tværs af projekter */
  naeste(): Promise<AutokoerPost | null>;
  opdater(id: string, felter: AutokoerOpdatering): Promise<void>;
  /** Kun ventende poster kan fjernes */
  fjern(id: string): Promise<boolean>;
  antalStartetSiden(tidspunkt: Date): Promise<number>;
  /** Ved opstart: poster, der kørte, da serveren stoppede, markeres som fejlet */
  markerAfbrudte(): Promise<number>;
}

export interface Retningsvalg {
  mulighedId: string;
  begrundelse: string;
  forbrug: TokenForbrug | null;
}

/** Vælger retning på brugerens vegne — i autokør er det arkitekten */
export interface IRetningsvaelger {
  vaelg(input: {
    agent: AiAgent;
    opgave: Opgave;
    punkt: Beslutningspunkt;
    /** Agenternes korte resuméer, med navn */
    resumeer: { agentNavn: string; resume: string }[];
    kommentarer: string[];
  }): Promise<Retningsvalg>;
}

export interface NyPullRequest {
  repoRod: string;
  worktreeSti: string;
  /** Agentens lokale gren, fx agent/a3f29c1e */
  lokalGren: string;
  /** Grenens navn på GitHub — skal starte med agent/ */
  fjernGren: string;
  titel: string;
  krop: string;
  /** Kladde, hvis arbejdet kan være ufærdigt (fx stoppet af et loft) */
  kladde: boolean;
}

export interface IPullRequestOpretter {
  /** Kaster med en forklaring, hvis værktøjet ikke er klar (fx ikke logget ind) */
  tjekKlar(): Promise<void>;
  /** Pusher grenen og opretter pull requesten. Returnerer dens adresse (null i mock). */
  opret(pr: NyPullRequest): Promise<string | null>;
}
