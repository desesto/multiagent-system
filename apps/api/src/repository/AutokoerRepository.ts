// AutokoerRepository — køen af opgaver til autokør.

import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import type { Db } from "../db/db";
import { autokoer, opgaver, type AutokoerRow } from "../db/schema";
import type { AutokoerPost } from "../../../../packages/domain/src/domain/autokoer";
import type {
  AutokoerOpdatering,
  IAutokoerRepository,
} from "../../../../packages/domain/src/contracts/autokoer";

const AKTIVE = ["venter", "koerer"] as const;

export class AutokoerRepository implements IAutokoerRepository {
  constructor(private readonly db: Db) {}

  async tilfoej(opgaveIder: string[]): Promise<number> {
    if (opgaveIder.length === 0) return 0;
    const iKoeen = await this.db
      .select({ opgaveId: autokoer.opgaveId })
      .from(autokoer)
      .where(and(inArray(autokoer.opgaveId, opgaveIder), inArray(autokoer.status, [...AKTIVE])));
    const allerede = new Set(iKoeen.map((r) => r.opgaveId));
    const nye = [...new Set(opgaveIder)].filter((id) => !allerede.has(id));
    if (nye.length === 0) return 0;
    // Hver sit tidspunkt, så rækkefølgen er den, brugeren valgte i
    const nu = Date.now();
    await this.db
      .insert(autokoer)
      .values(nye.map((opgaveId, i) => ({ opgaveId, tilfoejetTidspunkt: new Date(nu + i) })));
    return nye.length;
  }

  async hentForProjekt(projektId: string): Promise<AutokoerPost[]> {
    const rows = await this.db
      .select({ post: autokoer, titel: opgaver.titel })
      .from(autokoer)
      .innerJoin(opgaver, eq(autokoer.opgaveId, opgaver.id))
      .where(eq(opgaver.projektId, projektId))
      .orderBy(desc(autokoer.tilfoejetTidspunkt))
      .limit(50);
    return rows.map((r) => tilDomaene(r.post, r.titel));
  }

  async naeste(): Promise<AutokoerPost | null> {
    const [r] = await this.db
      .select({ post: autokoer, titel: opgaver.titel })
      .from(autokoer)
      .innerJoin(opgaver, eq(autokoer.opgaveId, opgaver.id))
      .where(eq(autokoer.status, "venter"))
      .orderBy(asc(autokoer.tilfoejetTidspunkt))
      .limit(1);
    return r ? tilDomaene(r.post, r.titel) : null;
  }

  async opdater(id: string, felter: AutokoerOpdatering): Promise<void> {
    const { forbrug, startetTidspunkt, afsluttetTidspunkt, ...resten } = felter;
    await this.db
      .update(autokoer)
      .set({
        ...resten,
        ...(forbrug !== undefined ? { tokenforbrug: forbrug } : {}),
        ...(startetTidspunkt !== undefined ? { startetTidspunkt: dato(startetTidspunkt) } : {}),
        ...(afsluttetTidspunkt !== undefined ? { afsluttetTidspunkt: dato(afsluttetTidspunkt) } : {}),
      })
      .where(eq(autokoer.id, id));
  }

  async fjern(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(autokoer)
      .where(and(eq(autokoer.id, id), eq(autokoer.status, "venter")))
      .returning({ id: autokoer.id });
    return rows.length > 0;
  }

  async antalStartetSiden(tidspunkt: Date): Promise<number> {
    const [r] = await this.db
      .select({ antal: count() })
      .from(autokoer)
      .where(gte(autokoer.startetTidspunkt, tidspunkt));
    return r?.antal ?? 0;
  }

  async markerAfbrudte(): Promise<number> {
    const rows = await this.db
      .update(autokoer)
      .set({
        status: "fejlet",
        besked: "Afbrudt: serveren blev genstartet, mens opgaven kørte",
        afsluttetTidspunkt: new Date(),
      })
      .where(eq(autokoer.status, "koerer"))
      .returning({ id: autokoer.id });
    return rows.length;
  }
}

function dato(v: string | null): Date | null {
  return v ? new Date(v) : null;
}

function tilDomaene(row: AutokoerRow, titel: string): AutokoerPost {
  return {
    id: row.id,
    opgaveId: row.opgaveId,
    opgaveTitel: titel,
    status: row.status,
    valgtAf: row.valgtAf,
    begrundelse: row.begrundelse,
    implementeringId: row.implementeringId,
    prUrl: row.prUrl,
    besked: row.besked,
    forbrug: row.tokenforbrug ?? null,
    tilfoejetTidspunkt: row.tilfoejetTidspunkt.toISOString(),
    startetTidspunkt: row.startetTidspunkt?.toISOString() ?? null,
    afsluttetTidspunkt: row.afsluttetTidspunkt?.toISOString() ?? null,
  };
}
