// ForbrugRepository — alle kørsler med forbrugsdata, som én fælles liste.
// Kørsler uden nogen data (mock, eller fra før forbruget blev gemt)
// udelades, så de ikke forvrider tallene. Slettede opgaver tæller med:
// pengene er brugt alligevel.

import { and, eq, gte, isNotNull, or } from "drizzle-orm";
import type { Db } from "../db/db";
import { agenter, agentsvar, autokoer, implementeringer, opgaver } from "../db/schema";
import type { Koersel } from "../../../../packages/domain/src/domain/forbrug";
import type { IForbrugRepository } from "../../../../packages/domain/src/contracts/forbrug";

export class ForbrugRepository implements IForbrugRepository {
  constructor(private readonly db: Db) {}

  async hentKoersler(fra: Date, opgaveId?: string): Promise<Koersel[]> {
    const analyser = await this.db
      .select({
        tid: agentsvar.oprettetTidspunkt,
        opgaveId: agentsvar.opgaveId,
        titel: opgaver.titel,
        navn: agenter.navn,
        forbrug: agentsvar.tokenforbrug,
      })
      .from(agentsvar)
      .innerJoin(opgaver, eq(agentsvar.opgaveId, opgaver.id))
      .innerJoin(agenter, eq(agentsvar.agentId, agenter.id))
      .where(
        and(
          gte(agentsvar.oprettetTidspunkt, fra),
          isNotNull(agentsvar.tokenforbrug),
          opgaveId ? eq(agentsvar.opgaveId, opgaveId) : undefined
        )
      );

    const impl = await this.db
      .select({
        tid: implementeringer.oprettetTidspunkt,
        opgaveId: implementeringer.opgaveId,
        titel: opgaver.titel,
        navn: agenter.navn,
        forbrug: implementeringer.tokenforbrug,
        prisUsd: implementeringer.prisUsd,
      })
      .from(implementeringer)
      .innerJoin(opgaver, eq(implementeringer.opgaveId, opgaver.id))
      .innerJoin(agenter, eq(implementeringer.agentId, agenter.id))
      .where(
        and(
          gte(implementeringer.oprettetTidspunkt, fra),
          or(isNotNull(implementeringer.tokenforbrug), isNotNull(implementeringer.prisUsd)),
          opgaveId ? eq(implementeringer.opgaveId, opgaveId) : undefined
        )
      );

    // Arkitektens retningsvalg i autokør — et lille kald, men betalt
    const valg = await this.db
      .select({
        tid: autokoer.startetTidspunkt,
        opgaveId: autokoer.opgaveId,
        titel: opgaver.titel,
        navn: agenter.navn,
        forbrug: autokoer.tokenforbrug,
      })
      .from(autokoer)
      .innerJoin(opgaver, eq(autokoer.opgaveId, opgaver.id))
      .innerJoin(agenter, eq(autokoer.valgtAfAgentId, agenter.id))
      .where(
        and(
          gte(autokoer.startetTidspunkt, fra),
          isNotNull(autokoer.tokenforbrug),
          opgaveId ? eq(autokoer.opgaveId, opgaveId) : undefined
        )
      );

    return [
      ...valg.map((r): Koersel => ({
        type: "analyse",
        tidspunkt: (r.tid ?? new Date()).toISOString(),
        opgaveId: r.opgaveId,
        opgaveTitel: r.titel,
        agentNavn: r.navn,
        forbrug: r.forbrug ?? null,
        prisUsd: null,
      })),
      ...analyser.map((r): Koersel => ({
        type: "analyse",
        tidspunkt: r.tid.toISOString(),
        opgaveId: r.opgaveId,
        opgaveTitel: r.titel,
        agentNavn: r.navn,
        forbrug: r.forbrug ?? null,
        prisUsd: null,
      })),
      ...impl.map((r): Koersel => ({
        type: "implementering",
        tidspunkt: r.tid.toISOString(),
        opgaveId: r.opgaveId,
        opgaveTitel: r.titel,
        agentNavn: r.navn,
        forbrug: r.forbrug ?? null,
        prisUsd: r.prisUsd,
      })),
    ];
  }
}
