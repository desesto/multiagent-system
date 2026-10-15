// Mapper, hvor et monorepo typisk har selvstændige pakker: roden,
// apps/* og packages/*. Bruges både til node_modules-lænker og typetjek.

import { readdir } from "node:fs/promises";
import path from "node:path";

export async function kandidatMapper(rod: string): Promise<string[]> {
  const mapper = ["."];
  for (const gruppe of ["apps", "packages"]) {
    const poster = await readdir(path.join(rod, gruppe), { withFileTypes: true }).catch(() => []);
    for (const post of poster) {
      if (post.isDirectory()) mapper.push(path.join(gruppe, post.name));
    }
  }
  return mapper;
}
