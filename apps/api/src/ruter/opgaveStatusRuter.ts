// Ruter: opgavens livscyklus — afslut og genåbn. Systemet afslutter
// aldrig selv en opgave: én opgave kan kræve flere implementeringer,
// og kun brugeren ved, hvornår resultatet er godt nok.

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { IOpgaveRepository } from "../../../../packages/domain/src/contracts/opgaveRepository";
import type { IImplementeringRepository } from "../../../../packages/domain/src/contracts/implementeringRepository";
import { idParamSkema } from "./faelles";

export function opgaveStatusRuter(
  opgaveRepo: IOpgaveRepository,
  implRepo: IImplementeringRepository
): FastifyPluginAsync {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Params: { id: string } }>(
      "/opgaver/:id/afslut",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const implementeringer = await implRepo.hentForOpgave(request.params.id);
        if (implementeringer.some((i) => i.status === "koerer")) {
          return reply.code(409).send({ fejl: "En agent arbejder stadig på opgaven — vent, til den er færdig" });
        }
        const opgave = await opgaveRepo.opdaterStatus(request.params.id, "afsluttet");
        if (!opgave) return reply.code(404).send({ fejl: "Opgaven findes ikke" });
        return opgave;
      }
    );

    app.post<{ Params: { id: string } }>(
      "/opgaver/:id/genaabn",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const opgave = await opgaveRepo.opdaterStatus(request.params.id, "i_gang");
        if (!opgave) return reply.code(404).send({ fejl: "Opgaven findes ikke" });
        return opgave;
      }
    );
  };
}
