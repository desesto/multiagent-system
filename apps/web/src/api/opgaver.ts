// API-kald: opgaver.

import type { Opgave, OpgaveOmraade, OpgaveType } from "../../../../packages/domain/src/domain/opgave";
import { API_URL, fejlbesked, tjek } from "./klient";
import { DEV_BRUGER_ID } from "./konfig";

/** Evt. kun ét projekts opgaver */
export async function hentOpgaver(ekskluderAfsluttede = false, projektId?: string): Promise<Opgave[]> {
  const parametre = new URLSearchParams();
  if (ekskluderAfsluttede) parametre.set("ekskluderAfsluttede", "true");
  if (projektId) parametre.set("projektId", projektId);
  const qs = parametre.size > 0 ? `?${parametre}` : "";
  return tjek(await fetch(`${API_URL}/opgaver${qs}`), "Hent opgaver");
}

export async function hentOpgave(id: string): Promise<Opgave> {
  return tjek(await fetch(`${API_URL}/opgaver/${id}`), "Hent opgave");
}

export async function opretOpgave(input: {
  titel: string;
  beskrivelse: string;
  type: OpgaveType;
  omraade: OpgaveOmraade | null;
  fokuspunkter: string[];
  /** Opgaven arver projektets sti */
  projektId: string;
  /** Billeder til beskrivelsen — uploadet på forhånd */
  vedhaeftningIder?: string[];
}): Promise<Opgave> {
  return tjek(
    await fetch(`${API_URL}/opgaver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, oprettetAfBrugerId: DEV_BRUGER_ID }),
    }),
    "Opret opgave"
  );
}

export async function redigerOpgave(
  id: string,
  felter: {
    titel?: string;
    beskrivelse?: string;
    fokuspunkter?: string[];
    omraade?: OpgaveOmraade | null;
    /** Nye billeder til beskrivelsen */
    vedhaeftningIder?: string[];
  }
): Promise<Opgave> {
  return tjek(
    await fetch(`${API_URL}/opgaver/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(felter),
    }),
    "Redigér opgave"
  );
}

export async function sletOpgave(id: string): Promise<void> {
  const svar = await fetch(`${API_URL}/opgaver/${id}`, { method: "DELETE" });
  if (!svar.ok) throw new Error(await fejlbesked(svar, "Slet opgave"));
}

/** Afslut eller genåbn — det er altid brugeren, der beslutter, hvornår en opgave er færdig */
export async function skiftOpgaveStatus(
  id: string,
  handling: "afslut" | "genaabn"
): Promise<Opgave> {
  return tjek(
    await fetch(`${API_URL}/opgaver/${id}/${handling}`, { method: "POST" }),
    handling === "afslut" ? "Afslut opgave" : "Genåbn opgave"
  );
}
