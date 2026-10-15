// Arkitektens retningsvalg via Anthropics Messages API — ét kort kald,
// uden værktøjer. Forbruget gemmes på autokør-posten og tæller med i
// forbrug og budgetvagt.

import Anthropic from "@anthropic-ai/sdk";
import type { IRetningsvaelger, Retningsvalg } from "../../../../../packages/domain/src/contracts/autokoer";
import { bygValgBesked, bygValgSystem, tolkValg } from "./retningsvalg";
import { nytForbrug, tilfoejForbrug } from "./tokenForbrugAnthropic";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export class RetningsvaelgerAnthropic implements IRetningsvaelger {
  constructor(private readonly klient: Anthropic = new Anthropic()) {}

  async vaelg(input: Parameters<IRetningsvaelger["vaelg"]>[0]): Promise<Retningsvalg> {
    const forbrug = nytForbrug(MODEL);
    const svar = await this.klient.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: bygValgSystem(input),
      messages: [{ role: "user", content: bygValgBesked(input) }],
    });
    tilfoejForbrug(forbrug, svar.usage);
    const tekst = svar.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
    return { ...tolkValg(tekst, input), forbrug };
  }
}
