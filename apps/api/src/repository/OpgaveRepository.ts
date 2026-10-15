// OpgaveRepository — opfylder IOpgaveRepository-kontrakten mod Postgres.
// Repositoryets ENESTE job er oversættelsen mellem databasens rækker
// (OpgaveRow) og domænets interfaces (Opgave). Ingen forretningslogik
// — den bor i orchestratoren.

import { and, desc, eq, isNull, ne } from "drizzle-orm";
import type { Db } from "../db/db";
import { opgaver, type OpgaveRow } from "../db/schema";
import type { Opgave } from "../../../../packages/domain/src/domain/opgave";
import type {
  IOpgaveRepository,
  NyOpgave,
  RedigerOpgave,
} from "../../../../packages/domain/src/contracts/opgaveRepository";

export class OpgaveRepository implements IOpgaveRepository {
  constructor(private readonly db: Db) {}

  async opret(ny: NyOpgave): Promise<Opgave> {
    const [row] = await this.db
      .insert(opgaver)
      .values({
        titel: ny.titel,
        beskrivelse: ny.beskrivelse,
        type: ny.type,
        omraade: ny.omraade,
        fokuspunkter: ny.fokuspunkter,
        oprettetAfBrugerId: ny.oprettetAfBrugerId,
        projektId: ny.projektId,
        projektSti: ny.projektSti,
        // id, status og oprettet_tidspunkt sættes af databasens defaults
      })
      .returning();
    return tilDomaene(row);
  }

  async hent(id: string): Promise<Opgave | null> {
    const [row] = await this.db
      .select()
      .from(opgaver)
      .where(and(eq(opgaver.id, id), isNull(opgaver.slettetTidspunkt)));
    return row ? tilDomaene(row) : null;
  }

  async hentAlle(ekskluderAfsluttede = false, projektId?: string): Promise<Opgave[]> {
    const betingelse = and(
      isNull(opgaver.slettetTidspunkt),
      ekskluderAfsluttede ? ne(opgaver.status, "afsluttet") : undefined,
      projektId ? eq(opgaver.projektId, projektId) : undefined
    );
    const rows = await this.db
      .select()
      .from(opgaver)
      .where(betingelse)
      .orderBy(desc(opgaver.oprettetTidspunkt));
    return rows.map(tilDomaene);
  }

  async opdaterStatus(
    id: string,
    status: Opgave["status"]
  ): Promise<Opgave | null> {
    const [row] = await this.db
      .update(opgaver)
      .set({ status })
      .where(and(eq(opgaver.id, id), isNull(opgaver.slettetTidspunkt)))
      .returning();
    return row ? tilDomaene(row) : null;
  }

  async opdater(id: string, felter: RedigerOpgave): Promise<Opgave | null> {
    const [row] = await this.db
      .update(opgaver)
      .set(felter)
      .where(and(eq(opgaver.id, id), isNull(opgaver.slettetTidspunkt)))
      .returning();
    return row ? tilDomaene(row) : null;
  }

  async opdaterStiForProjekt(projektId: string, sti: string | null): Promise<void> {
    await this.db
      .update(opgaver)
      .set({ projektSti: sti })
      .where(and(eq(opgaver.projektId, projektId), isNull(opgaver.slettetTidspunkt)));
  }

  async slet(id: string): Promise<boolean> {
    const [row] = await this.db
      .update(opgaver)
      .set({ slettetTidspunkt: new Date() })
      .where(and(eq(opgaver.id, id), isNull(opgaver.slettetTidspunkt)))
      .returning();
    return row !== undefined;
  }
}

/** Række → domæne. Compileren fanger det, hvis skema og domæne driver fra hinanden. */
function tilDomaene(row: OpgaveRow): Opgave {
  return {
    id: row.id,
    titel: row.titel,
    beskrivelse: row.beskrivelse,
    type: row.type,
    omraade: row.omraade,
    status: row.status,
    fokuspunkter: row.fokuspunkter,
    oprettetAfBrugerId: row.oprettetAfBrugerId,
    projektId: row.projektId,
    projektSti: row.projektSti,
    oprettetTidspunkt: row.oprettetTidspunkt.toISOString(),
  };
}
