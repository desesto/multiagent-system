# Backlog — bevidst udskudte beslutninger

Rækkefølgen er afhængighedsstyret: hvert punkt forudsætter typisk punkterne over sig.
Princip: byg det mest usikre først, i tynde skiver gennem alle lag.

## ✅ Færdigt
- Beslutningsflow: agenter fremlægger retninger, brugeren vælger, fortryder (historik bevares)
- Rigtige agenter (Anthropic) med mock-tilstand, prompt caching og robust svarparsing
- Fil-LÆSNING for agenter med sikkerhedsrammer, loft og revisionsspor
- IMPLEMENTERING via Claude Agent SDK på egne git-grene; typetjek; brugeren fletter selv
- Filgennemsyn som på GitHub (faner, side-om-side-diff i popup, IntelliJ-farver)
- Opgavestatus: afslut og genåbn; afsluttede opgaver kan foldes ud på listen (Kodey)
- Kommentarer til beslutningspunkter og ny vurdering
- Dataindsamling: tokenforbrug gemmes pr. agentsvar og pr. implementering
- Selvbyggende system, første form: systemet kan analysere og implementere på sin egen kode
- Forbrugsside (pr. dag, opgave og agent; cache-andel), pris pr. opgave og budgetvagt (DAGLIGT_BUDGET_USD)
- "Gennemse filer": mappevælger til projektstien
- Projekter: hierarkiet Projekter → opgaver → opgavedetalje; opgaver arver projektets sti
- Arkivering af projekter (gendan) og permanent sletning som bevidst ekstra skridt
- Område på opgaver (frontend/backend/fuldstack/andet) og design-skitser pr. løsningsforslag (punkt 1a)
- Før/efter-billeder af implementeringer ved frontend- og fuldstack-opgaver (punkt 1b)
- Billedfiler (teksturer, ikoner) vises som billeder før/efter i filgennemsynet — virker for alle projekter
- Billeder i opgavebeskrivelser og kommentarer (+, Ctrl+V, træk-og-slip); agenterne ser dem
- Temaer (Normal, Platin) under Indstillinger; fast topbjælke
- Autokør: kø af opgaver → arkitekten vælger → implementering → pull request (punkt 3)
- Arkitekten (Astrid): genbrug, genbrugelige komponenter, løst koblede moduler, korte filer

---

# NÆSTE — prioriteret rækkefølge (13. oktober)

## 1. Visuelle ændringer: se designet, ikke kun koden
Ved frontend-opgaver skal du kunne SE ændringen — både ved løsningsforslagene og ved implementeringen.
Bygges i to skridt, billigste først:

**1a. Design pr. løsningsforslag ✅**
- Opgaver har nu et område. Ved frontend og fuldstack tegner agenterne en HTML-skitse pr. forslag,
  vist som miniature og i fuld størrelse i en sandkasse (ingen scripts, intet netværk).
- Den valgte skitse sendes med til implementeringen som visuel retning.
- Senere: agenterne kan foreslå området ud fra de filer, de læser.

**1b. Før/efter-billeder af implementeringen ✅**
- Vite i agentens worktree på en ledig port + playwright-core med din Edge/Chrome. Før = grenens
  udgangspunkt, efter = agentens commit. Siderne må kun læse fra systemets eget API.
- Senere: sider med parametre (fx `/opgaver/:id`) — agenten kunne vælge et rigtigt id fra databasen.
- Senere: mobilbredde ved siden af desktop; markering af de områder, der har ændret sig (pixel-diff).
- Senere ved fuldstack: efter-billederne bruger dit NUVÆRENDE API, ikke agentens ændrede backend.

**1d. Billedforslag: ændringer af billedfiler (fx teksturer)**
Agenterne kan ikke skrive binære filer (en PNG ville blive ødelagt) og kan ikke tegne. I stedet:
- Nyt område "billede". Agenterne ser billedet (vedhæftet eller fra projektet) og beskriver hver
  ændring som en OPERATION: farvetone ±°, erstat farve A→B, lysere/mørkere, tone mod en farve — eller
  et helt nyt pixelgitter for små teksturer (16×16, 32×32).
- Systemet udfører operationen på den rigtige fil og viser før/efter på hvert forslagskort.
- Valgt forslag → systemet laver præcis samme ændring og committer den på agentens gren (ingen ny fortolkning).
- PNG først (ren JavaScript, fx pngjs); JPG/WebP kræver en billedpakke (sharp).

**1c. Før/efter-billeder for andre projekter end systemet selv**
I dag må siderne kun læse fra systemets eget API (port 3000). Et andet projekts frontend får derfor
sine kald afvist og viser tomme sider. To indstillinger pr. projekt:
- **API-adresse** (fx `http://localhost:8080`): siderne må LÆSE fra projektets egen backend. Kræver, at
  den kører, mens billederne tages.
- **Testdata**: en mappe i projektet med faste svar (`GET /api/produkter → produkter.json`). Ingen backend
  nødvendig, ens billeder hver gang, ingen rigtige data. Kodey kan skrive testdataene som en opgave.
- Evt. "optag og afspil": svarene fra før-billederne afspilles under efter-billederne, så begge får
  præcis samme data.
- Andre værktøjer end Vite (Next.js, Angular …) og sider bag login: vent til der er et konkret projekt.
- Spil (fx Minecraft-mods): billeder fra selve spillet kræver, at agenten kan bygge og starte spillet
  (Java/Gradle, Fabrics testværktøjer) — stort; teksturer dækkes allerede af filgennemsynet.

## 3. Autonom tilstand (autokør) ✅
Bygget: en kø af opgaver pr. projekt, som tages én ad gangen hele vejen til en pull request.
Arkitekten vælger retning, når du ikke har; GitHub CLI pusher og opretter pull requesten; højst
5 pr. dag; stop ved første fejl og efter genstart. Se CHEATSHEET.
- Senere: notifikation, når en PR er klar (fx mail eller en lyd i browseren).
- Senere: arkitekten stopper og spørger, hvis agenterne er dybt uenige (i stedet for altid at vælge).
- Senere: rigtig jobkø (pg-boss), hvis der skal køre flere ting parallelt — i dag er køen én
  arbejder i API-processen med tilstanden i databasen.

## 4. Gendan: sikkerhedskopier af systemet
Anbefales bygget sammen med eller lige efter autokør, da autokør pusher uden din hånd på knappen.
Så et uheld — fx et push, der nedlægger systemet — altid kan rulles tilbage. Kode og database er
to forskellige ting og skal sikres hver for sig.
- **Koden:** systemet sætter et gendannelsespunkt (git-tag, fx `gendan/2026-10-13-1043`), før det selv
  fletter eller pusher (autokør, punkt 3). Siden "Gendan" viser punkterne med dato og hvad der kom efter.
  Gendannelse = en NY gren fra punktet, som du selv fletter — aldrig force-push eller omskrevet historik.
  Tags pushes til GitHub, så de overlever en ødelagt maskine.
- **Databasen:** `pg_dump` før hver migration og dagligt, gemt uden for Docker-volumen; behold fx de
  seneste 14. Gendannelse via et script/knap, der først tager en kopi af den nuværende tilstand.
- **Selvbeskyttelse:** hvis systemet er så ødelagt, at siden ikke starter, skal gendannelsen kunne køres
  fra terminalen uden systemet selv (et lille script + vejledning i CHEATSHEET).
- Uafhængigt af systemet allerede i dag: `git revert <commit>` fortryder et push sikkert.

## 5. Sikkerhed: beskyttelse af system og data mod uvedkommende
Systemet kan læse din kode, skrive til dine repoer og bruge din API-nøgle — så det skal kun kunne
bruges af dig. I dag lytter API'et kun på `127.0.0.1` og CORS tillader kun `localhost:5173`, men der er
intet login, og databasen er åben på netværket. Bliver vigtigere med autokør (punkt 3), der pusher selv.

**Trusler, punktet dækker:** andre på samme netværk (café, kollegie), ondsindede hjemmesider i din
browser, der kalder dit lokale API (CSRF/DNS-rebinding), lækkede nøgler, en stjålen bærbar, og
prompt injection (tekst i en repofil, der prøver at få en agent til at gøre noget, du ikke har bedt om).

**Hurtige gevinster (små, kan tages når som helst):**
- Postgres kun på denne maskine: `"127.0.0.1:5432:5432"` i docker-compose.yml i stedet for `"5432:5432"`.
- Database-adgangskoden ud af docker-compose.yml og ind i `.env` (som allerede er i .gitignore).
- Host-tjek i API'et: afvis kald, hvor `Host` ikke er `localhost`/`127.0.0.1` — stopper DNS-rebinding.
- Kræv `Content-Type: application/json` på alle ændrende kald (afviser formular-angreb fra fremmede sider).
- Sikkerhedsheadere med `@fastify/helmet` og en grænse for antal kald (`@fastify/rate-limit`).
- Start aldrig Vite med `--host` (så bliver frontenden synlig for hele netværket).

**Hemmeligheder:**
- Lav en ny API-nøgle (den gamle har været delt) og sæt et forbrugsloft i Anthropic Console.
- `gitleaks` som pre-commit-hook, så nøgler aldrig kommer i et commit — heller ikke fra en agent.
- GitHub-repoet privat; hemmeligheder logges aldrig (heller ikke i fejlbeskeder eller agentlogs).
- Se også "Privatliv" nedenfor: flere forbudte filtyper og maskering af nøgler, før filindhold sendes
  til AI'en — de to punkter hører naturligt med her.

**Login — før systemet NOGENSINDE gøres tilgængeligt ud over denne maskine:**
- Én bruger: passkey eller adgangskode (argon2), session i en `httpOnly`, `SameSite=strict`-cookie.
- Alle ruter kræver login undtagen selve login-siden. Hænger sammen med "Rigtig brugerhåndtering".
- Fjernadgang (fx fra mobilen) kun via en privat tunnel (Tailscale el.lign.), aldrig en åben port.

**Agenterne (bevar og skærp det, der findes):**
- Stivagten, ingen shell, faste git-argumenter og sandkassede design-skitser bliver — nye funktioner
  må ikke svække dem, og agenter må aldrig kunne ændre deres egne sikkerhedsregler.
- Autokør pusher kun egne grene og åbner PR'er — aldrig til main (en "branch protection rule" på GitHub).
- GitHub-adgang med et fintmasket token, der kun gælder de valgte repoer.

**Data og drift:**
- Diskkryptering på maskinen (BitLocker) — beskytter database og kode ved tyveri.
- Sikkerhedskopier (punkt 4) krypteres, hvis de gemmes uden for maskinen.
- Afhængigheder: `npm audit` jævnligt og Dependabot på GitHub.
- Revisionslog: hvem/hvad ændrede hvad og hvornår (fletning, push, sletning), så et uheld kan spores.

## 6. Agentvalg pr. opgave (tildeling) — FØR nye roller
I dag kører ALLE agenter på HVER opgave. Med flere roller stiger prisen pr. opgave tilsvarende.
- En liste ved oprettelse, hvor du vælger, hvilke agenter der tilknyttes opgaven (fornuftige
  standarder pr. opgavetype). I første omgang: Programmør (Kodey) og Arkitekt (Astrid).
- Var med i det oprindelige design som `Tildeling` (valgfrie karakteristika pr. opgave)

## 7. Nye roller
- **Analytiker:** vurderer systemets styrker og svagheder (pros/cons), risici og teknisk gæld
- **Forretningsrådgiver:** vurderer værdi — hvem har gavn af systemet, og hvordan skabes værdien
- Kræver egne promptregler pr. rolle (scopeGraenser findes allerede i rolle-tabellen)
- Nuværende: Programmør (Kodey, skriver kode), Arkitekt (Astrid, skriver ikke kode)

## 8. Opgavehierarki og split
- Projekt → opgaver er bygget (projekterne). Tilbage: underopgaver (opgave får `forældreOpgaveId`)
- Opgaveoversigten vises som et træ, der kan foldes ud
- Split-funktion: Arkitekten vurderer, om en opgave er for stor, og foreslår en opdeling
  som et beslutningspunkt; brugeren godkender, før underopgaverne oprettes
- Tokenforbrug: splitting sparer ikke nødvendigvis tokens i alt (hver underopgave genlæser
  filer og systemprompt), men giver kortere og billigere samtaler pr. kørsel, langt mindre
  spild ved fejl og lofter, bedre kvalitet og lettere gennemsyn.
  Tommelfingerregel: én opgave skal kunne implementeres i én kørsel under loftet.
- Løser også, at "system fra bunden" er for stort til én kørsel

## 9. Ny side: Evaluér projektet (Arkitekt + Analytiker)
- Evaluering af HELE projektet, ikke en enkelt opgave: arkitektur, styrker, svagheder, risici
- Kun læseadgang; resultatet er en rapport
- Fund kan med ét klik blive til nye opgaver i projektet
- Token-tung (læser meget kode) — budgetvagten beskytter mod overraskelser

## 10. Ny side: Evaluér projektets værdi (Forretningsrådgiver)
- Hvem er brugerne, hvilket problem løses, hvordan skabes og måles værdien
- Kræver mere end kode: projektets beskrivelse og formål (fra projekterne)
- Kan foreslå opgaver, der øger værdien

## 11. Copilot i højre side
- Et chatpanel i højre side af appen, hvor du kan sparre med en AI om dine opgaver.
- Adgang (kun læsning) til: opgaveoversigten, beslutningspunkter og løsningsforslag, agenternes
  svar og implementeringer, og forbrugstallene. Gives som værktøjer, så den selv henter det,
  den skal bruge — i stedet for at alt sendes med i hver besked (dyrt).
- Kender den side, du står på (fx den åbne opgave), som udgangspunkt for samtalen.
- Må ikke selv vælge, implementere eller slette; kan foreslå handlinger, du udfører med et klik.
- Samtaler gemmes pr. opgave; svar streames, så teksten kommer løbende.
- Tæller med i forbrug og budgetvagt som en ny kørselstype "copilot".

## 12. Retrospektiver og agenthukommelse
Efter hver opgave reflekterer de agenter, der deltog, og lærer til næste gang.
- Når en opgave afsluttes, skriver hver deltagende agent en retrospektiv: **hvad gik godt**, **hvad gik
  knap så godt**, og **hvad skal være anderledes** ved fremtidige opgaver. Grundlag: opgaven, valgt
  retning, dine kommentarer, implementeringens udfald (flettet/kasseret, typefejl, lofter ramt).
- Gemmes pr. agent i `agent_hukommelse` (identity: uforanderlig / config: kun via din godkendelse /
  memory: append-only, så retrospektiver aldrig overskrives).
- Retrospektiverne destilleres løbende til et kort wisdom-dokument pr. agent, som sendes med i
  agentens prompt (`wisdomDokument` findes allerede i prompten — i dag en stub).
- Du kan se, rette og godkende hver agents hukommelse på en side, så den aldrig lærer noget forkert
  i det skjulte. Hukommelse kan evt. være pr. projekt (konventioner) og pr. agent (arbejdsvaner).
- Retrospektiven er en betalt kørsel → tæller i forbrug og budgetvagt; slås fra i mock.
- Komprimering: hvornår destilleres (efter N opgaver eller M tokens) — åbent spørgsmål.

---

# Senere — tidligere planlagte punkter, stadig åbne

## Skift mellem API og abonnement (droppet indtil videre, 14. oktober)
- Vælg i browseren, om agenterne kører på API-nøglen (betalt pr. token) eller dit Claude-abonnement.
  Tre tilstande: mock / abonnement / api — valget gemmes, så det overlever en genstart.
- Kræver en analyse-runner via Agent SDK'en (implementeringer bruger den allerede).
  Bonus: SDK'ens strukturerede output fjerner problemet med tekst uden om JSON'en.
- Når abonnementets kvote er brugt: popup med besked og, hvis muligt, hvornår den er ledig
  igen, samt en knap "Skift til API". Skift ALDRIG automatisk — det koster penge.
- ⚠ Undersøg først: (1) melder Agent SDK'en, hvornår kvoten nulstilles, eller kun at den er brugt?
  (2) Anthropics regler for abonnement via SDK er i bevægelse — tjek hjælpeartiklen.
  (3) Abonnementet følger forbrugervilkårene (træningsindstillingen på claude.ai), API'et ikke.
- Kun til eget brug — et produkt til andre skal bruge API-nøgler (se Privatliv).
- Budgetvagten gælder kun API-tilstanden; forbrugssiden bør vise, hvilken tilstand en kørsel brugte.


## Processkabeloner pr. opgavetype
Proces som DATA (tabel), ikke if-sætninger i orchestratoren.
- `FaseSkabelon`: navn, formål, anbefaledeRoller, arbejdsregler (injiceres i agentkontekst)
- `Processkabelon`: opgaveType → faser. `Opgave` udvides med `aktuelFase`
- Faseovergang = Beslutningspunkt (mekanismen findes allerede)
- Prototype-reglerne skal eksplicit OPHÆVE arkitekturkrav ("fart over genbrugelighed")
- Bugfix-proces: reproducér → find årsag → ret → regressionstest
- Første skridt kan tages nu: én implementeringsregel pr. opgavetype i implementeringPrompt.ts

## Jobkø (IJobKoe-kontrakt)
Analyser venter stadig i HTTP-kaldet (implementeringer kører allerede i baggrunden).
Forudsætning for autokør (punkt 3).
Teknologi: pg-boss oven på eksisterende Postgres. Giver også parallel/sekventiel eksekvering.

## Sekretæragenten
Konsoliderer agentsvar til briefinger. Ruter aldrig, beslutter aldrig.
Bliver vigtigere med flere roller (punkt 7): flere svar skal samles til ét overblik.

## Rolleregistrets dedup-tjek
pgvector-kolonne på `roller.formaal`, `findLignende()` med similaritetstærskel.

## Intern Analyser
Læser rå observationer, destillerer til AnalyseRapport ved projektgrænser.
Overvåger også sekretæren for skævvridning.

## Rigtig brugerhåndtering
Erstat seed-scriptets dev-bruger. Lavt prioriteret så længe systemet er enkeltbruger.

## Privatliv, hvis produktet skal sælges
Løftet til kunden: "Din kode rører aldrig vores servere, og du bestemmer selv, hvilken AI der ser den."

**Kan tages tidligt (beskytter også dine egne nøgler i dag):**
- Flere forbudte filtyper som standard: `*.pem`, `*.key`, credentials-filer o.l. (udvid `erForbudtNavn` i stiSikkerhed.ts)
- Hemmeligheds-scanning: maskér noget, der ligner API-nøgler og adgangskoder, i filindhold FØR det sendes til AI'en

**Arkitektur:**
- Selvhostet frem for SaaS: kunden kører systemet selv, så koden aldrig rører dine servere
- Bring your own key: kunden bruger sin egen API-nøgle og har selv aftalen med udbyderen
  (et produkt til andre SKAL bruge API-nøgler, ikke Claude-abonnementer)
- Valg af udbyder pr. kunde: Anthropic direkte, Claude via Amazon Bedrock / Google Vertex AI
  (data i kundens egen cloud, evt. i EU), eller en lokal model for maksimal privatliv
  → nye runnere bag `IAgentRunner`, ingen ombygning
- Permanent sletning ved siden af soft delete (GDPR: ret til sletning)
- Kryptering af databasen og adgangsstyring, når der er flere brugere (se brugerhåndtering)

**Aftaler og jura (få en GDPR-advokat med, før der sælges):**
- Databehandleraftale (DPA) med Anthropic; Zero Data Retention for kvalificerede virksomheder
- Privatlivspolitik, databehandleraftale med kunderne og liste over underdatabehandlere
- Overførsel af data til USA skal være dækket

## Faste principper (gælder alle punkter)
- Kontrakter i `packages\domain\src\contracts`, implementeringer i `apps\api`
- Orchestratoren koordinerer, løser aldrig — og læser kun destillater, aldrig rå strømme
- Al beslutningskraft hos brugeren, al udførelse hos agenter
  (med autokør, punkt 3, flytter beslutningen til pull requesten — intet flettes uden brugeren)
- Apps importerer aldrig fra hinandens src
- Repoet er sandheden: ændringer fra Claude leveres som patch (se CHEATSHEET)
