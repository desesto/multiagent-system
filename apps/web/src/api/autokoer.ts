// API-kald: autokør. Spejler ruter\autokoerRuter.ts.

import type { AutokoerOversigt, AutokoerTilstand } from "../../../../packages/domain/src/domain/autokoer";
import { API_URL, fejlbesked, tjek } from "./klient";

export async function hentAutokoer(projektId: string): Promise<AutokoerOversigt> {
  return tjek(await fetch(`${API_URL}/projekter/${projektId}/autokoer`), "Hent autokør");
}

export async function saetIKoe(opgaveIder: string[]): Promise<{ tilfoejet: number }> {
  return tjek(
    await fetch(`${API_URL}/autokoer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opgaveIder }),
    }),
    "Sæt i kø"
  );
}

export async function tagUdAfKoe(postId: string): Promise<void> {
  const svar = await fetch(`${API_URL}/autokoer/${postId}`, { method: "DELETE" });
  if (!svar.ok) throw new Error(await fejlbesked(svar, "Tag ud af køen"));
}

export async function startAutokoer(): Promise<AutokoerTilstand> {
  return tjek(await fetch(`${API_URL}/autokoer/start`, { method: "POST" }), "Start køen");
}

export async function stopAutokoer(): Promise<AutokoerTilstand> {
  return tjek(await fetch(`${API_URL}/autokoer/stop`, { method: "POST" }), "Stop køen");
}
