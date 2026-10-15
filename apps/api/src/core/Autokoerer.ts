// Autokør: tager opgaverne i køen én ad gangen hele vejen til en pull
// request — vælg retning → implementér → push → pull request.
//
// Grundprincippet flytter, men forsvinder ikke: systemet vælger retning,
// og DIN beslutning ligger i pull requesten. Intet flettes uden dig.
//
// Hårde lofter, fordi ingen trykker på knappen:
//  - højst ét job ad gangen, og højst AUTOKOER_MAX_PR_DAG pr. dag
//  - hver implementering har sit eget loft, og budgetvagten gælder
//  - køen STOPPER ved første fejl — og efter en genstart, til du starter den igen

import type { Implementering } from "../../../../packages/domain/src/domain/implementering";
import type { AutokoerPost, AutokoerTilstand } from "../../../../packages/domain/src/domain/autokoer";
import { grennavnTilPr } from "../../../../packages/domain/src/domain/autokoer";
import type {
  IAutokoerRepository,
  IPullRequestOpretter,
  IRetningsvaelger,
} from "../../../../packages/domain/src/contracts/autokoer";
import type { IOpgaveRepository } from "../../../../packages/domain/src/contracts/opgaveRepository";
import type { IBeslutningspunktRepository } from "../../../../packages/domain/src/contracts/beslutningspunktRepository";
import type { IAgentSvarRepository } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import type { IAgentRepository } from "../../../../packages/domain/src/contracts/agentRepository";
import type { IImplementeringRepository } from "../../../../packages/domain/src/contracts/implementeringRepository";
import type { ImplementeringsKoordinator } from "./ImplementeringsKoordinator";
import { kommentarKaede } from "./kommentarKaede";
import { KoordinatorFejl } from "./KoordinatorFejl";
import { repoRodFor } from "../git/worktreeStier";
import { bygPrKrop } from "./prTekst";

const VALGENDE_ROLLE = "Arkitekt";
const VENT_INTERVAL_MS = 2000;
const MAX_VENT_MS = 45 * 60 * 1000;

export interface AutokoerAfhaengigheder {
  repo: IAutokoerRepository;
  opgaveRepo: IOpgaveRepository;
  punktRepo: IBeslutningspunktRepository;
  svarRepo: IAgentSvarRepository;
  agentRepo: IAgentRepository;
  implRepo: IImplementeringRepository;
  koordinator: ImplementeringsKoordinator;
  vaelger: IRetningsvaelger;
  pr: IPullRequestOpretter;
  maxPrDag: number;
}

export class Autokoerer {
  private koerer = false;
  private stopper = false;
  private aktivPostId: string | null = null;
  private stopGrund: string | null = null;

  constructor(private readonly a: AutokoerAfhaengigheder) {}

  async tilstand(): Promise<AutokoerTilstand> {
    return {
      koerer: this.koerer,
      stopper: this.stopper,
      aktivPostId: this.aktivPostId,
      stopGrund: this.stopGrund,
      idag: await this.a.repo.antalStartetSiden(midnat()),
      maxPrDag: this.a.maxPrDag,
    };
  }

  /** Starter køen. Svarer straks — arbejdet sker i baggrunden. */
  async start(): Promise<AutokoerTilstand> {
    if (!this.koerer) {
      await this.a.pr.tjekKlar().catch((e: Error) => {
        throw new KoordinatorFejl(400, e.message);
      });
      if (!(await this.a.repo.naeste())) throw new KoordinatorFejl(400, "Køen er tom — tilføj opgaver først");
      if ((await this.a.repo.antalStartetSiden(midnat())) >= this.a.maxPrDag) {
        throw new KoordinatorFejl(409, `Dagens loft på ${this.a.maxPrDag} autokørsler er nået — fortsæt i morgen`);
      }
      this.koerer = true;
      this.stopper = false;
      this.stopGrund = null;
      void this.loop();
    }
    return this.tilstand();
  }

  /** Stopper køen, når den aktuelle opgave er færdig — en kørsel afbrydes aldrig midtvejs */
  async stop(): Promise<AutokoerTilstand> {
    if (this.koerer) this.stopper = true;
    return this.tilstand();
  }

  async ryddOpEfterGenstart(): Promise<void> {
    const antal = await this.a.repo.markerAfbrudte();
    if (antal > 0) console.warn(`[autokør] ${antal} kørsel(er) afbrudt af genstart — køen er stoppet`);
  }

  private async loop(): Promise<void> {
    while (this.koerer) {
      if (this.stopper) return this.stands("Stoppet af dig");
      const post = await this.a.repo.naeste();
      if (!post) return this.stands("Køen er tom — alle opgaver er kørt");
      if ((await this.a.repo.antalStartetSiden(midnat())) >= this.a.maxPrDag) {
        return this.stands(`Dagens loft på ${this.a.maxPrDag} autokørsler er nået — fortsæt i morgen`);
      }
      this.aktivPostId = post.id;
      try {
        await this.koerPost(post);
      } catch (fejl) {
        const besked = fejl instanceof Error ? fejl.message : String(fejl);
        console.error(`[autokør] "${post.opgaveTitel}" fejlede`, fejl);
        await this.a.repo.opdater(post.id, { status: "fejlet", besked, afsluttetTidspunkt: nu() });
        return this.stands(`Stoppet efter en fejl i "${post.opgaveTitel}": ${besked}`);
      } finally {
        this.aktivPostId = null;
      }
    }
  }

  private stands(grund: string): void {
    this.koerer = false;
    this.stopper = false;
    this.stopGrund = grund;
    console.log(`[autokør] ${grund}`);
  }

  private async koerPost(post: AutokoerPost): Promise<void> {
    await this.a.repo.opdater(post.id, { status: "koerer", startetTidspunkt: nu(), besked: null });
    const opgave = await this.a.opgaveRepo.hent(post.opgaveId);
    if (!opgave) throw new Error("Opgaven findes ikke længere");
    if (opgave.status === "afsluttet") throw new Error("Opgaven er afsluttet");

    // 1. Retningen: dit eget valg vinder; ellers vælger arkitekten
    const punkter = await this.a.punktRepo.hentForOpgave(opgave.id);
    let punkt = punkter.find((p) => !p.erstattetAf);
    if (!punkt) throw new Error("Opgaven har ingen forslag at vælge imellem");
    let valgtAfNavn = "dig";
    let begrundelse: string | null = null;
    if (punkt.valgtMulighedId) {
      await this.a.repo.opdater(post.id, { valgtAf: "bruger" });
    } else {
      const [arkitekt] = await this.a.agentRepo.hentMedRolle(VALGENDE_ROLLE);
      if (!arkitekt) throw new Error(`Ingen agent har rollen ${VALGENDE_ROLLE} — kør seed`);
      const svar = await this.a.svarRepo.hentForBeslutningspunkt(punkt.id);
      const navne = new Map((await this.a.agentRepo.hentAlle()).map((ag) => [ag.id, ag.navn]));
      const valg = await this.a.vaelger.vaelg({
        agent: arkitekt,
        opgave,
        punkt,
        resumeer: svar.map((s) => ({ agentNavn: navne.get(s.agentId) ?? "En agent", resume: s.resume })),
        kommentarer: kommentarKaede(punkter, punkt.id).map((k) => k.tekst),
      });
      await this.a.repo.opdater(post.id, {
        valgtAf: "arkitekt",
        valgtAfAgentId: arkitekt.id,
        begrundelse: valg.begrundelse,
        forbrug: valg.forbrug,
      });
      const registreret = await this.a.punktRepo.registrerValg(punkt.id, valg.mulighedId);
      if (!registreret) throw new Error("Retningen kunne ikke registreres — er den valgt i mellemtiden?");
      punkt = registreret;
      await this.a.opgaveRepo.opdaterStatus(opgave.id, "i_gang");
      valgtAfNavn = arkitekt.navn;
      begrundelse = valg.begrundelse;
    }

    // 2. Implementeringen — en færdig implementering uden pull request genbruges
    const eksisterende = (await this.a.implRepo.hentForOpgave(opgave.id)).find(
      (i) => i.beslutningspunktId === punkt.id && i.status === "klar" && i.commitHash && !i.prUrl
    );
    const impl = eksisterende ?? (await this.ventPaa((await this.a.koordinator.start(punkt.id)).id));
    await this.a.repo.opdater(post.id, { implementeringId: impl.id });
    if (impl.status !== "klar" || !impl.commitHash) {
      throw new Error(impl.fejl ?? `Implementeringen endte som "${impl.status}"`);
    }

    // 3. Push og pull request — kladde, hvis arbejdet kan være ufærdigt
    const valgt = punkt.valgmuligheder.find((m) => m.id === punkt.valgtMulighedId);
    const kladde = Boolean(impl.fejl);
    const url = await this.a.pr.opret({
      repoRod: repoRodFor(impl),
      worktreeSti: impl.worktreeSti,
      lokalGren: impl.gren,
      fjernGren: grennavnTilPr(impl.gren, opgave.titel),
      titel: opgave.titel,
      krop: bygPrKrop({ opgave, impl, retning: valgt?.beskrivelse ?? "", valgtAfNavn, begrundelse }),
      kladde,
    });
    if (url) await this.a.implRepo.opdater(impl.id, { prUrl: url });
    await this.a.repo.opdater(post.id, {
      status: "faerdig",
      prUrl: url,
      besked: !url
        ? "Mock: intet er pushet til GitHub (kører uden API-nøgle)"
        : kladde
          ? `Oprettet som kladde — ${impl.fejl}`
          : null,
      afsluttetTidspunkt: nu(),
    });
  }

  /** Implementeringer kører i baggrunden — vent, til den (og evt. før/efter-billederne) er færdig */
  private async ventPaa(implId: string): Promise<Implementering> {
    const frist = Date.now() + MAX_VENT_MS;
    while (Date.now() < frist) {
      const impl = await this.a.implRepo.hent(implId);
      if (!impl) throw new Error("Implementeringen forsvandt");
      if (impl.status !== "koerer" && impl.billedStatus !== "tages") return impl;
      await new Promise((r) => setTimeout(r, VENT_INTERVAL_MS));
    }
    throw new Error(`Implementeringen blev ikke færdig inden for ${MAX_VENT_MS / 60000} minutter`);
  }
}

function nu(): string {
  return new Date().toISOString();
}

function midnat(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
