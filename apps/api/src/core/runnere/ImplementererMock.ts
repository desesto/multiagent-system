// ImplementererMock — gratis og deterministisk. Skriver en rigtig fil i
// worktreet, så hele kæden (commit, ændrede filer, gennemsyn, oprydning)
// kan testes uden et eneste LLM-kald.

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  IImplementerer,
  ImplementeringsBestilling,
  ImplementeringsResultat,
} from "../../../../../packages/domain/src/contracts/kontrakter";

export class ImplementererMock implements IImplementerer {
  async implementer(b: ImplementeringsBestilling): Promise<ImplementeringsResultat> {
    const readme = path.join(b.arbejdsmappe, "README.md");
    const laest = await readFile(readme, "utf8").then(
      () => ["README.md"],
      () => []
    );
    // Ændrer README, så "Filer ændret"-fanen også kan prøves gratis
    if (laest.length > 0) {
      await appendFile(readme, `\n<!-- Mock: ${b.opgave.titel} -->\n`);
    }
    const fil = path.join(b.arbejdsmappe, "agent-noter", `${b.opgave.id.slice(0, 8)}.md`);
    await mkdir(path.dirname(fil), { recursive: true });
    await writeFile(
      fil,
      [
        `# ${b.opgave.titel}`,
        ``,
        `Valgt retning: ${b.valgtMulighed.beskrivelse}`,
        ``,
        ...(b.kommentarer.length > 0
          ? [`Dine kommentarer, som agenten fik med:`, ...b.kommentarer.map((k) => `- ${k}`), ``]
          : []),
        `(Mock-implementering — den rigtige motor skriver kode her.)`,
        ``,
      ].join("\n")
    );
    return {
      opsummering: `Mock: oprettede agent-noter/${path.basename(fil)}${laest.length > 0 ? " og tilføjede en kommentar i README.md" : ""}.${b.billeder.length > 0 ? ` Fik ${b.billeder.length} billede(r) med.` : ""}\n\nDu skal selv:\n- Intet — dette er en test af kæden.`,
      laesteFiler: laest,
      forbrug: null,
      prisUsd: null,
      stoppetAf: null,
    };
  }
}
