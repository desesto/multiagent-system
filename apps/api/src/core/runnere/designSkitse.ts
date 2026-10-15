// Agenternes design-skitser: reglerne i prompten og rensningen af svaret.
// Neutral — kender ingen udbyder. Skitsen vises i browseren i en sandkasse
// uden scripts og uden netværk; rensningen her er et ekstra lag.

import { VISUELLE_OMRAADER, type Opgave } from "../../../../../packages/domain/src/domain/opgave";

const MAX_TEGN = 20_000;

export function skalHaveDesign(opgave: Opgave): boolean {
  return opgave.omraade !== null && VISUELLE_OMRAADER.includes(opgave.omraade);
}

export const DESIGN_REGLER = [
  `Opgaven er VISUEL (frontend). Giv derfor hver valgmulighed feltet "design": en simpel HTML-skitse af, hvordan retningen ville SE UD for brugeren.`,
  `Regler for skitsen: ét selvstændigt HTML-dokument med <style> i toppen, INGEN <script>, ingen eksterne filer, billeder eller skrifttyper (de bliver blokeret). Brug grå bokse som pladsholdere for billeder.`,
  `Hvis du har læst projektets CSS eller komponenter, så brug dets farver, skrifttyper og afstande, så skitsen ligner det rigtige system. Ellers et neutralt, mørkt eller lyst tema.`,
  `Hold den kort (højst ca. 2.500 tegn) — det er en skitse, ikke færdig kode. Vis kun den del af skærmen, ændringen handler om, og fremhæv det nye.`,
].join("\n");

/** Skitsen fra modellen → sikker, begrænset HTML, eller null hvis den mangler eller er ubrugelig */
export function rensDesign(vaerdi: unknown): string | null {
  if (typeof vaerdi !== "string") return null;
  const html = vaerdi
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script[^>]*>/gi, "")
    .trim();
  if (html.length === 0 || html.length > MAX_TEGN) return null;
  return html;
}
