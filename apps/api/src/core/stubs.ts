// MIDLERTIDIGE stubs: opfylder kontrakterne med tomme/faste svar, så
// orchestratoren kan køre FØR hukommelsen (backlog 5), sekretæren (6),
// rolleregistret (7) og Intern Analyser (8) er bygget. Hver stub
// erstattes af en rigtig implementering — resten af systemet mærker
// det ikke, fordi kontrakten er den samme.

import type {
  IMemoryStore,
  IRolleRegistry,
  IRapportKilde,
  ISekretaer,
  AgentSvar,
  Briefing,
  AnalyseRapport,
} from "../../../../packages/domain/src/contracts/kontrakter";
import type { AgentHukommelse } from "../../../../packages/domain/src/domain/hukommelse";
import type { Rolle } from "../../../../packages/domain/src/domain/rolle";
import type { Opgave } from "../../../../packages/domain/src/domain/opgave";

export class StubMemoryStore implements IMemoryStore {
  async hent(agentId: string): Promise<AgentHukommelse> {
    return {
      identitet: {
        agentId,
        oprindeligtFormaal: "",
        scopeGraenser: [],
        oprettetTidspunkt: new Date().toISOString(),
      },
      config: {
        systemPrompt: "",
        foretrukneVaerktoejer: [],
        outputFormatPraeferencer: "",
        kendteFejlmoenstre: [],
        version: 1,
      },
      memory: {
        projektLog: [],
        refleksioner: [],
        wisdomDokument: "",
        sidstKomprimeretTidspunkt: null,
      },
    };
  }
  async tilfoejRefleksion(): Promise<void> {}
  async opdaterConfig(): Promise<void> {}
  async skalKomprimeres(): Promise<boolean> {
    return false;
  }
  async komprimer(): Promise<string> {
    return "";
  }
}

export class StubRolleRegistry implements IRolleRegistry {
  async hentAlle(): Promise<Rolle[]> {
    return [];
  }
  async findLignende(): Promise<{ rolle: Rolle; similaritet: number } | null> {
    return null;
  }
  async opret(): Promise<Rolle> {
    throw new Error("Rolleregistret er ikke bygget endnu (backlog punkt 7)");
  }
}

export class StubRapportKilde implements IRapportKilde {
  async hentSenesteRapport(): Promise<AnalyseRapport | null> {
    return null;
  }
  async kvitter(): Promise<void> {}
}

export class StubSekretaer implements ISekretaer {
  async lavBriefing(opgave: Opgave, svar: AgentSvar[]): Promise<Briefing> {
    return {
      opgaveId: opgave.id,
      resume: svar.map((s) => s.resume).join(" "),
      aabneSpoergsmaal: [],
      indstilling: null,
      genereretTidspunkt: new Date().toISOString(),
    };
  }
}
