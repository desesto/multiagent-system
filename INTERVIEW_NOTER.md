# Interviewnoter — mit multiagent-projekt

Formatet pr. emne: *Hvad er det* → *Hvordan bruger JEG det* → **Sig-sætning** (én sætning du kan sige ordret).

---

## LLM (Large Language Model)
**Hvad:** En AI-model trænet på enorme tekstmængder til at forudsige tekst — den kan ræsonnere, analysere og skrive ud fra en prompt. Den er *stateless*: den husker intet mellem kald; alt den skal "vide", skal med i hver forespørgsel.
**Min brug:** Hver AI-agent er et LLM-kald til Anthropics API. Jeg bygger prompten pr. kald af agentens rolle, personlighed, fokuspunkter og opgaven — og kræver struktureret JSON tilbage (spørgsmål, ræsonnement, resumé, valgmuligheder), som jeg parser og validerer.
**Sig:** "LLM'er er stateless, så al agentens identitet og hukommelse er data i min database, som jeg injicerer i hvert kald — modellen er bare motoren."

## Prompt / systemprompt
**Hvad:** Instruktionen til modellen. Systemprompten sætter rollen og reglerne; brugerbeskeden er selve opgaven.
**Min brug:** Systemprompten samles dynamisk: "Du er Kodey... din personlighed... dine fokuspunkter... svar KUN med JSON i dette format". Formatkravet gør svaret maskinlæsbart.
**Sig:** "Jeg behandler prompten som kode: den bygges af strukturerede felter fra databasen, ikke som løs tekst."

## Fastify
**Hvad:** Et hurtigt Node.js web-framework (alternativ til Express) med indbygget JSON Schema-validering og logging.
**Min brug:** Mit REST-API. Ruterne er grupperet efter ansvar (opgaver, beslutninger, agenter) som Fastify-plugins, der får deres afhængigheder injiceret. Hvert endpoint validerer input med JSON Schema, FØR noget rammer databasen — ugyldig opgavetype afvises med 400 automatisk.
**Sig:** "Mit HTTP-lag er bevidst tyndt: validér, kald repository eller orchestrator, returnér JSON — ingen forretningslogik og ingen SQL i ruterne."

## REST API / endpoints
**Hvad:** HTTP-grænseflade hvor URL + metode udtrykker handlingen: GET henter, POST opretter, PATCH retter, DELETE fjerner.
**Min brug:** Fx `POST /opgaver` (opret + kør agenter), `POST /beslutningspunkter/:id/valg`, `POST /.../fortryd`, `DELETE /opgaver/:id` (soft delete). Statuskoder med mening: 201 oprettet, 400 ugyldigt input, 404 findes ikke, 409 konflikt (fx at vælge på et allerede besluttet punkt).

## TypeScript & kontrakter (interfaces)
**Hvad:** JavaScript med typer. Interfaces beskriver datas form og klassers forpligtelser uden implementering.
**Min brug:** Mit vigtigste arkitekturgreb. Interfaces til data (Opgave, Rolle), klasser kun hvor der er opførsel (Orchestrator). Kontrakter som `IAgentRunner` og `IMemoryStore` gør implementeringer udskiftelige: min mock-agent og den rigtige Anthropic-agent opfylder samme kontrakt, så skiftet er én linje.
**Sig:** "Jeg afhænger af kontrakter, aldrig af implementeringer — det gjorde det muligt at bygge og teste hele beslutningsflowet gratis med en mock, før jeg satte en API-nøgle i."

## Monorepo / npm workspaces
**Hvad:** Ét repository med flere pakker/apps, der kan dele kode.
**Min brug:** `apps/api` (Fastify), `apps/web` (React) og `packages/domain` (delte typer + kontrakter). Frontend og backend importerer BOGSTAVELIGT de samme typer — driver de fra hinanden, brækker compilen.
**Sig:** "Min opgavetype er defineret ét sted og håndhæves tre steder: i TypeScript, i Fastifys validering og som enum i Postgres."

## PostgreSQL & Docker
**Hvad:** Relationel database; Docker kører den i en isoleret container med reproducerbar opsætning.
**Min brug:** `docker compose up -d` starter databasen; data overlever i en named volume. Seks tabeller: brugere, roller, agenter, opgaver, beslutningspunkter, agentsvar.
**Sig:** "Docker betyder, at hele min database-opsætning er én fil i git — enhver maskine kan køre projektet med to kommandoer."

## Drizzle ORM & migrationer
**Hvad:** TypeScript-ORM hvor skemaet defineres i kode; drizzle-kit diff'er skemaet og genererer SQL-migrationer.
**Min brug:** `schema.ts` er den ene sandhedskilde. Ændring = redigér skemaet → `generate` → `migrate`. Migrationerne er nummererede, ligger i git og redigeres aldrig bagudrettet. Rækketyper udledes af skemaet (`$inferSelect`), så repository-laget compiler-fejler, hvis skema og domæne er i utakt.

## Repository-mønstret
**Hvad:** Et lag der oversætter mellem database-rækker og domæneobjekter — al SQL bor dér.
**Min brug:** `OpgaveRepository`, `BeslutningspunktRepository` osv. implementerer kontrakter fra domænepakken. Ingen forretningslogik — kun oversættelse. Særlige regler håndhæves i SQL'en: `registrerValg` opdaterer KUN hvis punktet stadig er åbent (WHERE ... IS NULL), så beslutninger aldrig kan overskrives ved et uheld.

## Soft delete & append-only historik
**Hvad:** Sletning som tidsstempel i stedet for fjernelse; historik der aldrig overskrives.
**Min brug:** Slettede opgaver filtreres bare væk. Fortrudte beslutninger nulstilles ikke — det gamle valg flyttes til en `tidligereValg`-log med tidsstempler.
**Sig:** "Revisionssporet er helligt: man kan skifte mening, men aldrig omskrive historien."

## React
**Hvad:** UI-bibliotek: komponenter er funktioner af props og state; ændres state, gentegnes UI'et.
**Min brug:** Container/komponent-mønstret fra min praktik: siderne ejer data og handlere, komponenterne viser (OpgaveKort er 50 linjer uden egen state). Genbrug: én Knap med varianter, én formular til både opret og redigér, én Popup til alle bekræftelser.

## Vite (og hvorfor ikke Next.js)
**Hvad:** Byggeværktøj/dev-server til SPA'er — lynhurtig hot reload.
**Hvorfor ikke Next:** Next's værdi er SSR/SEO — irrelevant for et internt værktøj med egen backend. Next's API-routes ville konkurrere med min Fastify-server om samme job.
**Sig:** "Jeg valgte det simple, der matcher behovet, og holdt døren åben — intet i min kode er Vite-specifikt, så en migrering ville primært være routing."

## Tailwind CSS (v4)
**Hvad:** Utility-first CSS — styling som små klasser direkte i markup i stedet for separate CSS-filer.
**Min brug:** Mit design bor som tokens i én `@theme`-blok (bg-flade, text-daempet, farve pr. opgavetype). Vigtig detalje: Tailwind læser koden statisk, så dynamiske klassenavne virker ikke — farve-pr.-type er et eksplicit opslag.
**Sig:** "Jeg migrerede fra håndskrevet CSS til Tailwind på en gren, komponent for komponent, med uændret udseende som succeskriterium."

## React Router
**Hvad:** Klientside-routing: URL'er mappes til komponenter uden sideindlæsning.
**Min brug:** `/` (liste + opret) og `/opgaver/:id` (detalje med hele beslutningshistorikken). Rigtige URL'er = tilbage-knap, F5 og bogmærker virker.

## CORS (og min bedste fejlhistorie)
**Hvad:** Browserens regel om, at ét "sted" (port 5173) ikke må kalde et andet (port 3000) uden eksplicit tilladelse. Ved PATCH/DELETE sender browseren først en preflight-forespørgsel.
**Historien:** Min redigér-knap gav "Failed to fetch" uden noget i serverloggen. Årsag: @fastify/cors tillader kun GET/HEAD/POST som standard — preflighten for PATCH blev afvist, FØR requesten blev sendt. Mine curl-tests fangede det aldrig, for kun browsere laver preflight.
**Sig:** "Den lærte mig, at test udenom browseren har blinde vinkler — nu klikker jeg alt igennem i browseren efter hver ændring."

## Git-arbejdsgang
**Min brug:** Feature-grene (Tailwind-migreringen kørte på sin egen gren), commits pr. færdig skive, `.gitignore` FØR første commit så API-nøglen aldrig rammer GitHub. `.env` til hemmeligheder, aldrig i koden.

## Arkitekturprincipper jeg kan tale længe om
- **Tynd skive først:** ét smalt spor gennem alle lag (opret → gem → vis), derefter udvidelser af noget, der virker.
- **Byg det mest usikre først:** mock-agent beviste flowet, før tokens kostede penge.
- **Resumé-hierarkiet:** LLM'ers svaghed er store kontekster, så orchestratoren ser kun destillater — fuld data i databasen, som JEG altid kan slå op.
- **Maks 250 linjer pr. fil:** linjetallet er røgalarmen, ikke branden — split efter ANSVAR, aldrig mekanisk.
- **Modulær monolit:** microservice-grænser som kontrakter i én proces; udskillelse senere er en flytning, ikke en omskrivning.

## Hvis de spørger "hvad er næste skridt?"
Budgetvagt (loft over agentkald pr. opgave — systemet må aldrig træffe en dyr beslutning, kun mig), jobkø til de langsomme LLM-kald (pg-boss), og hukommelsessystemet: agenter der lærer af retrospektiver via komprimerede "wisdom-dokumenter".

## Gode spørgsmål JEG kan stille dem
- "Hvordan arbejder I med AI-værktøjer i udviklingen i dag?"
- "Hvordan håndterer I delte typer mellem frontend og backend?"
- "Hvordan ser jeres code review-proces ud for juniorer?"

---

# Nofipa-specifikt

## Åbningspitchen justeret til dem
"Jeg bygger et multiagent-AI-system i fuldstack TypeScript — Node.js-backend med Fastify og Postgres i Docker, React-frontend. Det er reelt et internt værktøj: dashboards, beslutningsflows og revisionsspor. Og jeg har bygget det i tæt dagligt samarbejde med Claude, så jeg står på begge sider af jeres AI-ambition: jeg bruger AI som udviklingsværktøj hver dag, og jeg bygger orkestrering oven på AI."

## Deres krav → mit bevis
- **Node.js** → Fastify-API med ansvarsopdelte ruter, JSON Schema-validering, dependency injection via kontrakter.
- **API-design** → REST med meningsfulde statuskoder (201/400/404/409); validering FØR databasen.
- **Event-drevet** (halvsvag — vær ærlig): "Ikke bygget i produktion endnu, men mine datamodeller er append-only (beslutninger overskrives aldrig, fortrydelser logges som hændelser), og min backlog har en jobkø på pg-boss — så tænkningen er der, erfaringen kommer."
- **React** → container/komponent-mønster, genbrugskomponenter, react-router.
- **Next.js** (fravalg, ikke hul): "Jeg valgte bevidst Vite til et internt værktøj uden SEO-behov med egen backend — jeg kender trade-offen, og React-delen er identisk."
- **Postgres** → Drizzle-ejet skema, nummererede migrationer. Nævn: Supabase ER hosted Postgres, så erfaringen oversætter direkte.
- **Docker** → hele databasen som docker-compose i git.
- **GraphQL/Shopify/Python** (ærlige huller): "Ikke endnu — mit projekt fra tom mappe til kørende system er min dokumentation for læringshastighed."

## AI-mindset-svaret (deres vigtigste afsnit)
Min arbejdsform med Claude: tynde skiver, AI'en udkaster, JEG træffer arkitekturbeslutningerne, og intet merges uden verifikation (tsc, builds, klik-test — CORS-historien som bevis for hvorfor). Videndeling: jeg dokumenterer principper løbende (cheat sheet, backlog, interviewnoter — alt sammen skrevet UNDER udviklingen).
**Punchline:** "Mit eget produkt er bygget på samme princip som min arbejdsform: AI foreslår, mennesket beslutter."

## Spørgsmål til NETOP dem
- "Hvordan ser jeres event-drevne arkitektur ud i dag — kø, bus, webhooks?"
- "Hvor i udviklingsflowet bruger I AI mest i dag, og hvor vil I gerne hen?"
- "Buy-back og pantsætning må kræve stærke revisionsspor — hvordan håndterer I audit i systemerne?" (kobler direkte til min append-only historik)

