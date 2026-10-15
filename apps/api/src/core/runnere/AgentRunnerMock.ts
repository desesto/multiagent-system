// AgentRunnerMock — gratis og deterministisk. Har opgaven et projekt,
// kører mocken de RIGTIGE værktøjer gennem den rigtige dispatcher,
// så hele fil-kæden (sikkerhed, læsning, revisionsspor) kan testes
// uden et eneste LLM-kald.

import type { AgentBillede } from "../../../../../packages/domain/src/contracts/vedhaeftningRepository";
import type { IAgentRunner, AgentSvar } from "../../../../../packages/domain/src/contracts/kontrakter";
import type { IFilAdgang } from "../../../../../packages/domain/src/contracts/filAdgang";
import type { AiAgent } from "../../../../../packages/domain/src/domain/agent";
import type { AgentHukommelse } from "../../../../../packages/domain/src/domain/hukommelse";
import type { Opgave } from "../../../../../packages/domain/src/domain/opgave";
import { udfoerVaerktoej } from "../../vaerktoejer/udfoerVaerktoej";
import { NY_VURDERING } from "./agentPrompt";
import { skalHaveDesign } from "./designSkitse";

const KANDIDAT_FILER = ["README.md", "package.json"];

export class AgentRunnerMock implements IAgentRunner {
  async koer(
    agent: AiAgent,
    _hukommelse: AgentHukommelse,
    opgave: Opgave,
    kontekst: string,
    filAdgang?: IFilAdgang,
    billeder: AgentBillede[] = []
  ): Promise<AgentSvar> {
    const { observation, laesteFiler } = filAdgang
      ? await kigIProjektet(filAdgang)
      : { observation: "Opgaven har intet projekt, så jeg har ikke læst filer.", laesteFiler: [] };

    return {
      agentId: agent.id,
      spoergsmaal: kontekst.includes(NY_VURDERING)
        ? `Ny vurdering af "${opgave.titel}" — hvilken retning nu?`
        : `Hvordan skal vi gribe "${opgave.titel}" an?`,
      indhold: `${observation}${billedNote(billeder)}\n\nJeg ser to grundlæggende veje: den hurtige og den strukturerede. (Mock-svar — fuldt ræsonnement kommer fra den rigtige runner.)`,
      resume: `${agent.navn} har fremlagt to muligheder og afventer brugerens retningsvalg.`,
      foreslaaedeValgmuligheder: [
        {
          id: crypto.randomUUID(),
          beskrivelse: `${agent.navn}s mulighed A: hurtig og simpel`,
          fordele: ["Hurtig at bygge"],
          ulemper: ["Sværere at skalere"],
          anbefaletAf: [agent.id],
          foreslaaetAf: agent.id,
          designHtml: skalHaveDesign(opgave) ? mockDesign(`${agent.navn}: A`, "kompakt liste") : null,
        },
        {
          id: crypto.randomUUID(),
          beskrivelse: `${agent.navn}s mulighed B: microservice-opdelt`,
          fordele: ["Genbrugelig", "Skalerbar"],
          ulemper: ["Mere opsætning"],
          anbefaletAf: [],
          foreslaaetAf: agent.id,
          designHtml: skalHaveDesign(opgave) ? mockDesign(`${agent.navn}: B`, "kort i et gitter") : null,
        },
      ],
      refleksion: null,
      laesteFiler,
      forbrug: null,
    };
  }
}

async function kigIProjektet(
  filAdgang: IFilAdgang
): Promise<{ observation: string; laesteFiler: string[] }> {
  const liste = await udfoerVaerktoej({ type: "list_filer", sti: "." }, filAdgang);
  const antal = liste.fejl ? 0 : liste.tekst.split("\n").length;
  for (const sti of KANDIDAT_FILER) {
    const laest = await udfoerVaerktoej({ type: "laes_fil", sti }, filAdgang);
    if (!laest.fejl) {
      return {
        observation: `Projektet har ${antal} filer og mapper. Jeg læste ${sti} (${laest.tekst.length} tegn).`,
        laesteFiler: [sti],
      };
    }
  }
  return { observation: `Projektet har ${antal} filer og mapper.`, laesteFiler: [] };
}

/** En lille, statisk skitse, så design-visningen kan prøves uden LLM */
function mockDesign(titel: string, layout: string): string {
  const kort = layout.startsWith("kort");
  const elementer = Array.from({ length: kort ? 4 : 3 }, (_, i) => `<div class="e">Element ${i + 1}</div>`).join("");
  return `<!doctype html><style>
body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#17161f;color:#e8e6f0}
h1{font-size:18px;margin:0 0 16px}.l{display:${kort ? "grid" : "flex"};${kort ? "grid-template-columns:1fr 1fr" : "flex-direction:column"};gap:10px}
.e{background:#23212e;border:1px solid #3a3748;border-radius:8px;padding:${kort ? "28px 14px" : "10px 14px"}}
.n{display:inline-block;margin-top:16px;background:#8f7ff0;color:#14121f;border-radius:6px;padding:8px 14px;font-weight:600}
</style><h1>${titel} — ${layout}</h1><div class="l">${elementer}</div><span class="n">Ny knap</span>`;
}

/** Mocken kan ikke se billeder, men fortæller, at den fik dem — så kæden kan testes gratis */
function billedNote(billeder: AgentBillede[]): string {
  if (billeder.length === 0) return "";
  return `\n\nJeg fik ${billeder.length} billede(r) med: ${billeder.map((b) => b.etiket).join("; ")}.`;
}
