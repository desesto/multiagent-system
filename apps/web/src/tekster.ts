import type { Opgave, OpgaveOmraade, OpgaveType } from "../../../packages/domain/src/domain/opgave";
import type { ImplementeringStatus } from "../../../packages/domain/src/domain/implementering";
import type { FilAendringsType } from "../../../packages/domain/src/domain/diff";

export const TYPE_TEKST: Record<OpgaveType, string> = {
  bugfix: "Bugfix",
  ny_feature: "Ny feature",
  system_fra_bunden: "System fra bunden",
  prototype: "Prototype",
};

/** Tailwind kan ikke bygge klassenavne dynamisk — derfor et opslag */
export const TYPE_FARVE: Record<OpgaveType, string> = {
  bugfix: "text-t-bugfix",
  ny_feature: "text-t-feature",
  system_fra_bunden: "text-t-system",
  prototype: "text-t-prototype",
};

export const STATUS_TEKST: Record<Opgave["status"], string> = {
  oprettet: "Oprettet",
  nedbrudt: "Nedbrudt",
  i_gang: "I gang",
  afventer_beslutning: "Afventer beslutning",
  afsluttet: "Afsluttet",
};

export const IMPLEMENTERING_STATUS_TEKST: Record<ImplementeringStatus, string> = {
  koerer: "Agenten arbejder…",
  klar: "Klar til gennemsyn",
  fejlet: "Fejlet",
  kasseret: "Kasseret",
  flettet: "Flettet ind",
};

/** Tailwind kan ikke bygge klassenavne dynamisk — derfor et opslag */
export const IMPLEMENTERING_STATUS_FARVE: Record<ImplementeringStatus, string> = {
  koerer: "text-accent",
  klar: "text-t-feature",
  fejlet: "text-farelys",
  kasseret: "text-daempet",
  flettet: "text-t-feature",
};

export const FIL_TYPE_TEKST: Record<FilAendringsType, string> = {
  oprettet: "Ny fil",
  aendret: "Ændret",
  slettet: "Slettet",
};

/** Som i IntelliJ: ny = grøn, ændret = blå, slettet = rød */
export const FIL_TYPE_FARVE: Record<FilAendringsType, string> = {
  oprettet: "text-vcs-oprettet",
  aendret: "text-vcs-aendret",
  slettet: "text-vcs-slettet",
};

export const OMRAADE_TEKST: Record<OpgaveOmraade, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fuldstack: "Fuldstack",
  andet: "Andet",
};
