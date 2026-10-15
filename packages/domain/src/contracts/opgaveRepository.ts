// Kontrakt for opgave-persistens. Ligger i domænepakken, fordi det er
// en delt kontrakt — orchestratoren afhænger af DENNE, aldrig af den
// konkrete Postgres-implementering i apps/api.

import type { Opgave, OpgaveId } from "../domain/opgave";

/** Det, brugeren angiver ved oprettelse — resten sætter systemet */
export type NyOpgave = Omit<Opgave, "id" | "status" | "oprettetTidspunkt">;

/**
 * Redigerbare felter. Typen er BEVIDST ikke med — den styrer processen.
 * Området kan ændres: man opdager ofte undervejs, at det rører mere end ventet.
 * Stien heller ikke: den hører til projektet og ændres dér.
 */
export type RedigerOpgave = Partial<Pick<Opgave, "titel" | "beskrivelse" | "fokuspunkter" | "omraade">>;

export interface IOpgaveRepository {
  opret(ny: NyOpgave): Promise<Opgave>;
  hent(id: OpgaveId): Promise<Opgave | null>;
  /** Evt. kun ét projekts opgaver */
  hentAlle(ekskluderAfsluttede?: boolean, projektId?: string): Promise<Opgave[]>;
  opdaterStatus(id: OpgaveId, status: Opgave["status"]): Promise<Opgave | null>;
  opdater(id: OpgaveId, felter: RedigerOpgave): Promise<Opgave | null>;
  /** Soft delete. Returnerer false hvis opgaven ikke findes/allerede er slettet */
  slet(id: OpgaveId): Promise<boolean>;
  /** Når projektets sti ændres, følger opgaverne med */
  opdaterStiForProjekt(projektId: string, sti: string | null): Promise<void>;
}
