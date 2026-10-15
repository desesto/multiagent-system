// Ruter: forbrug — oversigten til forbrugssiden og prisen pr. opgave.

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { IForbrugRepository } from "../../../../packages/domain/src/contracts/forbrug";
import { beregnOversigt, dagensStart } from "../forbrug/forbrugsBeregner";
import { koerselsPris } from "../forbrug/priser";
import { idParamSkema } from "./faelles";

export function forbrugRuter(
  forbrugRepo: IForbrugRepository,
  dagligtBudgetUsd: number | null
): FastifyPluginAsync {
  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Querystring: { dage?: number } }>(
      "/forbrug",
      {
        schema: {
          querystring: {
            type: "object",
            properties: { dage: { type: "integer", minimum: 1, maximum: 365, default: 30 } },
          },
        },
      },
      async (request) => {
        const nu = new Date();
        const dage = request.query.dage ?? 30;
        const koersler = await forbrugRepo.hentKoersler(dagensStart(nu, dage - 1));
        return beregnOversigt(koersler, { periodeDage: dage, nu, dagligtBudgetUsd });
      }
    );

    app.get<{ Params: { id: string } }>(
      "/opgaver/:id/forbrug",
      { schema: { params: idParamSkema } },
      async (request) => {
        const koersler = await forbrugRepo.hentKoersler(new Date(0), request.params.id);
        const priser = koersler.map(koerselsPris);
        return {
          usd: priser.reduce<number>((sum, p) => sum + (p ?? 0), 0),
          koersler: koersler.length,
          uprisede: priser.filter((p) => p === null).length,
        };
      }
    );
  };
}
