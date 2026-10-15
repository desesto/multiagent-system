// Teksten i en pull request fra autokør: hvad opgaven var, hvilken
// retning der blev valgt og af hvem, hvad agenten selv siger, og hvilke
// filer der er ændret — så du kan vurdere den uden at åbne systemet.

import type { Implementering } from "../../../../packages/domain/src/domain/implementering";
import type { Opgave } from "../../../../packages/domain/src/domain/opgave";

export function bygPrKrop(d: {
  opgave: Opgave;
  impl: Implementering;
  retning: string;
  valgtAfNavn: string;
  begrundelse: string | null;
}): string {
  const filer = d.impl.aendredeFiler.map((f) => `- \`${f.sti}\` (${f.type}, +${f.tilfoejet} −${f.fjernet})`);
  return [
    d.opgave.beskrivelse ? `**Opgave:** ${d.opgave.beskrivelse}` : "",
    `**Valgt retning** (valgt af ${d.valgtAfNavn}): ${d.retning}`,
    d.begrundelse ? `> ${d.begrundelse}` : "",
    d.impl.fejl ? `⚠️ ${d.impl.fejl}` : "",
    d.impl.opsummering ? `### Agentens opsummering\n\n${d.impl.opsummering}` : "",
    filer.length > 0 ? `### Ændrede filer\n\n${filer.join("\n")}` : "",
    `---\nOprettet af autokør. Gennemse ændringerne, og flet selv — intet flettes automatisk.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
