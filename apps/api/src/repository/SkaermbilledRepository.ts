// SkaermbilledRepository — før/efter-billeder. Listen henter kun
// metadata; selve billedet (op til et par MB) hentes enkeltvis.

import { asc, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { skaermbilleder } from "../db/schema";
import type { Skaermbillede } from "../../../../packages/domain/src/domain/skaermbillede";
import type {
  ISkaermbilledRepository,
  NytSkaermbillede,
} from "../../../../packages/domain/src/contracts/skaermbilleder";

const METADATA = {
  id: skaermbilleder.id,
  implementeringId: skaermbilleder.implementeringId,
  rute: skaermbilleder.rute,
  tilstand: skaermbilleder.tilstand,
  bredde: skaermbilleder.bredde,
  hoejde: skaermbilleder.hoejde,
  oprettetTidspunkt: skaermbilleder.oprettetTidspunkt,
};

type MetadataRow = {
  [K in keyof typeof METADATA]: (typeof METADATA)[K]["_"]["data"];
};

export class SkaermbilledRepository implements ISkaermbilledRepository {
  constructor(private readonly db: Db) {}

  async gem(nyt: NytSkaermbillede): Promise<Skaermbillede> {
    const [row] = await this.db
      .insert(skaermbilleder)
      .values({ ...nyt, png: Buffer.from(nyt.png) })
      .returning(METADATA);
    return tilDomaene(row);
  }

  async hentForImplementering(implementeringId: string): Promise<Skaermbillede[]> {
    const rows = await this.db
      .select(METADATA)
      .from(skaermbilleder)
      .where(eq(skaermbilleder.implementeringId, implementeringId))
      .orderBy(asc(skaermbilleder.oprettetTidspunkt));
    return rows.map(tilDomaene);
  }

  async hentPng(id: string): Promise<Uint8Array | null> {
    const [row] = await this.db
      .select({ png: skaermbilleder.png })
      .from(skaermbilleder)
      .where(eq(skaermbilleder.id, id));
    return row?.png ?? null;
  }
}

function tilDomaene(row: MetadataRow): Skaermbillede {
  return { ...row, oprettetTidspunkt: row.oprettetTidspunkt.toISOString() };
}
