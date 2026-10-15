// Ruter: før/efter-billeder. Kun læsning — billederne tages af
// systemet selv, når en visuel implementering er færdig.

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { ISkaermbilledRepository } from "../../../../packages/domain/src/contracts/skaermbilleder";
import { idParamSkema } from "./faelles";

export function skaermbilledRuter(repo: ISkaermbilledRepository): FastifyPluginAsync {
  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Params: { id: string } }>(
      "/implementeringer/:id/skaermbilleder",
      { schema: { params: idParamSkema } },
      async (request) => repo.hentForImplementering(request.params.id)
    );

    // Selve billedet. Det ændrer sig aldrig, så browseren må gemme det.
    app.get<{ Params: { id: string } }>(
      "/skaermbilleder/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const png = await repo.hentPng(request.params.id);
        if (!png) return reply.code(404).send({ fejl: "Billedet findes ikke" });
        return reply
          .header("Content-Type", "image/png")
          .header("Cache-Control", "private, max-age=31536000, immutable")
          // Frontenden (port 5173) er samme "site" — tillad den at vise billedet
          .header("Cross-Origin-Resource-Policy", "same-site")
          .send(Buffer.from(png));
      }
    );
  };
}
