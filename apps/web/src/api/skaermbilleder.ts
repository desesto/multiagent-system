// API-kald: før/efter-billeder. Spejler ruter\skaermbilledRuter.ts.

import type { Skaermbillede } from "../../../../packages/domain/src/domain/skaermbillede";
import { API_URL, tjek } from "./klient";

/** Kun metadata — selve billedet vises med skaermbilledUrl */
export async function hentSkaermbilleder(implementeringId: string): Promise<Skaermbillede[]> {
  return tjek(
    await fetch(`${API_URL}/implementeringer/${implementeringId}/skaermbilleder`),
    "Hent før/efter-billeder"
  );
}

export function skaermbilledUrl(id: string): string {
  return `${API_URL}/skaermbilleder/${id}`;
}
