// API-kald: beslutningspunkter og agentsvar.

import type { Beslutningspunkt } from "../../../../packages/domain/src/domain/opgave";
import type { GemtAgentSvar } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import type { Kommentar } from "../../../../packages/domain/src/domain/kommentar";
import { API_URL, fejlbesked, tjek } from "./klient";

export async function hentAabneBeslutningspunkter(): Promise<Beslutningspunkt[]> {
  return tjek(
    await fetch(`${API_URL}/beslutningspunkter/aabne`),
    "Hent beslutningspunkter"
  );
}

export async function hentBeslutningspunkterForOpgave(
  opgaveId: string
): Promise<Beslutningspunkt[]> {
  return tjek(
    await fetch(`${API_URL}/opgaver/${opgaveId}/beslutningspunkter`),
    "Hent beslutningshistorik"
  );
}

export async function hentAgentSvarForOpgave(
  opgaveId: string
): Promise<GemtAgentSvar[]> {
  return tjek(
    await fetch(`${API_URL}/opgaver/${opgaveId}/agentsvar`),
    "Hent agentsvar"
  );
}

export async function hentFuldtSvar(punktId: string): Promise<GemtAgentSvar[]> {
  return tjek(
    await fetch(`${API_URL}/beslutningspunkter/${punktId}/svar`),
    "Hent fuldt svar"
  );
}

export async function vaelgMulighed(
  punktId: string,
  valgtMulighedId: string
): Promise<Beslutningspunkt> {
  return tjek(
    await fetch(`${API_URL}/beslutningspunkter/${punktId}/valg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valgtMulighedId }),
    }),
    "Registrér valg"
  );
}

export async function fortrydValg(punktId: string): Promise<Beslutningspunkt> {
  return tjek(
    await fetch(`${API_URL}/beslutningspunkter/${punktId}/fortryd`, {
      method: "POST",
    }),
    "Fortryd retning"
  );
}

export async function tilfoejKommentar(
  punktId: string,
  tekst: string,
  /** Billeder, der allerede er uploadet */
  vedhaeftningIder: string[] = []
): Promise<Kommentar> {
  return tjek(
    await fetch(`${API_URL}/beslutningspunkter/${punktId}/kommentarer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tekst, ...(vedhaeftningIder.length > 0 ? { vedhaeftningIder } : {}) }),
    }),
    "Tilføj kommentar"
  );
}

export async function sletKommentar(id: string): Promise<void> {
  const svar = await fetch(`${API_URL}/kommentarer/${id}`, { method: "DELETE" });
  if (!svar.ok) throw new Error(await fejlbesked(svar, "Slet kommentar"));
}

/** Ny vurdering: agenterne kører igen med de tidligere forslag og kommentarerne */
export async function reevaluer(punktId: string): Promise<Beslutningspunkt> {
  return tjek(
    await fetch(`${API_URL}/beslutningspunkter/${punktId}/reevaluer`, { method: "POST" }),
    "Ny vurdering"
  );
}
