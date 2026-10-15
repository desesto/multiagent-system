// Mappebrowseren bag "Gennemse filer". Lister KUN mapper inden for
// PROJEKT_ROD og bruger de samme regler som agenternes fil-adgang:
// aldrig .git, node_modules, dist osv., og ingen symlinks ud af roden.
// Skjulte mapper (der starter med .) vises heller ikke.

import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { FilAdgangsFejl } from "../../../../packages/domain/src/contracts/filAdgang";
import type { MappeListe } from "../../../../packages/domain/src/domain/mappe";
import { erForbudtNavn, erIndenfor } from "./stiSikkerhed";

const MAX_MAPPER = 500;

async function findes(sti: string): Promise<boolean> {
  return stat(sti).then(() => true, () => false);
}

/** Lister undermapperne i `sti` (standard: roden). Kaster FilAdgangsFejl ved ugyldig sti. */
export async function listMapper(rod: string, sti?: string): Promise<MappeListe> {
  const rigtigRod = await realpath(rod).catch(() => {
    throw new FilAdgangsFejl(`PROJEKT_ROD findes ikke: ${rod}`);
  });
  const oensket = path.resolve(rigtigRod, sti ?? ".");
  if (!erIndenfor(rigtigRod, oensket)) throw new FilAdgangsFejl("Mappen ligger uden for PROJEKT_ROD");
  const rigtig = await realpath(oensket).catch(() => {
    throw new FilAdgangsFejl("Mappen findes ikke");
  });
  if (!erIndenfor(rigtigRod, rigtig)) throw new FilAdgangsFejl("Mappen peger uden for PROJEKT_ROD");
  if (!(await stat(rigtig)).isDirectory()) throw new FilAdgangsFejl("Stien er ikke en mappe");

  const poster = await readdir(rigtig, { withFileTypes: true });
  const mapper = await Promise.all(
    poster
      .filter((p) => p.isDirectory() && !p.name.startsWith(".") && !erForbudtNavn(p.name))
      .sort((a, b) => a.name.localeCompare(b.name, "da"))
      .slice(0, MAX_MAPPER)
      .map(async (p) => {
        const fuld = path.join(rigtig, p.name);
        return { navn: p.name, sti: fuld, erGitRepo: await findes(path.join(fuld, ".git")) };
      })
  );

  // Brødkrummer: roden og hvert led ned til den viste mappe
  const led = path.relative(rigtigRod, rigtig).split(path.sep).filter(Boolean);
  const brodkrummer = [{ navn: path.basename(rigtigRod), sti: rigtigRod }];
  for (const navn of led) brodkrummer.push({ navn, sti: path.join(brodkrummer.at(-1)!.sti, navn) });

  return {
    sti: rigtig,
    brodkrummer,
    overmappe: rigtig === rigtigRod ? null : path.dirname(rigtig),
    mapper,
    erGitRepo: await findes(path.join(rigtig, ".git")),
  };
}
