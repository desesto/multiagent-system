// node_modules i agentens worktree: git følger ikke med node_modules,
// men typetjekket kræver dem. I stedet for en langsom npm install
// LÆNKES worktreets node_modules til projektets eksisterende mapper
// (en "junction" på Windows, et symlink andre steder).
//
// SIKKERHEDSREGEL: En lænke må KUN fjernes med unlink — aldrig med
// rekursiv sletning. En rekursiv sletning kunne følge lænken og
// slette brugerens rigtige node_modules. Lænkerne fjernes, før der
// committes, og før et worktree slettes.

import { lstat, symlink, unlink } from "node:fs/promises";
import path from "node:path";
import { kandidatMapper } from "../vaerktoejer/monorepoMapper";

async function findes(sti: string): Promise<boolean> {
  return lstat(sti).then(() => true, () => false);
}

/** Lænker hver node_modules fra repoet ind i worktreet. Returnerer lænkerne. */
export async function laenkNodeModules(repoRod: string, worktreeSti: string): Promise<string[]> {
  const laenker: string[] = [];
  for (const mappe of await kandidatMapper(repoRod)) {
    const kilde = path.join(repoRod, mappe, "node_modules");
    const maal = path.join(worktreeSti, mappe, "node_modules");
    if (!(await findes(kilde)) || (await findes(maal))) continue;
    if (!(await findes(path.join(worktreeSti, mappe)))) continue;
    await symlink(kilde, maal, "junction");
    laenker.push(maal);
  }
  return laenker;
}

/**
 * Fjerner ALLE node_modules-lænker i et worktree — også efter et nedbrud,
 * hvor listen fra laenkNodeModules er tabt. Rører kun lænker, aldrig
 * rigtige mapper.
 */
export async function fjernNodeModulesLaenker(worktreeSti: string): Promise<number> {
  let antal = 0;
  for (const mappe of await kandidatMapper(worktreeSti)) {
    const sti = path.join(worktreeSti, mappe, "node_modules");
    const info = await lstat(sti).catch(() => null);
    if (info?.isSymbolicLink()) {
      await unlink(sti);
      antal++;
    }
  }
  return antal;
}
