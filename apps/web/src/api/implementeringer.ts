// API-kald: implementeringer. Spejler ruter\implementeringsRuter.ts.

import type { Implementering } from "../../../../packages/domain/src/domain/implementering";
import type { FilDiff, FilVersion } from "../../../../packages/domain/src/domain/diff";
import { API_URL, tjek } from "./klient";

/** Starter en implementering — svarer straks, agenten arbejder i baggrunden */
export async function startImplementering(punktId: string): Promise<Implementering> {
  return tjek(
    await fetch(`${API_URL}/beslutningspunkter/${punktId}/implementer`, { method: "POST" }),
    "Start implementering"
  );
}

export async function hentImplementeringer(opgaveId: string): Promise<Implementering[]> {
  return tjek(
    await fetch(`${API_URL}/opgaver/${opgaveId}/implementeringer`),
    "Hent implementeringer"
  );
}

/** Fjerner gren og mappe. Var grenen flettet ind, registreres den som flettet. */
export async function rydImplementering(id: string): Promise<Implementering> {
  return tjek(
    await fetch(`${API_URL}/implementeringer/${id}/ryd`, { method: "POST" }),
    "Ryd op"
  );
}

/** Én fils ændringer i implementeringen, klar til visning som på GitHub */
export async function hentFilDiff(id: string, sti: string): Promise<FilDiff> {
  return tjek(
    await fetch(`${API_URL}/implementeringer/${id}/fil?sti=${encodeURIComponent(sti)}`),
    "Hent fil"
  );
}

/** Adressen på én version af en billedfil — til et <img> */
export function filBilledUrl(id: string, sti: string, version: FilVersion): string {
  return `${API_URL}/implementeringer/${id}/billede?sti=${encodeURIComponent(sti)}&version=${version}`;
}
