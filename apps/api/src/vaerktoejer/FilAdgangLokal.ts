// FilAdgangLokal — læser fra disken inden for ét projekt.
// Al stivalidering går gennem sikkerSti; denne fil håndterer kun
// selve læsningen og lofterne.

import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import {
  FilAdgangsFejl,
  type IFilAdgang,
  type SoegeTraef,
} from "../../../../packages/domain/src/contracts/filAdgang";
import { erForbudtNavn, sikkerSti } from "./stiSikkerhed";

const MAX_FIL_BYTES = 50_000;
const MAX_LISTE_POSTER = 300;
const MAX_SOEGE_TRAEF = 50;
const MAX_TRAEF_LAENGDE = 200;

export class FilAdgangLokal implements IFilAdgang {
  private rigtigRod: Promise<string> | null = null;

  constructor(private readonly rod: string) {}

  /** Roden efter symlinks — samme grundlag som sikkerSti bruger */
  private hentRigtigRod(): Promise<string> {
    this.rigtigRod ??= realpath(this.rod);
    return this.rigtigRod;
  }

  async listFiler(sti: string): Promise<string[]> {
    const start = await sikkerSti(this.rod, sti);
    const rod = await this.hentRigtigRod();
    const poster: string[] = [];
    await this.gennemgaa(start, async (fuld, erMappe) => {
      poster.push(relativSti(rod, fuld) + (erMappe ? "/" : ""));
      return poster.length < MAX_LISTE_POSTER;
    });
    if (poster.length >= MAX_LISTE_POSTER) {
      poster.push(`… (afkortet ved ${MAX_LISTE_POSTER} poster — list en undermappe)`);
    }
    return poster;
  }

  async laesFil(sti: string): Promise<string> {
    const fuld = await sikkerSti(this.rod, sti);
    const info = await stat(fuld);
    if (info.isDirectory()) {
      throw new FilAdgangsFejl(`"${sti}" er en mappe — brug list_filer`);
    }
    const indhold = await readFile(fuld);
    if (erBinaer(indhold)) {
      throw new FilAdgangsFejl(`"${sti}" er en binær fil og kan ikke læses som tekst`);
    }
    if (indhold.length > MAX_FIL_BYTES) {
      const tekst = indhold.subarray(0, MAX_FIL_BYTES).toString("utf8");
      return `${tekst}\n\n… (afkortet: filen er ${indhold.length} bytes, viser de første ${MAX_FIL_BYTES})`;
    }
    return indhold.toString("utf8");
  }

  async soeg(tekst: string, sti: string): Promise<SoegeTraef[]> {
    const start = await sikkerSti(this.rod, sti);
    const rod = await this.hentRigtigRod();
    const soegeord = tekst.toLowerCase();
    const traef: SoegeTraef[] = [];
    await this.gennemgaa(start, async (fuld, erMappe) => {
      if (erMappe) return true;
      const indhold = await readFile(fuld).catch(() => null);
      if (!indhold || indhold.length > MAX_FIL_BYTES || erBinaer(indhold)) {
        return true; // spring stille over — søgning skal ikke fejle på én fil
      }
      const linjer = indhold.toString("utf8").split("\n");
      for (const [i, linje] of linjer.entries()) {
        if (linje.toLowerCase().includes(soegeord)) {
          traef.push({
            sti: relativSti(rod, fuld),
            linje: i + 1,
            tekst: linje.trim().slice(0, MAX_TRAEF_LAENGDE),
          });
          if (traef.length >= MAX_SOEGE_TRAEF) return false;
        }
      }
      return true;
    });
    return traef;
  }

  /**
   * Rekursiv gennemgang der springer forbudte navne over.
   * Besøgs-funktionen returnerer false for at stoppe tidligt.
   */
  private async gennemgaa(
    mappe: string,
    besoeg: (fuld: string, erMappe: boolean) => Promise<boolean>
  ): Promise<boolean> {
    const info = await stat(mappe);
    if (!info.isDirectory()) return besoeg(mappe, false);
    const poster = await readdir(mappe, { withFileTypes: true });
    poster.sort((a, b) => a.name.localeCompare(b.name));
    for (const post of poster) {
      if (erForbudtNavn(post.name) || post.isSymbolicLink()) continue;
      const fuld = path.join(mappe, post.name);
      const erMappe = post.isDirectory();
      if (!(await besoeg(fuld, erMappe))) return false;
      if (erMappe && !(await this.gennemgaa(fuld, besoeg))) return false;
    }
    return true;
  }
}

/** Stier til agenten: altid relative og med / uanset styresystem */
function relativSti(rod: string, fuld: string): string {
  return path.relative(rod, fuld).split(path.sep).join("/");
}

/** Binære filer har typisk nul-bytes tidligt i indholdet */
function erBinaer(indhold: Buffer): boolean {
  return indhold.subarray(0, 8000).includes(0);
}
