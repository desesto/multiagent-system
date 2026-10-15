// Ruter: autokør — køen, start og stop. Selve arbejdet sker i Autokoerer.

import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import type { IAutokoerRepository } from "../../../../packages/domain/src/contracts/autokoer";
import type { IOpgaveRepository } from "../../../../packages/domain/src/contracts/opgaveRepository";
import type { Autokoerer } from "../core/Autokoerer";
import { KoordinatorFejl } from "../core/KoordinatorFejl";
import { idParamSkema, UUID_MOENSTER } from "./faelles";

export function autokoerRuter(
  autokoerer: Autokoerer,
  repo: IAutokoerRepository,
  opgaveRepo: IOpgaveRepository
): FastifyPluginAsync {
  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Params: { id: string } }>(
      "/projekter/:id/autokoer",
      { schema: { params: idParamSkema } },
      async (request) => ({
        tilstand: await autokoerer.tilstand(),
        poster: await repo.hentForProjekt(request.params.id),
      })
    );

    app.post<{ Body: { opgaveIder: string[] } }>(
      "/autokoer",
      {
        schema: {
          body: {
            type: "object",
            required: ["opgaveIder"],
            additionalProperties: false,
            properties: {
              opgaveIder: {
                type: "array",
                minItems: 1,
                maxItems: 20,
                uniqueItems: true,
                items: { type: "string", pattern: UUID_MOENSTER },
              },
            },
          },
        },
      },
      async (request, reply) => {
        for (const id of request.body.opgaveIder) {
          const opgave = await opgaveRepo.hent(id);
          if (!opgave) return reply.code(404).send({ fejl: "En af opgaverne findes ikke" });
          if (opgave.status === "afsluttet") {
            return reply.code(409).send({ fejl: `"${opgave.titel}" er afsluttet` });
          }
          if (!opgave.projektSti) {
            return reply.code(400).send({ fejl: `"${opgave.titel}" har ingen projektsti` });
          }
        }
        return reply.code(201).send({ tilfoejet: await repo.tilfoej(request.body.opgaveIder) });
      }
    );

    app.delete<{ Params: { id: string } }>(
      "/autokoer/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        if (!(await repo.fjern(request.params.id))) {
          return reply.code(409).send({ fejl: "Kun opgaver, der venter, kan tages ud af køen" });
        }
        return reply.code(204).send();
      }
    );

    app.post("/autokoer/start", async (_request, reply) => {
      try {
        return await autokoerer.start();
      } catch (fejl) {
        return sendFejl(reply, fejl);
      }
    });

    app.post("/autokoer/stop", async () => autokoerer.stop());
  };
}

function sendFejl(reply: FastifyReply, fejl: unknown): FastifyReply {
  if (fejl instanceof KoordinatorFejl) return reply.code(fejl.status).send({ fejl: fejl.message });
  throw fejl;
}
