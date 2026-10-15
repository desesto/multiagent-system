// ProjektRepository — projekter og deres tal. Et projekt arkiveres (kan
// gendannes); kun et arkiveret projekt kan slettes permanent, og så
// forsvinder alt under det.

import { and, count, desc, eq, inArray, isNotNull, isNull, max, ne, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  agentsvar,
  beslutningspunkter,
  implementeringer,
  kommentarer,
  opgaver,
  projekter,
  type ProjektRow,
} from "../db/schema";
import type { Projekt, ProjektMedTal } from "../../../../packages/domain/src/domain/projekt";
import type {
  IProjektRepository,
  NytProjekt,
  RedigerProjekt,
  SletResultat,
} from "../../../../packages/domain/src/contracts/projektRepository";

/** Navnet på projektet, der samler gamle opgaver uden sti */
export const UDEN_PROJEKT = "Uden projekt";

export class ProjektRepository implements IProjektRepository {
  constructor(private readonly db: Db) {}

  async opret(nyt: NytProjekt): Promise<Projekt> {
    const [row] = await this.db.insert(projekter).values(nyt).returning();
    return tilDomaene(row);
  }

  async hent(id: string): Promise<Projekt | null> {
    const [row] = await this.db
      .select()
      .from(projekter)
      .where(eq(projekter.id, id));
    return row ? tilDomaene(row) : null;
  }

  async hentAlle(arkiverede = false): Promise<ProjektMedTal[]> {
    const ikkeSlettet = and(eq(opgaver.projektId, projekter.id), isNull(opgaver.slettetTidspunkt));
    const rows = await this.db
      .select({
        projekt: projekter,
        antal: count(opgaver.id),
        aktive: sql<number>`count(${opgaver.id}) filter (where ${ne(opgaver.status, "afsluttet")})`,
        seneste: max(opgaver.oprettetTidspunkt),
      })
      .from(projekter)
      .leftJoin(opgaver, ikkeSlettet)
      .where(arkiverede ? isNotNull(projekter.arkiveretTidspunkt) : isNull(projekter.arkiveretTidspunkt))
      .groupBy(projekter.id)
      .orderBy(desc(sql`coalesce(max(${opgaver.oprettetTidspunkt}), ${projekter.oprettetTidspunkt})`));
    return rows.map((r) => ({
      ...tilDomaene(r.projekt),
      antalOpgaver: Number(r.antal),
      aktiveOpgaver: Number(r.aktive),
      senesteAktivitet: r.seneste ? new Date(r.seneste).toISOString() : null,
    }));
  }

  async opdater(id: string, felter: RedigerProjekt): Promise<Projekt | null> {
    const [row] = await this.db
      .update(projekter)
      .set(felter)
      .where(eq(projekter.id, id))
      .returning();
    return row ? tilDomaene(row) : null;
  }

  async arkiver(id: string): Promise<Projekt | null> {
    return this.saetArkiveret(id, new Date());
  }

  async gendan(id: string): Promise<Projekt | null> {
    return this.saetArkiveret(id, null);
  }

  private async saetArkiveret(id: string, tidspunkt: Date | null): Promise<Projekt | null> {
    const [row] = await this.db
      .update(projekter)
      .set({ arkiveretTidspunkt: tidspunkt })
      .where(eq(projekter.id, id))
      .returning();
    return row ? tilDomaene(row) : null;
  }

  async sletPermanent(id: string): Promise<SletResultat> {
    return this.db.transaction(async (tx) => {
      const [projekt] = await tx.select().from(projekter).where(eq(projekter.id, id));
      if (!projekt) return "findes_ikke";
      if (!projekt.arkiveretTidspunkt) return "ikke_arkiveret";

      // Alle opgaver — også dem, der er slettet enkeltvis — hører med
      const opgaveIder = (
        await tx.select({ id: opgaver.id }).from(opgaver).where(eq(opgaver.projektId, id))
      ).map((o) => o.id);
      if (opgaveIder.length > 0) {
        const aabne = await tx
          .select({ id: implementeringer.id })
          .from(implementeringer)
          .where(
            and(
              inArray(implementeringer.opgaveId, opgaveIder),
              inArray(implementeringer.status, ["koerer", "klar"])
            )
          );
        if (aabne.length > 0) return "aabne_implementeringer";

        const punktIder = (
          await tx
            .select({ id: beslutningspunkter.id })
            .from(beslutningspunkter)
            .where(inArray(beslutningspunkter.opgaveId, opgaveIder))
        ).map((p) => p.id);
        // Børn før forældre, så ingen fremmednøgle peger på noget, der er væk
        if (punktIder.length > 0) {
          await tx.delete(kommentarer).where(inArray(kommentarer.beslutningspunktId, punktIder));
        }
        await tx.delete(agentsvar).where(inArray(agentsvar.opgaveId, opgaveIder));
        await tx.delete(implementeringer).where(inArray(implementeringer.opgaveId, opgaveIder));
        // Punkterne kan pege på hinanden (ny vurdering) — én sætning sletter dem alle samtidig
        await tx.delete(beslutningspunkter).where(inArray(beslutningspunkter.opgaveId, opgaveIder));
        await tx.delete(opgaver).where(inArray(opgaver.id, opgaveIder));
      }
      await tx.delete(projekter).where(eq(projekter.id, id));
      return "slettet";
    });
  }

  async tildelGamleOpgaver(): Promise<number> {
    const loese = await this.db
      .select({ id: opgaver.id, sti: opgaver.projektSti })
      .from(opgaver)
      .where(isNull(opgaver.projektId));
    const projektPrSti = new Map<string | null, string>();
    for (const o of loese) {
      const noegle = o.sti?.trim() || null;
      let projektId = projektPrSti.get(noegle);
      if (!projektId) {
        projektId = (await this.findEllerOpret(noegle)).id;
        projektPrSti.set(noegle, projektId);
      }
      await this.db.update(opgaver).set({ projektId }).where(eq(opgaver.id, o.id));
    }
    return loese.length;
  }

  /** Projektet med denne sti (eller "Uden projekt"), oprettet hvis det mangler */
  private async findEllerOpret(sti: string | null): Promise<Projekt> {
    const [findes] = await this.db
      .select()
      .from(projekter)
      .where(
        and(
          isNull(projekter.arkiveretTidspunkt),
          sti ? eq(projekter.sti, sti) : and(isNull(projekter.sti), eq(projekter.navn, UDEN_PROJEKT))
        )
      );
    if (findes) return tilDomaene(findes);
    return this.opret({ navn: sti ? mappeNavn(sti) : UDEN_PROJEKT, beskrivelse: "", sti });
  }
}

/** Sidste del af en sti — virker for både Windows- og Unix-stier */
export function mappeNavn(sti: string): string {
  return sti.split(/[\\/]+/).filter(Boolean).at(-1) ?? sti;
}

function tilDomaene(row: ProjektRow): Projekt {
  return {
    id: row.id,
    navn: row.navn,
    beskrivelse: row.beskrivelse,
    sti: row.sti,
    arkiveretTidspunkt: row.arkiveretTidspunkt?.toISOString() ?? null,
    oprettetTidspunkt: row.oprettetTidspunkt.toISOString(),
  };
}
