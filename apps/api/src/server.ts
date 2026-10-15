// Sammenkoblingspunktet — det ENESTE sted, hvor konkrete
// implementeringer vælges og forbindes. Ruterne bor i src/ruter,
// grupperet efter ansvar. Selve HTTP-logikken er tynd overalt:
// validér, kald, returnér.

import "./env"; // SKAL vaere foerste import — indlaeser .env
import Fastify from "fastify";
import cors from "@fastify/cors";
import { db } from "./db/db";
import { OpgaveRepository } from "./repository/OpgaveRepository";
import { BeslutningspunktRepository } from "./repository/BeslutningspunktRepository";
import { AgentSvarRepository } from "./repository/AgentSvarRepository";
import { AgentRepository } from "./repository/AgentRepository";
import { Orchestrator } from "./core/Orchestrator";
import { AgentRunnerMock } from "./core/runnere/AgentRunnerMock";
import { AgentRunnerAnthropic } from "./core/runnere/AgentRunnerAnthropic";
import { FilAdgangFabrikLokal } from "./vaerktoejer/FilAdgangFabrikLokal";
import { ImplementererAgentSdk } from "./core/runnere/ImplementererAgentSdk";
import { ImplementererMock } from "./core/runnere/ImplementererMock";
import { ImplementeringsKoordinator } from "./core/ImplementeringsKoordinator";
import { ImplementeringsGennemsyn } from "./core/ImplementeringsGennemsyn";
import { ImplementeringRepository } from "./repository/ImplementeringRepository";
import { KommentarRepository } from "./repository/KommentarRepository";
import { ForbrugRepository } from "./repository/ForbrugRepository";
import { Budgetvagt, laesDagligtBudget } from "./forbrug/Budgetvagt";
import { forbrugRuter } from "./ruter/forbrugRuter";
import { mappeRuter } from "./ruter/mappeRuter";
import { projektRuter } from "./ruter/projektRuter";
import { ProjektRepository } from "./repository/ProjektRepository";
import { AnalyseKoordinator } from "./core/AnalyseKoordinator";
import { implementeringsRuter } from "./ruter/implementeringsRuter";
import { opgaveStatusRuter } from "./ruter/opgaveStatusRuter";
import {
  StubMemoryStore,
  StubRolleRegistry,
  StubRapportKilde,
  StubSekretaer,
} from "./core/stubs";
import { opgaveRuter } from "./ruter/opgaveRuter";
import { beslutningsRuter } from "./ruter/beslutningsRuter";
import { agentRuter } from "./ruter/agentRuter";
import { skaermbilledRuter } from "./ruter/skaermbilledRuter";
import { SkaermbilledRepository } from "./repository/SkaermbilledRepository";
import { FoerEfterFotograf } from "./skaermbilleder/FoerEfterFotograf";
import { VedhaeftningRepository } from "./repository/VedhaeftningRepository";
import { vedhaeftningRuter } from "./ruter/vedhaeftningRuter";
import { AutokoerRepository } from "./repository/AutokoerRepository";
import { Autokoerer } from "./core/Autokoerer";
import { autokoerRuter } from "./ruter/autokoerRuter";
import { RetningsvaelgerAnthropic } from "./core/runnere/RetningsvaelgerAnthropic";
import { RetningsvaelgerMock } from "./core/runnere/RetningsvaelgerMock";
import { PullRequestGh, PullRequestMock } from "./git/pullRequestGh";

const API_PORT = 3000;

const app = Fastify({ logger: true });
await app.register(cors, {
  origin: "http://localhost:5173",
  // Nyere @fastify/cors tillader kun GET/HEAD/POST som standard —
  // PATCH og DELETE skal naevnes eksplicit, ellers fejler preflight
  methods: ["GET", "POST", "PATCH", "DELETE"],
});

// Repositories
const opgaveRepo = new OpgaveRepository(db);
const projektRepo = new ProjektRepository(db);
const punktRepo = new BeslutningspunktRepository(db);
const svarRepo = new AgentSvarRepository(db);
const agentRepo = new AgentRepository(db);
const implRepo = new ImplementeringRepository(db);
const kommentarRepo = new KommentarRepository(db);
const forbrugRepo = new ForbrugRepository(db);
const billedRepo = new SkaermbilledRepository(db);
const vedhaeftningRepo = new VedhaeftningRepository(db);
const autokoerRepo = new AutokoerRepository(db);
// Billeder, der blev uploadet, men aldrig kom med i en opgave eller kommentar
const loese = await vedhaeftningRepo.ryddLoese(new Date(Date.now() - 24 * 60 * 60 * 1000));
if (loese > 0) console.log(`Vedhæftninger: ${loese} løse billeder ryddet op`);

// Budgetvagt: kun aktiv med rigtige agenter — mock-kørsler er gratis
const dagligtBudgetUsd = laesDagligtBudget(process.env.DAGLIGT_BUDGET_USD);
const budgetvagt = new Budgetvagt(forbrugRepo, dagligtBudgetUsd, Boolean(process.env.ANTHROPIC_API_KEY));
console.log(
  dagligtBudgetUsd === null
    ? "Budgetvagt: slået fra — sæt DAGLIGT_BUDGET_USD i .env"
    : `Budgetvagt: ${dagligtBudgetUsd} USD pr. dag`
);

// Runner-valget: rigtig hjerne hvis der er en API-noegle, ellers mocken
const runner = process.env.ANTHROPIC_API_KEY
  ? new AgentRunnerAnthropic()
  : new AgentRunnerMock();
console.log(
  process.env.ANTHROPIC_API_KEY
    ? "Agent-runner: Anthropic (" +
        (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6") +
        ")"
    : "Agent-runner: MOCK — saet ANTHROPIC_API_KEY i .env for rigtige svar"
);

// Fil-adgang: PROJEKT_ROD begrænser, hvor projekter må ligge (valgfri)
const filAdgangFabrik = new FilAdgangFabrikLokal(process.env.PROJEKT_ROD);
if (!process.env.PROJEKT_ROD) {
  console.warn(
    "PROJEKT_ROD er ikke sat — alle absolutte projektstier accepteres. Sæt den i .env."
  );
}

const memory = new StubMemoryStore();
const orchestrator = new Orchestrator(
  runner,
  memory,
  new StubRolleRegistry(),
  new StubRapportKilde(),
  new StubSekretaer()
);

// Ruter
const analyse = new AnalyseKoordinator({
  orchestrator,
  opgaveRepo,
  punktRepo,
  svarRepo,
  agentRepo,
  implRepo,
  filAdgangFabrik,
  budgetvagt,
  vedhaeftningRepo,
});
// Opgaver fra før projekterne fandtes, får et projekt ud fra deres sti
const tildelte = await projektRepo.tildelGamleOpgaver();
if (tildelte > 0) console.log(`Projekter: ${tildelte} ældre opgaver er placeret i projekter`);
await app.register(projektRuter(projektRepo, opgaveRepo, filAdgangFabrik));
await app.register(opgaveRuter(analyse, opgaveRepo, punktRepo, svarRepo, projektRepo, vedhaeftningRepo));
await app.register(beslutningsRuter(punktRepo, opgaveRepo, svarRepo, kommentarRepo, analyse, vedhaeftningRepo));
await app.register(vedhaeftningRuter(vedhaeftningRepo));
await app.register(agentRuter(agentRepo));

// Før/efter-billeder ved frontend- og fuldstack-opgaver (slås fra med SKAERMBILLEDER=fra)
const fotograf =
  process.env.SKAERMBILLEDER === "fra" ? undefined : new FoerEfterFotograf(implRepo, billedRepo, API_PORT);
console.log(fotograf ? "Før/efter-billeder: til" : "Før/efter-billeder: slået fra (SKAERMBILLEDER=fra)");

// Implementering: Agent SDK med nøgle, ellers mock — som runneren
const koordinator = new ImplementeringsKoordinator({
  implementerer: process.env.ANTHROPIC_API_KEY ? new ImplementererAgentSdk() : new ImplementererMock(),
  memory,
  implRepo,
  punktRepo,
  opgaveRepo,
  svarRepo,
  agentRepo,
  budgetvagt,
  vedhaeftningRepo,
  fotograf,
});
await koordinator.ryddOpEfterGenstart();

// Autokør: arkitekten vælger retning, GitHub CLI pusher og opretter pull requests.
// Uden API-nøgle er alt mock — og intet pushes til GitHub.
const autokoerer = new Autokoerer({
  repo: autokoerRepo,
  opgaveRepo,
  punktRepo,
  svarRepo,
  agentRepo,
  implRepo,
  koordinator,
  vaelger: process.env.ANTHROPIC_API_KEY ? new RetningsvaelgerAnthropic() : new RetningsvaelgerMock(),
  pr: process.env.ANTHROPIC_API_KEY ? new PullRequestGh() : new PullRequestMock(),
  maxPrDag: Number(process.env.AUTOKOER_MAX_PR_DAG ?? 5),
});
await autokoerer.ryddOpEfterGenstart();
await app.register(autokoerRuter(autokoerer, autokoerRepo, opgaveRepo));
await app.register(opgaveStatusRuter(opgaveRepo, implRepo));
await app.register(forbrugRuter(forbrugRepo, dagligtBudgetUsd));
await app.register(mappeRuter(process.env.PROJEKT_ROD));
await app.register(
  implementeringsRuter(koordinator, new ImplementeringsGennemsyn(implRepo), implRepo)
);

await app.register(skaermbilledRuter(billedRepo));

await app.listen({ port: API_PORT, host: "127.0.0.1" }); // kun denne maskine
