// API-kald: vedhæftede billeder. Spejler ruter\vedhaeftningRuter.ts.
// Billedet sendes som rå bytes — serveren bestemmer selv typen ud fra indholdet.

import type { Vedhaeftning } from "../../../../packages/domain/src/domain/vedhaeftning";
import { API_URL, fejlbesked, tjek } from "./klient";

export async function uploadVedhaeftning(data: Blob, navn: string): Promise<Vedhaeftning> {
  return tjek(
    await fetch(`${API_URL}/vedhaeftninger?navn=${encodeURIComponent(navn)}`, {
      method: "POST",
      headers: { "Content-Type": data.type.startsWith("image/") ? data.type : "image/png" },
      body: data,
    }),
    "Upload billede"
  );
}

export async function sletVedhaeftning(id: string): Promise<void> {
  const svar = await fetch(`${API_URL}/vedhaeftninger/${id}`, { method: "DELETE" });
  if (!svar.ok) throw new Error(await fejlbesked(svar, "Fjern billede"));
}

export async function hentOpgavensVedhaeftninger(opgaveId: string): Promise<Vedhaeftning[]> {
  return tjek(await fetch(`${API_URL}/opgaver/${opgaveId}/vedhaeftninger`), "Hent billeder");
}

export function vedhaeftningUrl(id: string): string {
  return `${API_URL}/vedhaeftninger/${id}`;
}
