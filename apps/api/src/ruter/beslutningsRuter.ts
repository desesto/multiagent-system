// Ruter: beslutningspunkter — hente åbne, vælge, fortryde, fulde svar.
// Valg er endelige indtil de eksplicit fortrydes; fortrydelser
// overskriver aldrig historikken (tidligereValg-loggen).

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { IBeslutningspunktRepository } from "../../../../packages/domain/src/contracts/beslutningspunktRepository";
import type { IOpgaveRepository } from "../../../../packages/domain/src/contracts/opgaveRepository";
import type { IAgentSvarRepository } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import type { IKommentarRepository } from "../../../../packages/domain/src/contracts/kommentarRepository";
import { KoordinatorFejl } from "../core/KoordinatorFejl";
import type { AnalyseKoordinator } from "../core/AnalyseKoordinator";
import type { IVedhaeftningRepository } from "../../../../packages/domain/src/contracts/vedhaeftningRepository";
import { idParamSkema } from "./faelles";
import { VEDHAEFTNING_IDER_SKEMA } from "./vedhaeftningRuter";

export function beslutningsRuter(
  punktRepo: IBeslutningspunktRepository,
  opgaveRepo: IOpgaveRepository,
  svarRepo: IAgentSvarRepository,
  kommentarRepo: IKommentarRepository,
  analyse: AnalyseKoordinator,
  vedhaeftningRepo: IVedhaeftningRepository
): FastifyPluginAsync {
  return async function (app: FastifyInstance) {
    app.get("/beslutningspunkter/aabne", async () => {
      return punktRepo.hentAabne();
    });

    app.get<{ Params: { id: string } }>(
      "/beslutningspunkter/:id/svar",
      { schema: { params: idParamSkema } },
      async (request) => {
        return svarRepo.hentForBeslutningspunkt(request.params.id);
      }
    );

    app.post<{ Params: { id: string }; Body: { valgtMulighedId: string } }>(
      "/beslutningspunkter/:id/valg",
      {
        schema: {
          params: idParamSkema,
          body: {
            type: "object",
            required: ["valgtMulighedId"],
            additionalProperties: false,
            properties: { valgtMulighedId: { type: "string", minLength: 1 } },
          },
        },
      },
      async (request, reply) => {
        const punkt = await punktRepo.registrerValg(
          request.params.id,
          request.body.valgtMulighedId
        );
        if (!punkt) {
          return reply
            .code(409)
            .send({ fejl: "Punktet findes ikke eller er allerede besluttet" });
        }
        await opgaveRepo.opdaterStatus(punkt.opgaveId, "i_gang");
        return punkt;
      }
    );

    app.post<{ Params: { id: string }; Body: { tekst: string; vedhaeftningIder?: string[] } }>(
      "/beslutningspunkter/:id/kommentarer",
      {
        schema: {
          params: idParamSkema,
          body: {
            type: "object",
            required: ["tekst"],
            additionalProperties: false,
            properties: {
              tekst: { type: "string", minLength: 1, maxLength: 4000 },
              vedhaeftningIder: VEDHAEFTNING_IDER_SKEMA,
            },
          },
        },
      },
      async (request, reply) => {
        const punkt = await punktRepo.hent(request.params.id);
        if (!punkt) return reply.code(404).send({ fejl: "Beslutningspunktet findes ikke" });
        if (punkt.erstattetAf) {
          return reply.code(409).send({ fejl: "Forslaget er erstattet af en ny vurdering — kommentér på det nyeste" });
        }
        const tekst = request.body.tekst.trim();
        if (!tekst) return reply.code(400).send({ fejl: "Kommentaren er tom" });
        const kommentar = await kommentarRepo.opret(punkt.id, tekst);
        const ider = request.body.vedhaeftningIder ?? [];
        if (ider.length === 0) return reply.code(201).send(kommentar);
        await vedhaeftningRepo.knytTilKommentar(ider, kommentar.id);
        const billeder = await vedhaeftningRepo.hentForKommentarer([kommentar.id]);
        return reply.code(201).send({ ...kommentar, vedhaeftninger: billeder.get(kommentar.id) ?? [] });
      }
    );

    app.delete<{ Params: { id: string } }>(
      "/kommentarer/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        if (!(await kommentarRepo.slet(request.params.id))) {
          return reply.code(404).send({ fejl: "Kommentaren findes ikke" });
        }
        return reply.code(204).send();
      }
    );

    // Ny vurdering: agenterne kører igen med de tidligere forslag og kommentarerne
    app.post<{ Params: { id: string } }>(
      "/beslutningspunkter/:id/reevaluer",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        try {
          const nyt = await analyse.reevaluer(request.params.id, (f) => request.log.error(f));
          return reply.code(201).send(nyt);
        } catch (fejl) {
          if (fejl instanceof KoordinatorFejl) return reply.code(fejl.status).send({ fejl: fejl.message });
          throw fejl;
        }
      }
    );

    app.post<{ Params: { id: string } }>(
      "/beslutningspunkter/:id/fortryd",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const punkt = await punktRepo.fortrydValg(request.params.id);
        if (!punkt) {
          return reply
            .code(409)
            .send({ fejl: "Punktet findes ikke eller er ikke besluttet" });
        }
        await opgaveRepo.opdaterStatus(punkt.opgaveId, "afventer_beslutning");
        return punkt;
      }
    );
  };
}
