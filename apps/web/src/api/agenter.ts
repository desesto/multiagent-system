// API-kald: agenter.

import { API_URL } from "./klient";

// Agentnavne til visning — hentes én gang og caches for hele sessionen
let agentNavneCache: Promise<Record<string, string>> | null = null;

export function hentAgentNavne(): Promise<Record<string, string>> {
  if (!agentNavneCache) {
    agentNavneCache = fetch(`${API_URL}/agenter`)
      .then((svar) => svar.json())
      .then((liste: Array<{ id: string; navn: string }>) =>
        Object.fromEntries(liste.map((a) => [a.id, a.navn]))
      );
  }
  return agentNavneCache;
}
