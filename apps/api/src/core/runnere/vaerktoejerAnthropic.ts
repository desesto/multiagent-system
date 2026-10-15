// Oversættelse mellem de NEUTRALE værktøjer (packages/domain) og
// Anthropics format. Skiftes udbyder, skrives en tilsvarende
// vaerktoejer<NyUdbyder>.ts — resten af systemet er uberørt.

import type Anthropic from "@anthropic-ai/sdk";
import {
  VAERKTOEJER,
  type VaerktoejsKald,
} from "../../../../../packages/domain/src/contracts/filAdgang";

/** Neutrale definitioner → Anthropics Tool-format (JSON Schema) */
export function tilVaerktoejerAnthropic(): Anthropic.Tool[] {
  return VAERKTOEJER.map((v) => ({
    name: v.navn,
    description: v.beskrivelse,
    input_schema: {
      type: "object" as const,
      properties: Object.fromEntries(
        v.parametre.map((p) => [p.navn, { type: "string", description: p.beskrivelse }])
      ),
      required: v.parametre.filter((p) => p.paakraevet).map((p) => p.navn),
    },
  }));
}

/**
 * Anthropics tool_use-blok → neutralt VaerktoejsKald.
 * Returnerer null ved ukendt værktøj eller manglende felter — modellen
 * kan i sjældne tilfælde sende ugyldigt input, og det skal ikke crashe.
 */
export function fraKaldAnthropic(blok: Anthropic.ToolUseBlock): VaerktoejsKald | null {
  const input = (blok.input ?? {}) as Record<string, unknown>;
  const tekstFelt = (navn: string): string | null =>
    typeof input[navn] === "string" ? (input[navn] as string) : null;

  switch (blok.name) {
    case "list_filer": {
      return { type: "list_filer", sti: tekstFelt("sti") ?? "." };
    }
    case "laes_fil": {
      const sti = tekstFelt("sti");
      return sti ? { type: "laes_fil", sti } : null;
    }
    case "soeg": {
      const tekst = tekstFelt("tekst");
      return tekst ? { type: "soeg", tekst, sti: tekstFelt("sti") ?? "." } : null;
    }
    default:
      return null;
  }
}
