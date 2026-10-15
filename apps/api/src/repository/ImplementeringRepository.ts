// ImplementeringRepository — persistens for agenternes implementeringer.

import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { implementeringer, type ImplementeringRow } from "../db/schema";
import type { Implementering } from "../../../../packages/domain/src/domain/implementering";
import type {
  IImplementeringRepository,
  ImplementeringsOpdatering,
  NyImplementering,
} from "../../../../packages/domain/src/contracts/implementeringRepository";

export class ImplementeringRepository implements IImplementeringRepository {
  constructor(private readonly db: Db) {}

  async opret(ny: NyImplementering): Promise<Implementering> {
    const [row] = await this.db.insert(implementeringer).values(ny).returning();
    return tilDomaene(row);
  }

  async hent(id: string): Promise<Implementering | null> {
    const [row] = await this.db
      .select()
      .from(implementeringer)
      .where(eq(implementeringer.id, id));
    return row ? tilDomaene(row) : null;
  }

  async hentForOpgave(opgaveId: string): Promise<Implementering[]> {
    const rows = await this.db
      .select()
      .from(implementeringer)
      .where(eq(implementeringer.opgaveId, opgaveId))
      .orderBy(desc(implementeringer.oprettetTidspunkt));
    return rows.map(tilDomaene);
  }

  async opdater(
    id: string,
    felter: ImplementeringsOpdatering
  ): Promise<Implementering | null> {
    const { afsluttetTidspunkt, forbrug, ...resten } = felter;
    const [row] = await this.db
      .update(implementeringer)
      .set({
        ...resten,
        ...(forbrug !== undefined ? { tokenforbrug: forbrug } : {}),
        ...(afsluttetTidspunkt !== undefined
          ? { afsluttetTidspunkt: afsluttetTidspunkt ? new Date(afsluttetTidspunkt) : null }
          : {}),
      })
      .where(eq(implementeringer.id, id))
      .returning();
    return row ? tilDomaene(row) : null;
  }

  async markerAfbrudte(): Promise<Implementering[]> {
    const rows = await this.db
      .update(implementeringer)
      .set({
        status: "fejlet",
        fejl: "Afbrudt: serveren blev genstartet, mens agenten arbejdede",
        afsluttetTidspunkt: new Date(),
      })
      .where(eq(implementeringer.status, "koerer"))
      .returning();
    return rows.map(tilDomaene);
  }

  async markerAfbrudteBilleder(): Promise<Implementering[]> {
    const rows = await this.db
      .update(implementeringer)
      .set({
        billedStatus: "fejlet",
        billedBesked: "Afbrudt: serveren blev genstartet, mens billederne blev taget",
      })
      .where(eq(implementeringer.billedStatus, "tages"))
      .returning();
    return rows.map(tilDomaene);
  }
}

function tilDomaene(row: ImplementeringRow): Implementering {
  return {
    id: row.id,
    opgaveId: row.opgaveId,
    beslutningspunktId: row.beslutningspunktId,
    agentId: row.agentId,
    status: row.status,
    gren: row.gren,
    worktreeSti: row.worktreeSti,
    commitHash: row.commitHash,
    // Rækker fra før filtypen blev gemt, vises som "ændret"
    aendredeFiler: row.aendredeFiler.map((f) => ({ ...f, type: f.type ?? "aendret" })),
    laesteFiler: row.laesteFiler,
    opsummering: row.opsummering,
    fejl: row.fejl,
    forbrug: row.tokenforbrug ?? null,
    prisUsd: row.prisUsd,
    billedStatus: row.billedStatus,
    billedBesked: row.billedBesked,
    prUrl: row.prUrl,
    oprettetTidspunkt: row.oprettetTidspunkt.toISOString(),
    afsluttetTidspunkt: row.afsluttetTidspunkt?.toISOString() ?? null,
  };
}
