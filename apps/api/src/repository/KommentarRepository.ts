// KommentarRepository — brugerens kommentarer til beslutningspunkter.

import { eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { kommentarer, type KommentarRow } from "../db/schema";
import type { Kommentar } from "../../../../packages/domain/src/domain/kommentar";
import type { Vedhaeftning } from "../../../../packages/domain/src/domain/vedhaeftning";
import type { IKommentarRepository } from "../../../../packages/domain/src/contracts/kommentarRepository";

export class KommentarRepository implements IKommentarRepository {
  constructor(private readonly db: Db) {}

  async opret(beslutningspunktId: string, tekst: string): Promise<Kommentar> {
    const [row] = await this.db.insert(kommentarer).values({ beslutningspunktId, tekst }).returning();
    return kommentarTilDomaene(row);
  }

  async slet(id: string): Promise<boolean> {
    const rows = await this.db.delete(kommentarer).where(eq(kommentarer.id, id)).returning();
    return rows.length > 0;
  }
}

export function kommentarTilDomaene(row: KommentarRow, vedhaeftninger: Vedhaeftning[] = []): Kommentar {
  return {
    id: row.id,
    beslutningspunktId: row.beslutningspunktId,
    tekst: row.tekst,
    vedhaeftninger,
    oprettetTidspunkt: row.oprettetTidspunkt.toISOString(),
  };
}
