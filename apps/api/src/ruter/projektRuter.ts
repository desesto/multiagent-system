// Ruter: projekter — toppen af hierarkiet. Stien valideres her, når et
// projekt gemmes, og opgaverne arver den.

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { IFilAdgangFabrik } from "../../../../packages/domain/src/contracts/filAdgang";
import type { IOpgaveRepository } from "../../../../packages/domain/src/contracts/opgaveRepository";
import type {
  IProjektRepository,
  NytProjekt,
  RedigerProjekt,
} from "../../../../packages/domain/src/contracts/projektRepository";
import { idParamSkema } from "./faelles";

const FELTER = {
  navn: { type: "string", minLength: 1, maxLength: 200 },
  beskrivelse: { type: "string", maxLength: 4000 },
  sti: { type: ["string", "null"], maxLength: 1000 },
} as const;

export function projektRuter(
  projektRepo: IProjektRepository,
  opgaveRepo: IOpgaveRepository,
  filAdgangFabrik: IFilAdgangFabrik
): FastifyPluginAsync {
  /** Tom sti = null; ellers skal den være en gyldig mappe (samme regler som før) */
  async function rensSti(sti: string | null | undefined): Promise<{ sti: string | null } | { fejl: string }> {
    const renset = sti?.trim() || null;
    if (!renset) return { sti: null };
    const fejl = await filAdgangFabrik.valider(renset);
    return fejl ? { fejl } : { sti: renset };
  }

  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Querystring: { arkiverede?: string } }>(
      "/projekter",
      { schema: { querystring: { type: "object", properties: { arkiverede: { type: "string", enum: ["true", "false"] } } } } },
      async (request) => projektRepo.hentAlle(request.query.arkiverede === "true")
    );

    app.get<{ Params: { id: string } }>(
      "/projekter/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const projekt = await projektRepo.hent(request.params.id);
        return projekt ?? reply.code(404).send({ fejl: "Projektet findes ikke" });
      }
    );

    app.post<{ Body: NytProjekt }>(
      "/projekter",
      {
        schema: {
          body: {
            type: "object",
            required: ["navn"],
            additionalProperties: false,
            properties: { ...FELTER, beskrivelse: { ...FELTER.beskrivelse, default: "" } },
          },
        },
      },
      async (request, reply) => {
        const sti = await rensSti(request.body.sti);
        if ("fejl" in sti) return reply.code(400).send({ fejl: sti.fejl });
        const navn = request.body.navn.trim();
        if (!navn) return reply.code(400).send({ fejl: "Projektet skal have et navn" });
        return reply.code(201).send(await projektRepo.opret({ ...request.body, navn, sti: sti.sti }));
      }
    );

    app.patch<{ Params: { id: string }; Body: RedigerProjekt }>(
      "/projekter/:id",
      {
        schema: {
          params: idParamSkema,
          body: { type: "object", additionalProperties: false, minProperties: 1, properties: FELTER },
        },
      },
      async (request, reply) => {
        const felter: RedigerProjekt = { ...request.body };
        if (Object.keys(felter).length === 0) return reply.code(400).send({ fejl: "Intet at ændre" });
        if (felter.navn !== undefined) {
          felter.navn = felter.navn.trim();
          if (!felter.navn) return reply.code(400).send({ fejl: "Projektet skal have et navn" });
        }
        if (felter.sti !== undefined) {
          const sti = await rensSti(felter.sti);
          if ("fejl" in sti) return reply.code(400).send({ fejl: sti.fejl });
          felter.sti = sti.sti;
        }
        const projekt = await projektRepo.opdater(request.params.id, felter);
        if (!projekt) return reply.code(404).send({ fejl: "Projektet findes ikke" });
        // Opgaverne arver stien — så de følger med, når den ændres
        if (felter.sti !== undefined) await opgaveRepo.opdaterStiForProjekt(projekt.id, projekt.sti);
        return projekt;
      }
    );

    // Arkivér: projektet forsvinder fra oversigten, men kan gendannes
    app.post<{ Params: { id: string } }>(
      "/projekter/:id/arkiver",
      { schema: { params: idParamSkema } },
      async (request, reply) =>
        (await projektRepo.arkiver(request.params.id)) ?? reply.code(404).send({ fejl: "Projektet findes ikke" })
    );

    app.post<{ Params: { id: string } }>(
      "/projekter/:id/gendan",
      { schema: { params: idParamSkema } },
      async (request, reply) =>
        (await projektRepo.gendan(request.params.id)) ?? reply.code(404).send({ fejl: "Projektet findes ikke" })
    );

    // Permanent sletning — kun for arkiverede projekter, og kan ikke fortrydes
    app.delete<{ Params: { id: string } }>(
      "/projekter/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        switch (await projektRepo.sletPermanent(request.params.id)) {
          case "slettet":
            return reply.code(204).send();
          case "findes_ikke":
            return reply.code(404).send({ fejl: "Projektet findes ikke" });
          case "ikke_arkiveret":
            return reply.code(409).send({ fejl: "Arkivér projektet først — kun arkiverede projekter kan slettes permanent" });
          case "aabne_implementeringer":
            return reply.code(409).send({
              fejl: "Projektet har implementeringer, der kører eller venter på gennemsyn. Flet eller ryd dem op først, så deres git-grene ikke efterlades.",
            });
        }
      }
    );
  };
}
