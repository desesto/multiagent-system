// Typetjek, som agenten kan bede om under en implementering. Vores
// kode kører en FAST kommando (tsc med Node), så agenten kan tjekke
// sin kode uden nogen form for kommandolinjeadgang.

import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { kandidatMapper } from "./monorepoMapper";

const koerFil = promisify(execFile);
const MAX_UDDATA = 6000;

async function findes(sti: string): Promise<boolean> {
  return stat(sti).then(() => true, () => false);
}

/** Kører tsc i hver pakke, der har en tsconfig og installeret typescript */
export async function koerTypetjek(rod: string): Promise<string> {
  const linjer: string[] = [];
  for (const mappe of await kandidatMapper(rod)) {
    const dir = path.join(rod, mappe);
    const tsconfig = (await findes(path.join(dir, "tsconfig.app.json")))
      ? "tsconfig.app.json"
      : (await findes(path.join(dir, "tsconfig.json")))
        ? "tsconfig.json"
        : null;
    const tsc = path.join(dir, "node_modules", "typescript", "bin", "tsc");
    if (!tsconfig || !(await findes(tsc))) continue;
    const navn = mappe === "." ? "(roden)" : mappe.split(path.sep).join("/");
    try {
      await koerFil(process.execPath, [tsc, "-p", tsconfig, "--noEmit"], {
        cwd: dir,
        timeout: 180_000,
        maxBuffer: 10 * 1024 * 1024,
      });
      linjer.push(`✓ ${navn}: ingen typefejl`);
    } catch (fejl) {
      const ud = ((fejl as { stdout?: string }).stdout ?? (fejl as Error).message).trim();
      linjer.push(`✗ ${navn}:\n${ud.slice(0, MAX_UDDATA)}${ud.length > MAX_UDDATA ? "\n… (afkortet)" : ""}`);
    }
  }
  return linjer.length > 0
    ? linjer.join("\n\n")
    : "Fandt ingen TypeScript-pakker med installeret typescript at tjekke.";
}
