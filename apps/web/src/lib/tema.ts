// Valg af tema. Gemmes i browseren (localStorage) — det er en personlig
// visningsindstilling, ikke data. Selve farverne bor i tema.css; her
// sættes kun data-tema på <html>. index.html sætter det også, FØR siden
// tegnes, så man ikke ser et glimt af det forkerte tema ved indlæsning.

import { useState } from "react";

export type TemaId = "normal" | "platin";

export const TEMAER: { id: TemaId; navn: string; beskrivelse: string }[] = [
  { id: "normal", navn: "Normal", beskrivelse: "Det oprindelige mørke tema med lilla accent." },
  {
    id: "platin",
    navn: "Platin",
    beskrivelse: "Mørkt stålblåt metal: paneler med metalskær og sølvkant, lys tekst.",
  },
];

/** Samme nøgle som scriptet i index.html */
const NOEGLE = "multiagent.tema";

function erTema(v: unknown): v is TemaId {
  return TEMAER.some((t) => t.id === v);
}

export function hentTema(): TemaId {
  try {
    const gemt = localStorage.getItem(NOEGLE);
    return erTema(gemt) ? gemt : "normal";
  } catch {
    return "normal"; // fx privat vindue med blokeret lager
  }
}

export function saetTema(tema: TemaId): void {
  document.documentElement.dataset.tema = tema;
  try {
    localStorage.setItem(NOEGLE, tema);
  } catch {
    // Kan ikke gemmes — temaet gælder så kun, til siden genindlæses
  }
}

export function useTema(): [TemaId, (tema: TemaId) => void] {
  const [tema, setTema] = useState<TemaId>(hentTema);
  return [
    tema,
    (nyt: TemaId): void => {
      saetTema(nyt);
      setTema(nyt);
    },
  ];
}
