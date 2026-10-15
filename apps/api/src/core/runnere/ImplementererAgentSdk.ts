// ImplementererAgentSdk — implementering med Claude Agent SDK, den
// samme motor som Claude Code. Fordelen frem for at bygge selv: agenten
// kan tjekke og rette sin egen kode, før den afleverer.
//
// Sikkerhed i tre lag:
//  1. Kun fem filværktøjer findes overhovedet — ingen kommandolinje.
//  2. "dontAsk": alt, der ikke er forhåndsgodkendt, afvises automatisk.
//  3. VORES stivagt kører før hvert filkald (samme regler som læsning).
// Typetjekket er et eget værktøj, som vores kode udfører med en fast kommando.

import {
  createSdkMcpServer,
  query,
  tool,
  type HookCallback,
  type SDKMessage,
  type SDKResultMessage,
  type SDKUserMessage,
} from "@anthropic-ai/claude-agent-sdk";
import path from "node:path";
import type {
  IImplementerer,
  ImplementeringsBestilling,
  ImplementeringsResultat,
} from "../../../../../packages/domain/src/contracts/kontrakter";
import { vurderAgentSti } from "../../vaerktoejer/stiSikkerhed";
import { koerTypetjek } from "../../vaerktoejer/typetjek";
import { bygImplementeringsBestilling, bygImplementeringsInstruks } from "./implementeringPrompt";
import { medBilleder } from "./billedBlokke";
import type { AgentBillede } from "../../../../../packages/domain/src/contracts/vedhaeftningRepository";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_RUNDER = Number(process.env.MAX_IMPLEMENTERING_RUNDER ?? 40);
const MAX_USD = Number(process.env.MAX_IMPLEMENTERING_USD ?? 1);
const FILVAERKTOEJER = ["Read", "Glob", "Grep", "Edit", "Write"];

export class ImplementererAgentSdk implements IImplementerer {
  async implementer(b: ImplementeringsBestilling): Promise<ImplementeringsResultat> {
    const rod = b.arbejdsmappe;
    const typetjek = createSdkMcpServer({
      name: "multiagent",
      tools: [
        tool(
          "tjek_typer",
          "Kører TypeScripts typetjek på projektet og returnerer eventuelle fejl. Kald det, når du er færdig.",
          {},
          async () => ({ content: [{ type: "text", text: await koerTypetjek(rod) }] })
        ),
      ],
    });
    const laesteFiler = new Set<string>();
    let resultat: SDKResultMessage | null = null;

    for await (const besked of query({
      prompt: bestilling(bygImplementeringsBestilling(b), b.billeder),
      options: {
        cwd: rod,
        model: MODEL,
        maxTurns: MAX_RUNDER,
        maxBudgetUsd: MAX_USD,
        tools: FILVAERKTOEJER,
        allowedTools: [...FILVAERKTOEJER, "mcp__multiagent__tjek_typer"],
        permissionMode: "dontAsk",
        settingSources: [], // ignorér brugerens egne Claude Code-indstillinger
        persistSession: false,
        mcpServers: { multiagent: typetjek },
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append: bygImplementeringsInstruks(b.agent, b.hukommelse),
        },
        hooks: { PreToolUse: [{ matcher: FILVAERKTOEJER.join("|"), hooks: [stivagt(rod)] }] },
      },
    })) {
      noterLaesteFiler(besked, rod, laesteFiler);
      if (besked.type === "result") resultat = besked;
    }
    return tilResultat(resultat, [...laesteFiler]);
  }
}

/**
 * Stierne et filværktøj vil røre. Read/Edit/Write har file_path,
 * Glob/Grep har path. Mønstre er IKKE stier — Grep's "pattern" søger i
 * indholdet — men et Glob-mønster eller Grep-filter, der peger ud af
 * mappen (absolut eller med ..), tjekkes som en sti.
 */
export function stierIKald(vaerktoej: string, input: Record<string, unknown>): string[] {
  const tekst = (felt: string): string | null =>
    typeof input[felt] === "string" && input[felt] !== "" ? (input[felt] as string) : null;
  const pegerUd = (m: string): boolean => path.isAbsolute(m) || m.split(/[\\/]/).includes("..");
  const stier = [tekst("file_path"), tekst("path")];
  const moenster = vaerktoej === "Glob" ? tekst("pattern") : vaerktoej === "Grep" ? tekst("glob") : null;
  if (moenster && pegerUd(moenster)) stier.push(moenster);
  return stier.filter((sti): sti is string => sti !== null);
}

/** Kører vores egne sikkerhedsregler før hvert filkald */
export function stivagt(rod: string): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== "PreToolUse") return {};
    const kald = (input.tool_input ?? {}) as Record<string, unknown>;
    for (const sti of stierIKald(input.tool_name, kald)) {
      const grund = await vurderAgentSti(rod, sti);
      if (grund) {
        console.warn(`[implementering] ${input.tool_name} afvist: ${grund}`);
        return {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: grund,
          },
        };
      }
    }
    return {};
  };
}

/** Revisionsspor: hvilke filer læste agenten? */
export function noterLaesteFiler(besked: SDKMessage, rod: string, filer: Set<string>): void {
  if (besked.type !== "assistant") return;
  for (const blok of besked.message.content) {
    if (blok.type !== "tool_use" || blok.name !== "Read") continue;
    const sti = (blok.input as { file_path?: unknown }).file_path;
    if (typeof sti === "string") {
      filer.add(path.relative(rod, path.resolve(rod, sti)).split(path.sep).join("/"));
    }
  }
}

/** SDK'ens resultat → vores neutrale ImplementeringsResultat */
export function tilResultat(
  r: SDKResultMessage | null,
  laesteFiler: string[]
): ImplementeringsResultat {
  if (!r) throw new Error("Agenten afsluttede uden et resultat");
  if (r.subtype === "error_during_execution" || r.subtype === "error_max_structured_output_retries") {
    throw new Error(`Agenten fejlede: ${r.errors.join(" · ") || r.subtype}`);
  }
  const forbrug = Object.entries(r.modelUsage).reduce(
    (sum, [model, f]) => ({
      model: sum.model ? `${sum.model},${model}` : model,
      kald: sum.kald,
      ind: sum.ind + f.inputTokens,
      cacheSkriv: sum.cacheSkriv + f.cacheCreationInputTokens,
      cacheLaes: sum.cacheLaes + f.cacheReadInputTokens,
      ud: sum.ud + f.outputTokens,
    }),
    { model: "", kald: r.num_turns, ind: 0, cacheSkriv: 0, cacheLaes: 0, ud: 0 }
  );
  const stoppetAf =
    r.subtype === "error_max_turns" ? "runder" : r.subtype === "error_max_budget_usd" ? "budget" : null;
  return {
    opsummering:
      r.subtype === "success"
        ? r.result
        : `Agenten blev stoppet af ${stoppetAf === "runder" ? `loftet på ${MAX_RUNDER} runder` : `budgetloftet på ${MAX_USD} USD`}, før den var færdig.`,
    laesteFiler,
    forbrug: { ...forbrug, model: forbrug.model || MODEL },
    prisUsd: r.total_cost_usd,
    stoppetAf,
  };
}

/**
 * Uden billeder: bestillingen som almindelig tekst. Med billeder: én
 * brugerbesked med tekst + billedblokke, sendt som "streaming input" —
 * Agent SDK'ens måde at tage imod andet end ren tekst.
 */
function bestilling(tekst: string, billeder: AgentBillede[]): string | AsyncIterable<SDKUserMessage> {
  if (billeder.length === 0) return tekst;
  return (async function* (): AsyncGenerator<SDKUserMessage> {
    yield {
      type: "user",
      parent_tool_use_id: null,
      message: { role: "user", content: medBilleder(tekst, billeder) },
    } as SDKUserMessage;
  })();
}
