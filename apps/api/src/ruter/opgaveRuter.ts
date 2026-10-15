// Ruter: opgaver — oprettelse (med multiagent-flowet), læsning,
// redigering og soft delete.

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type {
  IOpgaveRepository,
  RedigerOpgave,
} from "../../../../packages/domain/src/contracts/opgaveRepository";
import type { Opgave } from "../../../../packages/domain/src/domain/opgave";
import type { IBeslutningspunktRepository } from "../../../../packages/domain/src/contracts/beslutningspunktRepository";
import type { IAgentSvarRepository } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import type { IProjektRepository } from "../../../../packages/domain/src/contracts/projektRepository";
import { KoordinatorFejl } from "../core/KoordinatorFejl";
import type { AnalyseKoordinator } from "../core/AnalyseKoordinator";
import type { IVedhaeftningRepository } from "../../../../packages/domain/src/contracts/vedhaeftningRepository";
import { MAX_VEDHAEFTNINGER } from "../../../../packages/domain/src/domain/vedhaeftning";
import { idParamSkema, UUID_MOENSTER } from "./faelles";
import { VEDHAEFTNING_IDER_SKEMA } from "./vedhaeftningRuter";

export function opgaveRuter(
  analyse: AnalyseKoordinator,
  opgaveRepo: IOpgaveRepository,
  punktRepo: IBeslutningspunktRepository,
  svarRepo: IAgentSvarRepository,
  projektRepo: IProjektRepository,
  vedhaeftningRepo: IVedhaeftningRepository
): FastifyPluginAsync {
  return async function (app: FastifyInstance) {
    app.post<{ Body: NyOpgaveBody }>(
      "/opgaver",
      {
        schema: {
          body: {
            type: "object",
            required: ["titel", "type", "oprettetAfBrugerId", "projektId"],
            additionalProperties: false,
            properties: {
              titel: { type: "string", minLength: 1 },
              beskrivelse: { type: "string", default: "" },
              type: {
                type: "string",
                enum: [
                  "bugfix",
                  "ny_feature",
                  "system_fra_bunden",
                  "prototype",
                ],
              },
              fokuspunkter: {
                type: "array",
                items: { type: "string" },
                default: [],
              },
              oprettetAfBrugerId: { type: "string", pattern: UUID_MOENSTER },
              projektId: { type: "string", pattern: UUID_MOENSTER },
              omraade: OMRAADE_SKEMA,
              vedhaeftningIder: VEDHAEFTNING_IDER_SKEMA,
            },
          },
        },
      },
      async (request, reply) => {
        // 1. Opgaven hører til et projekt og arver dets sti (valideret, da projektet blev gemt)
        const projekt = await projektRepo.hent(request.body.projektId);
        if (!projekt) return reply.code(404).send({ fejl: "Projektet findes ikke" });
        if (projekt.arkiveretTidspunkt) {
          return reply.code(409).send({ fejl: "Projektet er arkiveret — gendan det, før der oprettes opgaver" });
        }
        const projektSti = projekt.sti;

        // 2. Gem opgaven og dens billeder, og lad agenterne analysere den — med billederne
        const { vedhaeftningIder = [], ...felter } = request.body;
        const opgave = await opgaveRepo.opret({ ...felter, omraade: felter.omraade ?? null, projektSti });
        await vedhaeftningRepo.knytTilOpgave(vedhaeftningIder, opgave.id);
        try {
          await analyse.analyser(opgave, opgave.beskrivelse, (f) => request.log.error(f));
        } catch (fejl) {
          // Fejlede alle agenter, ryddes opgaven op, så den ikke står halvt oprettet
          await opgaveRepo.slet(opgave.id);
          if (fejl instanceof KoordinatorFejl) return reply.code(fejl.status).send({ fejl: fejl.message });
          throw fejl;
        }
        return reply.code(201).send((await opgaveRepo.hent(opgave.id)) ?? opgave);
      }
    );

    app.get<{ Querystring: { ekskluderAfsluttede?: string; projektId?: string } }>(
      "/opgaver",
      {
        schema: {
          querystring: {
            type: "object",
            properties: {
              ekskluderAfsluttede: { type: "string", enum: ["true", "false"] },
              projektId: { type: "string", pattern: UUID_MOENSTER },
            },
          },
        },
      },
      async (request) => {
        const ekskluder = request.query.ekskluderAfsluttede === "true";
        return opgaveRepo.hentAlle(ekskluder, request.query.projektId);
      }
    );

    app.get<{ Params: { id: string } }>(
      "/opgaver/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const opgave = await opgaveRepo.hent(request.params.id);
        if (!opgave) {
          return reply.code(404).send({ fejl: "Opgaven findes ikke" });
        }
        return opgave;
      }
    );

    app.get<{ Params: { id: string } }>(
      "/opgaver/:id/beslutningspunkter",
      { schema: { params: idParamSkema } },
      async (request) => {
        return punktRepo.hentForOpgave(request.params.id);
      }
    );

    app.get<{ Params: { id: string } }>(
      "/opgaver/:id/agentsvar",
      { schema: { params: idParamSkema } },
      async (request) => {
        return svarRepo.hentForOpgave(request.params.id);
      }
    );

    app.patch<{ Params: { id: string }; Body: RedigerOpgave & { vedhaeftningIder?: string[] } }>(
      "/opgaver/:id",
      {
        schema: {
          params: idParamSkema,
          body: {
            type: "object",
            additionalProperties: false,
            minProperties: 1,
            properties: {
              titel: { type: "string", minLength: 1 },
              beskrivelse: { type: "string" },
              fokuspunkter: { type: "array", items: { type: "string" } },
              omraade: OMRAADE_SKEMA,
              vedhaeftningIder: VEDHAEFTNING_IDER_SKEMA,
            },
          },
        },
      },
      async (request, reply) => {
        const { vedhaeftningIder = [], ...felter } = request.body;
        // Ukendte felter fjernes af valideringen — står der intet tilbage, er der intet at gemme
        if (Object.keys(felter).length === 0 && vedhaeftningIder.length === 0) {
          return reply.code(400).send({ fejl: "Intet at ændre (stien ændres på projektet)" });
        }
        const eksisterende = await opgaveRepo.hent(request.params.id);
        if (!eksisterende) return reply.code(404).send({ fejl: "Opgaven findes ikke" });
        if (vedhaeftningIder.length > 0) {
          const antal = (await vedhaeftningRepo.hentForOpgave(eksisterende.id)).length;
          if (antal + vedhaeftningIder.length > MAX_VEDHAEFTNINGER) {
            return reply.code(400).send({ fejl: `Højst ${MAX_VEDHAEFTNINGER} billeder pr. opgave` });
          }
          await vedhaeftningRepo.knytTilOpgave(vedhaeftningIder, eksisterende.id);
        }
        if (Object.keys(felter).length === 0) return eksisterende;
        const opgave = await opgaveRepo.opdater(request.params.id, felter);
        if (!opgave) return reply.code(404).send({ fejl: "Opgaven findes ikke" });
        return opgave;
      }
    );

    app.delete<{ Params: { id: string } }>(
      "/opgaver/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const slettet = await opgaveRepo.slet(request.params.id);
        if (!slettet)
          return reply.code(404).send({ fejl: "Opgaven findes ikke" });
        return reply.code(204).send();
      }
    );
  };
}

/** Det, browseren sender ved oprettelse — stien kommer fra projektet */
interface NyOpgaveBody {
  titel: string;
  beskrivelse: string;
  type: Opgave["type"];
  fokuspunkter: string[];
  oprettetAfBrugerId: string;
  projektId: string;
  omraade?: Opgave["omraade"];
  /** Billeder uploadet på forhånd — kobles på, før agenterne analyserer */
  vedhaeftningIder?: string[];
}

/** null = ikke angivet */
const OMRAADE_SKEMA = {
  type: ["string", "null"],
  enum: ["frontend", "backend", "fuldstack", "andet", null],
} as const;
