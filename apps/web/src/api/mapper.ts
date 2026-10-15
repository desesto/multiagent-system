// API-kald: mappebrowseren. Spejler ruter\mappeRuter.ts.

import type { MappeListe } from "../../../../packages/domain/src/domain/mappe";
import { API_URL, tjek } from "./klient";

/** Uden sti: roden (PROJEKT_ROD) */
export async function hentMapper(sti?: string): Promise<MappeListe> {
  const parameter = sti ? `?sti=${encodeURIComponent(sti)}` : "";
  return tjek(await fetch(`${API_URL}/mapper${parameter}`), "Hent mapper");
}
