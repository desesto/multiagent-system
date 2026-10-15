// API-kald: forbrug. Spejler ruter\forbrugRuter.ts.

import type { ForbrugsOversigt } from "../../../../packages/domain/src/domain/forbrug";
import { API_URL, tjek } from "./klient";

export async function hentForbrug(dage: number): Promise<ForbrugsOversigt> {
  return tjek(await fetch(`${API_URL}/forbrug?dage=${dage}`), "Hent forbrug");
}

export async function hentOpgaveForbrug(
  opgaveId: string
): Promise<{ usd: number; koersler: number; uprisede: number }> {
  return tjek(await fetch(`${API_URL}/opgaver/${opgaveId}/forbrug`), "Hent opgavens forbrug");
}
