// Ruter: vedhæftede billeder. Upload sker som rå bytes (ikke JSON), og
// typen bestemmes ud fra filens indhold — aldrig ud fra filnavnet eller
// hvad browseren påstår. Kun de fire typer, modellen kan se, accepteres.

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { IVedhaeftningRepository } from "../../../../packages/domain/src/contracts/vedhaeftningRepository";
import {
  MAX_VEDHAEFTNING_BYTES,
  MAX_VEDHAEFTNINGER,
  type VedhaeftningType,
} from "../../../../packages/domain/src/domain/vedhaeftning";
import { BILLED_HEADERE } from "../git/billedfiler";
import { idParamSkema, UUID_MOENSTER } from "./faelles";

/** De første bytes i hver billedtype ("magiske tal") */
export function billedTypeAfIndhold(b: Uint8Array): VedhaeftningType | null {
  const start = (...tal: number[]): boolean => tal.every((t, i) => b[i] === t);
  if (start(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (start(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (start(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  const tekst = (fra: number, til: number): string => String.fromCharCode(...b.subarray(fra, til));
  if (tekst(0, 4) === "RIFF" && tekst(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Filnavnet vises kun — men rens det alligevel for stier og styretegn */
function rensNavn(navn: string | undefined): string {
  const kun = (navn ?? "").split(/[\\/]/).pop() ?? "";
  const rent = kun.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 120);
  return rent || "billede";
}

export function vedhaeftningRuter(repo: IVedhaeftningRepository): FastifyPluginAsync {
  return async function (app: FastifyInstance): Promise<void> {
    // Gælder kun i denne plugin: billeder modtages som rå bytes
    app.addContentTypeParser(
      /^image\//,
      { parseAs: "buffer", bodyLimit: MAX_VEDHAEFTNING_BYTES },
      (_request, krop, done) => done(null, krop)
    );

    app.post<{ Querystring: { navn?: string }; Body: Buffer }>(
      "/vedhaeftninger",
      {
        bodyLimit: MAX_VEDHAEFTNING_BYTES,
        schema: {
          querystring: {
            type: "object",
            properties: { navn: { type: "string", maxLength: 300 } },
          },
        },
      },
      async (request, reply) => {
        const data = request.body;
        if (!Buffer.isBuffer(data) || data.length === 0) {
          return reply.code(415).send({ fejl: "Send billedet som rå bytes med Content-Type image/…" });
        }
        const type = billedTypeAfIndhold(data);
        if (!type) return reply.code(415).send({ fejl: "Kun PNG, JPG, GIF og WebP kan vedhæftes" });
        return reply.code(201).send(await repo.gem({ navn: rensNavn(request.query.navn), type, data }));
      }
    );

    app.get<{ Params: { id: string } }>(
      "/vedhaeftninger/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        const fil = await repo.hentData(request.params.id);
        if (!fil) return reply.code(404).send({ fejl: "Billedet findes ikke" });
        return reply.headers(BILLED_HEADERE).type(fil.type).send(Buffer.from(fil.data));
      }
    );

    app.delete<{ Params: { id: string } }>(
      "/vedhaeftninger/:id",
      { schema: { params: idParamSkema } },
      async (request, reply) => {
        if (!(await repo.slet(request.params.id))) return reply.code(404).send({ fejl: "Billedet findes ikke" });
        return reply.code(204).send();
      }
    );

    app.get<{ Params: { id: string } }>(
      "/opgaver/:id/vedhaeftninger",
      { schema: { params: idParamSkema } },
      async (request) => repo.hentForOpgave(request.params.id)
    );
  };
}

/** Til body-skemaer: en liste af billed-id'er, der skal kobles på */
export const VEDHAEFTNING_IDER_SKEMA = {
  type: "array",
  maxItems: MAX_VEDHAEFTNINGER,
  uniqueItems: true,
  items: { type: "string", pattern: UUID_MOENSTER },
} as const;
