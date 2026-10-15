// AgentRunnerAnthropic — agenternes hjerne via Anthropics Messages API.
// Har opgaven et projekt, kører et værktøjsloop: modellen beder om at
// læse filer, vi udfører det (gennem den neutrale dispatcher), og
// sender resultatet tilbage, indtil modellen afgiver sit svar.
//
// Loftet over værktøjskald er budgetvagten i praksis: hver læst fil
// gør de følgende kald dyrere, så loopet SKAL have en ende.
//
// Kan svaret ikke læses (tekst uden om JSON, eller afkortet), får
// modellen ÉN korrektionsrunde. Den er billig, fordi hele samtalen
// allerede ligger i cachen.

import Anthropic from "@anthropic-ai/sdk";
import type {
  IAgentRunner,
  AgentSvar,
} from "../../../../../packages/domain/src/contracts/kontrakter";
import type { IFilAdgang } from "../../../../../packages/domain/src/contracts/filAdgang";
import type { AiAgent } from "../../../../../packages/domain/src/domain/agent";
import type { AgentHukommelse } from "../../../../../packages/domain/src/domain/hukommelse";
import type { Opgave } from "../../../../../packages/domain/src/domain/opgave";
import { udfoerVaerktoej } from "../../vaerktoejer/udfoerVaerktoej";
import { hentProjektOverblik } from "../../vaerktoejer/projektOverblik";
import { bygOpgavePrompt, bygSystemPrompt, tilAgentSvar } from "./agentPrompt";
import { medBilleder } from "./billedBlokke";
import type { AgentBillede } from "../../../../../packages/domain/src/contracts/vedhaeftningRepository";
import { findAgentJson, parseAgentJson, type RaatSvar } from "./agentSvarParser";
import { skalHaveDesign } from "./designSkitse";
import { formaterForbrug, nytForbrug, tilfoejForbrug, type TokenForbrug } from "./tokenForbrugAnthropic";
import { fraKaldAnthropic, tilVaerktoejerAnthropic } from "./vaerktoejerAnthropic";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_VAERKTOEJSKALD = Number(process.env.MAX_VAERKTOEJSKALD ?? 15);
const MAX_SVAR_TOKENS = 8000;
/** Design-skitser fylder meget, så visuelle opgaver får mere plads til svaret */
const MAX_SVAR_TOKENS_MED_DESIGN = 16000;

export class AgentRunnerAnthropic implements IAgentRunner {
  // SDK'en læser selv ANTHROPIC_API_KEY. Klienten kan injiceres i tests.
  constructor(private readonly klient: Anthropic = new Anthropic()) {}

  async koer(
    agent: AiAgent,
    hukommelse: AgentHukommelse,
    opgave: Opgave,
    kontekst: string,
    filAdgang?: IFilAdgang,
    billeder: AgentBillede[] = []
  ): Promise<AgentSvar> {
    const harVaerktoejer = filAdgang !== undefined;
    const medDesign = skalHaveDesign(opgave);
    const system = bygSystemPrompt(agent, hukommelse, harVaerktoejer, medDesign);
    const maxTokens = medDesign ? MAX_SVAR_TOKENS_MED_DESIGN : MAX_SVAR_TOKENS;
    // Filtræet i første besked sparer en runde — og caches derefter
    const overblik = filAdgang ? await hentProjektOverblik(filAdgang) : "";
    const beskeder: Anthropic.MessageParam[] = [
      { role: "user", content: medBilleder(bygOpgavePrompt(opgave, kontekst, overblik), billeder) },
    ];
    const laesteFiler = new Set<string>();
    const forbrug = nytForbrug(MODEL);
    let antalKald = 0;

    // +1: den sidste runde, hvor værktøjer er slået fra og svaret tvinges frem
    for (let runde = 0; runde <= MAX_VAERKTOEJSKALD + 1; runde++) {
      const loftNaaet = antalKald >= MAX_VAERKTOEJSKALD;
      const svar = await this.kald(system, beskeder, harVaerktoejer, loftNaaet, maxTokens);
      tilfoejForbrug(forbrug, svar.usage);

      if (svar.stop_reason !== "tool_use" || !filAdgang) {
        const raat =
          findAgentJson(tekstFra(svar)) ??
          (await this.korrektionsrunde(agent, system, beskeder, svar, harVaerktoejer, forbrug, {
            maxTokens,
            medDesign,
          }));
        console.log(`[agent ${agent.navn}] tokens: ${formaterForbrug(forbrug)}`);
        return tilAgentSvar(raat, agent, [...laesteFiler], forbrug);
      }

      beskeder.push({ role: "assistant", content: svar.content });
      const resultater: Anthropic.ToolResultBlockParam[] = [];
      for (const blok of svar.content) {
        if (blok.type !== "tool_use") continue;
        antalKald++;
        const kald = fraKaldAnthropic(blok);
        const resultat =
          antalKald > MAX_VAERKTOEJSKALD
            ? { tekst: "Loftet over værktøjskald er nået — afgiv dit svar nu", fejl: true }
            : kald
              ? await udfoerVaerktoej(kald, filAdgang)
              : { tekst: `Ukendt værktøj eller ugyldigt input: ${blok.name}`, fejl: true };
        if (resultat.laestFil) laesteFiler.add(resultat.laestFil);
        resultater.push({
          type: "tool_result",
          tool_use_id: blok.id,
          content: resultat.tekst,
          is_error: resultat.fejl,
        });
      }
      console.log(
        `[agent ${agent.navn}] værktøjskald ${Math.min(antalKald, MAX_VAERKTOEJSKALD)}/${MAX_VAERKTOEJSKALD}`
      );
      beskeder.push({ role: "user", content: resultater });
    }

    throw new Error(`${agent.navn} afgav intet svar inden for loftet over værktøjskald`);
  }

  /** Ét kald til API'et. `tvingSvar` slår værktøjerne fra, så modellen må svare */
  private kald(
    system: string,
    beskeder: Anthropic.MessageParam[],
    harVaerktoejer: boolean,
    tvingSvar: boolean,
    maxTokens: number
  ): Promise<Anthropic.Message> {
    return this.klient.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      // Automatisk caching: API'et flytter selv cache-punktet frem,
      // så tidligere runder læses fra cachen til 0,1 × inputpris
      cache_control: { type: "ephemeral" },
      system,
      messages: beskeder,
      ...(harVaerktoejer
        ? {
            tools: tilVaerktoejerAnthropic(),
            tool_choice: tvingSvar ? { type: "none" as const } : { type: "auto" as const },
          }
        : {}),
    });
  }

  /**
   * Svaret kunne ikke læses: bed om det rene JSON-objekt én gang til.
   * Kun tekstblokke sendes tilbage — et afkortet svar kan indeholde et
   * halvt værktøjskald, som API'et ellers ville afvise.
   */
  private async korrektionsrunde(
    agent: AiAgent,
    system: string,
    beskeder: Anthropic.MessageParam[],
    svar: Anthropic.Message,
    harVaerktoejer: boolean,
    forbrug: TokenForbrug,
    valg: { maxTokens: number; medDesign: boolean }
  ): Promise<RaatSvar> {
    const afkortet = svar.stop_reason === "max_tokens";
    console.warn(
      `[agent ${agent.navn}] svaret kunne ikke læses (${beskrivSvar(svar)}) — beder om ren JSON`
    );
    const tekstBlokke = svar.content.filter(
      (blok): blok is Anthropic.TextBlock => blok.type === "text"
    );
    const nyt = await this.kald(
      system,
      [
        ...beskeder,
        { role: "assistant", content: tekstBlokke.length > 0 ? tekstBlokke : "(intet svar)" },
        {
          role: "user",
          content: afkortet
            ? `Dit svar blev afkortet, fordi det var for langt. Giv nu KUN JSON-objektet i det aftalte format, og hold feltet indhold under 300 ord${valg.medDesign ? ". Gør hver design-skitse meget kort: højst 1.200 tegn, kun det vigtigste layout, minimal CSS" : ""}.`
            : "Dit svar indeholdt ikke det aftalte JSON-objekt. Giv nu KUN JSON-objektet i det aftalte format — ingen tekst før eller efter.",
        },
      ],
      harVaerktoejer,
      true,
      valg.maxTokens
    );
    tilfoejForbrug(forbrug, nyt.usage);
    const tekst = tekstFra(nyt);
    if (!tekst.trim()) {
      throw new Error(`Agenten svarede uden tekst — også efter en ny anmodning (${beskrivSvar(nyt)})`);
    }
    try {
      return parseAgentJson(tekst);
    } catch (fejl) {
      // Med årsagen i beskeden kan fejlen forstås uden at gætte
      throw new Error(`${(fejl as Error).message} (${beskrivSvar(nyt)})`);
    }
  }
}

function tekstFra(svar: Anthropic.Message): string {
  return svar.content
    .filter((blok): blok is Anthropic.TextBlock => blok.type === "text")
    .map((blok) => blok.text)
    .join("\n");
}

/** Fx "stop: max_tokens · 8.000 tokens ud" — til log og fejlbeskeder */
function beskrivSvar(svar: Anthropic.Message): string {
  const ud = svar.usage?.output_tokens;
  return [`stop: ${svar.stop_reason ?? "ukendt"}`, ud !== undefined ? `${ud.toLocaleString("da-DK")} tokens ud` : ""]
    .filter(Boolean)
    .join(" · ");
}
