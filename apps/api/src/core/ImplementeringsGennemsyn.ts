// Gennemsyn af en implementering: én fils ændringer, klar til en
// visning som på GitHub. Kun filer i NETOP denne commit kan vises —
// endpointet kan ikke bruges til at læse vilkårlige filer fra repoet.

import type { FilDiff, FilVersion } from "../../../../packages/domain/src/domain/diff";
import type { AendretFil, Implementering } from "../../../../packages/domain/src/domain/implementering";
import type { IImplementeringRepository } from "../../../../packages/domain/src/contracts/implementeringRepository";
import { parseUnifiedDiff } from "../git/diffParser";
import { filIndhold, unifiedDiff } from "../git/gitDiff";
import { repoRodFor } from "../git/worktreeStier";
import { billedType, erTekstbillede, MAX_BILLED_BYTES } from "../git/billedfiler";
import { KoordinatorFejl } from "./KoordinatorFejl";

const MAX_BYTES = 300_000;

export class ImplementeringsGennemsyn {
  constructor(private readonly implRepo: IImplementeringRepository) {}

  async filDiff(id: string, sti: string): Promise<FilDiff> {
    const { impl, fil, hash } = await this.filICommit(id, sti);
    const repoRod = repoRodFor(impl);
    const billede = billedType(sti)
      ? { foer: fil.type !== "oprettet", efter: fil.type !== "slettet" }
      : null;
    const tom = { sti, type: fil.type, linjer: null, raekker: null, binaer: false, forStor: false, billede };
    // Almindelige billeder vises kun som billeder; SVG er også tekst og får begge dele
    if (billede && !erTekstbillede(sti)) return tom;

    if (fil.type === "aendret") {
      const diff = await unifiedDiff(repoRod, hash, sti).catch(() => null);
      if (diff === null) throw forsvundet();
      if (/^Binary files /m.test(diff)) return { ...tom, binaer: true };
      if (diff.length > MAX_BYTES) return { ...tom, forStor: true };
      return { ...tom, raekker: parseUnifiedDiff(diff) };
    }

    // Oprettet: vis den nye version. Slettet: vis den gamle.
    const indhold = await filIndhold(repoRod, fil.type === "oprettet" ? hash : `${hash}~1`, sti);
    if (indhold === null) throw forsvundet();
    if (indhold.subarray(0, 8000).includes(0)) return { ...tom, binaer: true };
    if (indhold.length > MAX_BYTES) return { ...tom, forStor: true };
    return { ...tom, linjer: tilLinjer(indhold) };
  }

  /** Én version af en billedfil fra implementeringens commit — som rå bytes */
  async billedfil(id: string, sti: string, version: FilVersion): Promise<{ bytes: Buffer; type: string }> {
    const { impl, fil, hash } = await this.filICommit(id, sti);
    const type = billedType(sti);
    if (!type) throw new KoordinatorFejl(400, "Filen er ikke et billede");
    if ((version === "foer" && fil.type === "oprettet") || (version === "efter" && fil.type === "slettet")) {
      throw new KoordinatorFejl(404, version === "foer" ? "Filen fandtes ikke før" : "Filen er slettet");
    }
    const bytes = await filIndhold(repoRodFor(impl), version === "efter" ? hash : `${hash}~1`, sti);
    if (bytes === null) throw forsvundet();
    if (bytes.length > MAX_BILLED_BYTES) throw new KoordinatorFejl(413, "Billedet er for stort til at blive vist her");
    return { bytes, type };
  }

  /** Kun filer i NETOP denne commit kan vises */
  private async filICommit(
    id: string,
    sti: string
  ): Promise<{ impl: Implementering; fil: AendretFil; hash: string }> {
    const impl = await this.implRepo.hent(id);
    if (!impl) throw new KoordinatorFejl(404, "Implementeringen findes ikke");
    if (!impl.commitHash) throw new KoordinatorFejl(409, "Implementeringen har ingen commit endnu");
    const fil = impl.aendredeFiler.find((f) => f.sti === sti);
    if (!fil) throw new KoordinatorFejl(404, "Filen er ikke en del af implementeringen");
    return { impl, fil, hash: impl.commitHash };
  }
}

function tilLinjer(indhold: Buffer): string[] {
  const linjer = indhold.toString("utf8").replace(/\r\n/g, "\n").split("\n");
  if (linjer.at(-1) === "") linjer.pop(); // filen slutter med linjeskift
  return linjer;
}

function forsvundet(): KoordinatorFejl {
  return new KoordinatorFejl(
    410,
    "Commit'en findes ikke længere — grenen blev ryddet op uden at være flettet ind"
  );
}
