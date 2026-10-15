// API-kald: projekter. Spejler ruter\projektRuter.ts.

import type { Projekt, ProjektMedTal } from "../../../../packages/domain/src/domain/projekt";
import { API_URL, fejlbesked, tjek } from "./klient";

export interface ProjektInput {
  navn: string;
  beskrivelse: string;
  sti: string | null;
}

export async function hentProjekter(arkiverede = false): Promise<ProjektMedTal[]> {
  const qs = arkiverede ? "?arkiverede=true" : "";
  return tjek(await fetch(`${API_URL}/projekter${qs}`), "Hent projekter");
}

/** Fjerner projektet fra oversigten — det kan gendannes */
export async function arkiverProjekt(id: string): Promise<Projekt> {
  return tjek(await fetch(`${API_URL}/projekter/${id}/arkiver`, { method: "POST" }), "Arkivér projekt");
}

export async function gendanProjekt(id: string): Promise<Projekt> {
  return tjek(await fetch(`${API_URL}/projekter/${id}/gendan`, { method: "POST" }), "Gendan projekt");
}

export async function hentProjekt(id: string): Promise<Projekt> {
  return tjek(await fetch(`${API_URL}/projekter/${id}`), "Hent projekt");
}

export async function opretProjekt(input: ProjektInput): Promise<Projekt> {
  return tjek(
    await fetch(`${API_URL}/projekter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    "Opret projekt"
  );
}

export async function redigerProjekt(id: string, felter: Partial<ProjektInput>): Promise<Projekt> {
  return tjek(
    await fetch(`${API_URL}/projekter/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(felter),
    }),
    "Redigér projekt"
  );
}

/** Permanent — sletter projektet og al dets historik. Kun for arkiverede projekter */
export async function sletProjektPermanent(id: string): Promise<void> {
  const svar = await fetch(`${API_URL}/projekter/${id}`, { method: "DELETE" });
  if (!svar.ok) throw new Error(await fejlbesked(svar, "Slet projekt"));
}
