// Ruter: mappebrowseren bag knappen "Gennemse filer".

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { FilAdgangsFejl } from "../../../../packages/domain/src/contracts/filAdgang";
import { listMapper } from "../vaerktoejer/mappeBrowser";

export function mappeRuter(projektRod: string | undefined): FastifyPluginAsync {
  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Querystring: { sti?: string } }>(
      "/mapper",
      {
        schema: {
          querystring: { type: "object", properties: { sti: { type: "string", maxLength: 1000 } } },
        },
      },
      async (request, reply) => {
        if (!projektRod) {
          return reply.code(409).send({
            fejl: "Sæt PROJEKT_ROD i apps\\api\\.env (fx din IdeaProjects-mappe) for at kunne gennemse mapper",
          });
        }
        try {
          return await listMapper(projektRod, request.query.sti || undefined);
        } catch (fejl) {
          if (fejl instanceof FilAdgangsFejl) return reply.code(400).send({ fejl: fejl.message });
          throw fejl;
        }
      }
    );
  };
}
