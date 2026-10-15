// Finder agentens JSON-svar i modellens tekst — også når modellen
// skriver indledning, markdown-analyse eller kodeeksempler omkring det.
// Neutral: kender ingen udbyder.
//
// Strategien: find alle afbalancerede {…}-blokke (uden at lade sig
// narre af { og } inde i tekststrenge), og vælg den SIDSTE, der har
// den rigtige form. Det endelige svar kommer normalt til sidst, og
// mindre objekter (fx en enkelt valgmulighed) har ikke den rigtige form.

/** Det JSON-format vi kræver af modellen */
export interface RaatSvar {
  spoergsmaal: string;
  indhold: string;
  resume: string;
  valgmuligheder: Array<{
    beskrivelse: string;
    fordele: string[];
    ulemper: string[];
    anbefalet?: boolean;
    /** HTML-skitse — kun ved visuelle opgaver; renses, før den gemmes */
    design?: unknown;
  }>;
}

/** Returnerer svaret, eller null hvis teksten ikke indeholder et gyldigt svar */
export function findAgentJson(tekst: string): RaatSvar | null {
  const kandidater = findJsonBlokke(tekst);
  for (let i = kandidater.length - 1; i >= 0; i--) {
    const objekt = proevParse(kandidater[i]);
    if (harRigtigForm(objekt)) return objekt;
  }
  return null;
}

/** Som findAgentJson, men kaster en læsbar fejl i stedet for at returnere null */
export function parseAgentJson(tekst: string): RaatSvar {
  const svar = findAgentJson(tekst);
  if (svar) return svar;
  throw new Error(
    `Agentsvaret indeholdt ikke et gyldigt JSON-svar. Første 200 tegn: ${tekst.slice(0, 200)}`
  );
}

/** Alle afbalancerede {…}-blokke, i den rækkefølge de starter */
export function findJsonBlokke(tekst: string): string[] {
  const blokke: string[] = [];
  for (let start = tekst.indexOf("{"); start !== -1; start = tekst.indexOf("{", start + 1)) {
    const slut = matchendeSlutning(tekst, start);
    if (slut !== -1) blokke.push(tekst.slice(start, slut + 1));
  }
  return blokke;
}

/** Index for den } der lukker { på `start` — eller -1. Ignorerer {} i strenge */
function matchendeSlutning(tekst: string, start: number): number {
  let dybde = 0;
  let iStreng = false;
  let escape = false;
  for (let i = start; i < tekst.length; i++) {
    const tegn = tekst[i];
    if (iStreng) {
      if (escape) escape = false;
      else if (tegn === "\\") escape = true;
      else if (tegn === '"') iStreng = false;
      continue;
    }
    if (tegn === '"') iStreng = true;
    else if (tegn === "{") dybde++;
    else if (tegn === "}" && --dybde === 0) return i;
  }
  return -1;
}

function proevParse(tekst: string): unknown {
  try {
    return JSON.parse(tekst);
  } catch {
    return null;
  }
}

function harRigtigForm(objekt: unknown): objekt is RaatSvar {
  if (typeof objekt !== "object" || objekt === null) return false;
  const o = objekt as Record<string, unknown>;
  return (
    typeof o.spoergsmaal === "string" &&
    typeof o.indhold === "string" &&
    typeof o.resume === "string" &&
    Array.isArray(o.valgmuligheder) &&
    o.valgmuligheder.length > 0
  );
}
