// Ruter: implementeringer — start, se status, ryd op.
// Fletning sker IKKE her: brugeren fletter selv med git.

import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import type { IImplementeringRepository } from "../../../../packages/domain/src/contracts/implementeringRepository";
import { KoordinatorFejl } from "../core/KoordinatorFejl";
import type { ImplementeringsKoordinator } from "../core/ImplementeringsKoordinator";
import type { ImplementeringsGennemsyn } from "../core/ImplementeringsGennemsyn";
import { idParamSkema } from "./faelles";
import { BILLED_HEADERE } from "../git/billedfiler";
import type { FilVersion } from "../../../../packages/domain/src/domain/diff";

export function implementeringsRuter(
  koordinator: ImplementeringsKoordinator,
  gennemsyn: ImplementeringsGennemsyn,
  implRepo: IImplementeringRepository
): FastifyPluginAsync {
  return async function (app: FastifyInstance): Promise<void> {
    // 202: agenten arbejder i baggrunden — browseren følger status via GET
    app.post<{ Params: { id: string } }>(
      "/beslutningspunkter/:id/implementer",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        try {
          return reply.code(202).send(await koordinator.start(request.params.id));
        } catch (fejl) {
          return sendFejl(reply, fejl);
        }
      }
    );

    app.get<{ Params: { id: string } }>(
      "/opgaver/:id/implementeringer",
      { schema: { params: idParamSkema } },
      async (request) => implRepo.hentForOpgave(request.params.id)
    );

    // Én fils ændringer, som på GitHub — kun filer i implementeringens commit
    app.get<{ Params: { id: string }; Querystring: { sti: string } }>(
      "/implementeringer/:id/fil",
      {
        schema: {
          params: idParamSkema,
          querystring: {
            type: "object",
            required: ["sti"],
            properties: { sti: { type: "string", minLength: 1 } },
          },
        },
      },
      async (request, reply) => {
        try {
          return await gennemsyn.filDiff(request.params.id, request.query.sti);
        } catch (fejl) {
          return sendFejl(reply, fejl);
        }
      }
    );

    // Én version af en billedfil — vises som billede i filgennemsynet
    app.get<{ Params: { id: string }; Querystring: { sti: string; version: FilVersion } }>(
      "/implementeringer/:id/billede",
      {
        schema: {
          params: idParamSkema,
          querystring: {
            type: "object",
            required: ["sti", "version"],
            properties: {
              sti: { type: "string", minLength: 1 },
              version: { type: "string", enum: ["foer", "efter"] },
            },
          },
        },
      },
      async (request, reply) => {
        try {
          const { bytes, type } = await gennemsyn.billedfil(
            request.params.id,
            request.query.sti,
            request.query.version
          );
          return reply.headers(BILLED_HEADERE).type(type).send(bytes);
        } catch (fejl) {
          return sendFejl(reply, fejl);
        }
      }
    );

    app.post<{ Params: { id: string } }>(
      "/implementeringer/:id/ryd",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        try {
          return await koordinator.ryd(request.params.id);
        } catch (fejl) {
          return sendFejl(reply, fejl);
        }
      }
    );
  };
}

function sendFejl(reply: FastifyReply, fejl: unknown): FastifyReply {
  if (fejl instanceof KoordinatorFejl) return reply.code(fejl.status).send({ fejl: fejl.message });
  throw fejl; // uventet: Fastify logger og svarer 500
}
