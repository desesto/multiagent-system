// Gratis og deterministisk: arkitekten vælger sit eget første forslag
// (eller det allerførste, hvis han ikke har foreslået noget).

import type { IRetningsvaelger, Retningsvalg } from "../../../../../packages/domain/src/contracts/autokoer";

export class RetningsvaelgerMock implements IRetningsvaelger {
  async vaelg(input: Parameters<IRetningsvaelger["vaelg"]>[0]): Promise<Retningsvalg> {
    const muligheder = input.punkt.valgmuligheder;
    const valgt = muligheder.find((m) => m.foreslaaetAf === input.agent.id) ?? muligheder[0];
    if (!valgt) throw new Error("Beslutningspunktet har ingen retninger at vælge imellem");
    return {
      mulighedId: valgt.id,
      begrundelse: `Mock: ${input.agent.navn} valgte "${valgt.beskrivelse}".`,
      forbrug: null,
    };
  }
}
