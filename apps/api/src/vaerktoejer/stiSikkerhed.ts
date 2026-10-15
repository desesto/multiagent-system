// Sikkerhedsreglerne for fil-adgang — samlet ét sted, så de kan
// testes isoleret og aldrig omgås af en ny implementering.

import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { FilAdgangsFejl } from "../../../../packages/domain/src/contracts/filAdgang";

/** Mapper og filer agenter ALDRIG må se, uanset hvor de ligger */
const FORBUDTE_MAPPER = new Set([".git", "node_modules", "dist", "build", ".idea"]);

export function erForbudtNavn(navn: string): boolean {
  return FORBUDTE_MAPPER.has(navn) || navn === ".env" || navn.startsWith(".env.");
}

/**
 * Oversætter en relativ sti fra agenten til en absolut sti og sikrer,
 * at den ligger inden for projektroden. Kaster FilAdgangsFejl ved
 * forsøg på at gå udenfor (fx "../"), absolutte stier eller forbudte navne.
 */
export async function sikkerSti(rod: string, relativ: string): Promise<string> {
  if (path.isAbsolute(relativ)) {
    throw new FilAdgangsFejl(`Absolutte stier er ikke tilladt: ${relativ}`);
  }
  const fuld = path.resolve(rod, relativ);
  if (!erIndenfor(rod, fuld)) {
    throw new FilAdgangsFejl(`Stien peger uden for projektet: ${relativ}`);
  }
  const segmenter = path.relative(rod, fuld).split(path.sep).filter(Boolean);
  const forbudt = segmenter.find(erForbudtNavn);
  if (forbudt) {
    throw new FilAdgangsFejl(`Adgang nægtet til "${forbudt}"`);
  }
  // Symlinks kan pege ud af projektet — tjek den RIGTIGE placering
  const rigtigRod = await realpath(rod);
  const rigtigFuld = await realpath(fuld).catch(() => {
    throw new FilAdgangsFejl(`Findes ikke: ${relativ}`);
  });
  if (!erIndenfor(rigtigRod, rigtigFuld)) {
    throw new FilAdgangsFejl(`Stien peger uden for projektet: ${relativ}`);
  }
  return rigtigFuld;
}

/**
 * Validerer en projektsti, brugeren har indtastet. Returnerer en
 * fejlbesked, eller null hvis stien er brugbar.
 */
export async function validerProjektSti(
  projektSti: string,
  tilladtRod: string | undefined
): Promise<string | null> {
  if (!path.isAbsolute(projektSti)) {
    return "Projektstien skal være absolut, fx C:\\Users\\...\\mit-projekt";
  }
  const info = await stat(projektSti).catch(() => null);
  if (!info || !info.isDirectory()) {
    return "Projektstien findes ikke eller er ikke en mappe";
  }
  if (tilladtRod && !erIndenfor(path.resolve(tilladtRod), path.resolve(projektSti))) {
    return `Projektstien skal ligge inden for PROJEKT_ROD (${tilladtRod})`;
  }
  return null;
}

/**
 * Vagten for agentens filværktøjer under en implementering. Som
 * sikkerSti, men tåler stier, der ikke findes endnu (nye filer):
 * symlink-tjekket laves på den nærmeste overmappe, der findes.
 * Returnerer en begrundelse for afvisning, eller null hvis stien er OK.
 */
export async function vurderAgentSti(rod: string, sti: string): Promise<string | null> {
  const fuld = path.resolve(rod, sti); // absolutte stier bevares af resolve
  if (!erIndenfor(rod, fuld)) return `Uden for arbejdsmappen: ${sti}`;
  const forbudt = path.relative(rod, fuld).split(path.sep).find(erForbudtNavn);
  if (forbudt) return `Adgang nægtet til "${forbudt}"`;
  let eksisterende = fuld;
  while (!(await stat(eksisterende).then(() => true, () => false))) {
    const overmappe = path.dirname(eksisterende);
    if (overmappe === eksisterende) break;
    eksisterende = overmappe;
  }
  const rigtigRod = await realpath(rod);
  const rigtig = await realpath(eksisterende);
  return erIndenfor(rigtigRod, rigtig) ? null : `Peger uden for arbejdsmappen: ${sti}`;
}

export function erIndenfor(rod: string, sti: string): boolean {
  const relativ = path.relative(rod, sti);
  const gaarUd = relativ === ".." || relativ.startsWith(".." + path.sep);
  return !gaarUd && !path.isAbsolute(relativ);
}
