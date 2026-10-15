// VedhaeftningRepository — billeder i opgavebeskrivelser og kommentarer.
// Lister henter kun metadata; selve billedet hentes enkeltvis.

import { and, asc, eq, inArray, isNull, lt } from "drizzle-orm";
import type { Db } from "../db/db";
import { vedhaeftninger } from "../db/schema";
import type { Vedhaeftning } from "../../../../packages/domain/src/domain/vedhaeftning";
import type {
  AgentBillede,
  IVedhaeftningRepository,
  NyVedhaeftning,
} from "../../../../packages/domain/src/contracts/vedhaeftningRepository";

const METADATA = {
  id: vedhaeftninger.id,
  navn: vedhaeftninger.navn,
  type: vedhaeftninger.type,
  stoerrelse: vedhaeftninger.stoerrelse,
  oprettetTidspunkt: vedhaeftninger.oprettetTidspunkt,
};

type MetadataRow = { [K in keyof typeof METADATA]: (typeof METADATA)[K]["_"]["data"] };

const erLoes = and(isNull(vedhaeftninger.opgaveId), isNull(vedhaeftninger.kommentarId));

export class VedhaeftningRepository implements IVedhaeftningRepository {
  constructor(private readonly db: Db) {}

  async gem(ny: NyVedhaeftning): Promise<Vedhaeftning> {
    const [row] = await this.db
      .insert(vedhaeftninger)
      .values({ navn: ny.navn, type: ny.type, stoerrelse: ny.data.length, data: Buffer.from(ny.data) })
      .returning(METADATA);
    return tilDomaene(row);
  }

  async knytTilOpgave(ider: string[], opgaveId: string): Promise<number> {
    if (ider.length === 0) return 0;
    const rows = await this.db
      .update(vedhaeftninger)
      .set({ opgaveId })
      .where(and(inArray(vedhaeftninger.id, ider), erLoes))
      .returning({ id: vedhaeftninger.id });
    return rows.length;
  }

  async knytTilKommentar(ider: string[], kommentarId: string): Promise<number> {
    if (ider.length === 0) return 0;
    const rows = await this.db
      .update(vedhaeftninger)
      .set({ kommentarId })
      .where(and(inArray(vedhaeftninger.id, ider), erLoes))
      .returning({ id: vedhaeftninger.id });
    return rows.length;
  }

  async hentForOpgave(opgaveId: string): Promise<Vedhaeftning[]> {
    const rows = await this.db
      .select(METADATA)
      .from(vedhaeftninger)
      .where(eq(vedhaeftninger.opgaveId, opgaveId))
      .orderBy(asc(vedhaeftninger.oprettetTidspunkt));
    return rows.map(tilDomaene);
  }

  hentForKommentarer(kommentarIder: string[]): Promise<Map<string, Vedhaeftning[]>> {
    return vedhaeftningerForKommentarer(this.db, kommentarIder);
  }

  async hentData(id: string): Promise<{ type: Vedhaeftning["type"]; data: Uint8Array } | null> {
    const [row] = await this.db
      .select({ type: vedhaeftninger.type, data: vedhaeftninger.data })
      .from(vedhaeftninger)
      .where(eq(vedhaeftninger.id, id));
    return row ?? null;
  }

  async agentBilleder(
    opgaveId: string,
    kommentarer: { id: string; tekst: string }[]
  ): Promise<AgentBillede[]> {
    const billeder: AgentBillede[] = [];
    const opgavens = await this.db
      .select({ navn: vedhaeftninger.navn, type: vedhaeftninger.type, data: vedhaeftninger.data })
      .from(vedhaeftninger)
      .where(eq(vedhaeftninger.opgaveId, opgaveId))
      .orderBy(asc(vedhaeftninger.oprettetTidspunkt));
    for (const b of opgavens) {
      billeder.push({ etiket: `Billede fra opgavebeskrivelsen: ${b.navn}`, type: b.type, data: b.data });
    }
    if (kommentarer.length === 0) return billeder;
    const kommentarernes = await this.db
      .select({
        kommentarId: vedhaeftninger.kommentarId,
        navn: vedhaeftninger.navn,
        type: vedhaeftninger.type,
        data: vedhaeftninger.data,
      })
      .from(vedhaeftninger)
      .where(inArray(vedhaeftninger.kommentarId, kommentarer.map((k) => k.id)))
      .orderBy(asc(vedhaeftninger.oprettetTidspunkt));
    // I kommentarernes rækkefølge, så billedet står ved den tekst, det hører til
    for (const k of kommentarer) {
      for (const b of kommentarernes.filter((x) => x.kommentarId === k.id)) {
        const uddrag = k.tekst.length > 60 ? `${k.tekst.slice(0, 60)}…` : k.tekst;
        billeder.push({ etiket: `Billede fra brugerens kommentar "${uddrag}": ${b.navn}`, type: b.type, data: b.data });
      }
    }
    return billeder;
  }

  async slet(id: string): Promise<boolean> {
    const rows = await this.db.delete(vedhaeftninger).where(eq(vedhaeftninger.id, id)).returning({ id: vedhaeftninger.id });
    return rows.length > 0;
  }

  async ryddLoese(aeldreEnd: Date): Promise<number> {
    const rows = await this.db
      .delete(vedhaeftninger)
      .where(and(erLoes, lt(vedhaeftninger.oprettetTidspunkt, aeldreEnd)))
      .returning({ id: vedhaeftninger.id });
    return rows.length;
  }
}

/** Kommentarernes billeder i ÉN forespørgsel — bruges også af BeslutningspunktRepository */
export async function vedhaeftningerForKommentarer(
  db: Db,
  kommentarIder: string[]
): Promise<Map<string, Vedhaeftning[]>> {
  const pr = new Map<string, Vedhaeftning[]>();
  if (kommentarIder.length === 0) return pr;
  const rows = await db
    .select({ ...METADATA, kommentarId: vedhaeftninger.kommentarId })
    .from(vedhaeftninger)
    .where(inArray(vedhaeftninger.kommentarId, kommentarIder))
    .orderBy(asc(vedhaeftninger.oprettetTidspunkt));
  for (const { kommentarId, ...row } of rows) {
    if (kommentarId) pr.set(kommentarId, [...(pr.get(kommentarId) ?? []), tilDomaene(row)]);
  }
  return pr;
}

function tilDomaene(row: MetadataRow): Vedhaeftning {
  return { ...row, oprettetTidspunkt: row.oprettetTidspunkt.toISOString() };
}
