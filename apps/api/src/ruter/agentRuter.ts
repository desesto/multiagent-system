// Ruter: agenter (foreløbig kun navneopslag til UI'et).

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { IAgentRepository } from "../../../../packages/domain/src/contracts/agentRepository";

export function agentRuter(agentRepo: IAgentRepository): FastifyPluginAsync {
  return async function (app: FastifyInstance) {
    app.get("/agenter", async () => {
      const alle = await agentRepo.hentAlle();
      return alle.map((a) => ({ id: a.id, navn: a.navn }));
    });
  };
}
