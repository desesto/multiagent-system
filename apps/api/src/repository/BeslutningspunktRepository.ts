// BeslutningspunktRepository — persistens for beslutningspunkter.
// Bemærk registrerValg: WHERE-betingelsen kræver at punktet er åbent,
// så en beslutning aldrig kan overskrives. Historikken er hellig.

import { and, asc, desc, eq, inArray, isNull, isNotNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { beslutningspunkter, kommentarer, type BeslutningspunktRow } from "../db/schema";
import type { Kommentar } from "../../../../packages/domain/src/domain/kommentar";
import { kommentarTilDomaene } from "./KommentarRepository";
import { vedhaeftningerForKommentarer } from "./VedhaeftningRepository";
import type { Beslutningspunkt } from "../../../../packages/domain/src/domain/opgave";
import type { IBeslutningspunktRepository } from "../../../../packages/domain/src/contracts/beslutningspunktRepository";

export class BeslutningspunktRepository implements IBeslutningspunktRepository {
  constructor(private readonly db: Db) {}

  async opret(punkt: Beslutningspunkt): Promise<Beslutningspunkt> {
    const [row] = await this.db
      .insert(beslutningspunkter)
      .values({
        id: punkt.id,
        opgaveId: punkt.opgaveId,
        stilletAf: punkt.stilletAf,
        spoergsmaal: punkt.spoergsmaal,
        valgmuligheder: punkt.valgmuligheder,
      })
      .returning();
    return (await this.medKommentarer([row]))[0];
  }

  async hent(id: string): Promise<Beslutningspunkt | null> {
    const [row] = await this.db
      .select()
      .from(beslutningspunkter)
      .where(eq(beslutningspunkter.id, id));
    return row ? (await this.medKommentarer([row]))[0] : null;
  }

  async hentAabne(): Promise<Beslutningspunkt[]> {
    const rows = await this.db
      .select()
      .from(beslutningspunkter)
      .where(and(isNull(beslutningspunkter.valgtMulighedId), isNull(beslutningspunkter.erstattetAf)))
      .orderBy(desc(beslutningspunkter.oprettetTidspunkt));
    return this.medKommentarer(rows);
  }

  async hentForOpgave(opgaveId: string): Promise<Beslutningspunkt[]> {
    const rows = await this.db
      .select()
      .from(beslutningspunkter)
      .where(eq(beslutningspunkter.opgaveId, opgaveId))
      .orderBy(desc(beslutningspunkter.oprettetTidspunkt));
    return this.medKommentarer(rows);
  }

  async registrerValg(
    id: string,
    valgtMulighedId: string
  ): Promise<Beslutningspunkt | null> {
    const [row] = await this.db
      .update(beslutningspunkter)
      .set({ valgtMulighedId, besluttetTidspunkt: new Date() })
      .where(
        and(
          eq(beslutningspunkter.id, id),
          isNull(beslutningspunkter.valgtMulighedId), // kun åbne punkter
          isNull(beslutningspunkter.erstattetAf) // ... som ikke er erstattet
        )
      )
      .returning();
    return row ? (await this.medKommentarer([row]))[0] : null;
  }

  async fortrydValg(id: string): Promise<Beslutningspunkt | null> {
    // Læs det nuværende valg først — det skal ind i loggen, ikke forsvinde
    const [nu] = await this.db
      .select()
      .from(beslutningspunkter)
      .where(
        and(
          eq(beslutningspunkter.id, id),
          isNotNull(beslutningspunkter.valgtMulighedId),
          isNull(beslutningspunkter.erstattetAf)
        )
      );
    if (!nu || !nu.valgtMulighedId || !nu.besluttetTidspunkt) return null;

    const [row] = await this.db
      .update(beslutningspunkter)
      .set({
        valgtMulighedId: null,
        besluttetTidspunkt: null,
        tidligereValg: [
          ...nu.tidligereValg,
          {
            mulighedId: nu.valgtMulighedId,
            valgtTidspunkt: nu.besluttetTidspunkt.toISOString(),
            fortrudtTidspunkt: new Date().toISOString(),
          },
        ],
      })
      .where(eq(beslutningspunkter.id, id))
      .returning();
    return row ? (await this.medKommentarer([row]))[0] : null;
  }

  async markerErstattet(id: string, nytPunktId: string): Promise<void> {
    await this.db
      .update(beslutningspunkter)
      .set({ erstattetAf: nytPunktId })
      .where(eq(beslutningspunkter.id, id));
  }

  /** Henter kommentarerne (og deres billeder) for alle punkterne i to forespørgsler */
  private async medKommentarer(rows: BeslutningspunktRow[]): Promise<Beslutningspunkt[]> {
    if (rows.length === 0) return [];
    const alle = await this.db
      .select()
      .from(kommentarer)
      .where(inArray(kommentarer.beslutningspunktId, rows.map((r) => r.id)))
      .orderBy(asc(kommentarer.oprettetTidspunkt));
    const billeder = await vedhaeftningerForKommentarer(this.db, alle.map((k) => k.id));
    const pr = new Map<string, Kommentar[]>();
    for (const k of alle) {
      const kommentar = kommentarTilDomaene(k, billeder.get(k.id) ?? []);
      pr.set(k.beslutningspunktId, [...(pr.get(k.beslutningspunktId) ?? []), kommentar]);
    }
    return rows.map((r) => tilDomaene(r, pr.get(r.id) ?? []));
  }
}

function tilDomaene(row: BeslutningspunktRow, kommentarListe: Kommentar[]): Beslutningspunkt {
  return {
    id: row.id,
    opgaveId: row.opgaveId,
    stilletAf: row.stilletAf as Beslutningspunkt["stilletAf"],
    spoergsmaal: row.spoergsmaal,
    valgmuligheder: row.valgmuligheder,
    valgtMulighedId: row.valgtMulighedId,
    besluttetTidspunkt: row.besluttetTidspunkt?.toISOString() ?? null,
    tidligereValg: row.tidligereValg,
    erstattetAf: row.erstattetAf,
    kommentarer: kommentarListe,
  };
}
