# Cheat sheet — navigation og tommelfingerregler

Læg denne fil i projektroden (`multiagent\CHEATSHEET.md`), så den altid er ved hånden i IntelliJ.

## Navigation i PowerShell

| Kommando | Gør |
|---|---|
| `cd apps\api` | Gå ind i mappe (relativt til hvor du står) |
| `cd ..` | Ét niveau op |
| `cd ..\..` | To niveauer op |
| `cd \Users\Jens` | Absolut sti (fra drevets rod) |
| `dir` | Vis filer i den aktuelle mappe |
| `tree /F` | Vis hele mappetræet med filer |
| `pwd` | Vis hvor du står lige nu |
| `mkdir src\db` | Opret mappe (også flere niveauer ad gangen) |
| `ren gammel.txt ny.ts` | Omdøb fil |
| `Ctrl+C` | Stop en kørende proces (fx dev-serveren) |

**Vigtigste vane: brug Tab.** Skriv `cd ap` og tryk Tab — PowerShell udfylder `apps\` selv. Tryk Tab igen for at bladre mellem muligheder. Det eliminerer både tastefejl og stier, du ikke kan huske.

**Læs altid prompten før du kører noget.** `PS C:\...\multiagent>` vs. `PS C:\...\multiagent\apps\api>` — den linje fortæller dig, hvilken mappe kommandoen rammer. De fleste "file does not exist"-fejl er i virkeligheden "forkert mappe"-fejl.

## Hvilken kommando køres hvorfra?

| Kommando | Mappe |
|---|---|
| `docker compose up -d` / `down` / `ps` / `exec` | Roden (`multiagent\`) |
| `npm install`, `npm run dev`, `npx tsx ...` (API) | `apps\api` |
| `npx drizzle-kit generate` / `migrate` | `apps\api` |
| `npm install`, `npm run dev` (React) | `apps\web` |

Reglen bag: `npm`/`npx` bruger den `package.json`, der ligger i mappen du står i. `docker compose` leder efter `docker-compose.yml` samme sted.

**IntelliJ-genvej:** Alt+F12 åbner terminalen (starter altid i projektroden). Klik `+` i terminalpanelet for flere faner — hav én stående i `apps\api` og én i roden.

## Porte — hvem lytter hvor

| Port | Hvad | Adresse |
|---|---|---|
| 3000 | API (Fastify) | http://localhost:3000/opgaver |
| 5173 | React (Vite dev) | http://localhost:5173 |
| 5432 | Postgres (Docker) | bruges af API'et, ikke browseren |

Websiden taler KUN med API'et. API'et taler KUN med databasen.

## Databaseændringer — altid samme tre trin

1. Redigér `apps\api\src\db\schema.ts`
2. `npx drizzle-kit generate` (fra `apps\api`)
3. `npx drizzle-kit migrate`

Rør ALDRIG filerne i `multiagent\db\migrations` manuelt — de er Drizzles ejendom (men de skal med i git).

## Arkitektur-tommelfingerregler

- **Mappestruktur (frontend):** flad `components\` indtil ~10 filer. Derefter feature-mapper (`components\opgave\`, `components\beslutning\`) — en feature får egen mappe ved 3+ komponenter. `components\faelles\` er KUN for komponenter, der ikke importerer noget fra domænet (Knapper, Popup); ellers bliver "fælles" en rodekasse.
- **Maks 250 linjer pr. fil.** Linjetallet er røgalarmen, ikke branden: overstiges grænsen, har filen sandsynligvis mere end ét ansvar — find ansvarene og navngiv nye filer efter dem. Split aldrig mekanisk efter antal. Tjek med: `wc -l` på filerne (eller `Get-ChildItem -Recurse -Filter *.ts | ForEach-Object { "$($_.Name): $((Get-Content $_.FullName).Count)" }` i PowerShell).

- **Import-retningen:** `apps\*` må importere fra `packages\domain`. Apps må ALDRIG importere fra hinandens `src`. Domænepakken importerer ikke fra nogen.
- **Lagene i API'et:** `server.ts` validerer og ruter (ingen SQL, ingen logik) → `repository\` oversætter mellem database og domæne (ingen logik) → forretningslogik hører til i orchestratoren.
- **Kontrakter i `packages\domain\src\contracts`, implementeringer i `apps\api`.** Afhæng af kontrakten, aldrig af implementeringen.
- **Hemmeligheder i `.env`** (ligger i `apps\api`, står i `.gitignore`) — aldrig i koden, aldrig i git.

## Kodestandarder (fra praktikpladsen)

- **Generisk base + specialiseret variant med suffiks.** Basen er neutral, varianten navngives efter sin specialisering: `agentPrompt.ts` (neutral) → `AgentRunnerAnthropic`, `vaerktoejerAnthropic`. Ny udbyder = ny fil med nyt suffiks, basen røres ikke.
- **Dispatcher med switch på en diskriminator** (`switch (kald.type)`), afsluttet med en `never`-funktion, så compileren fejler, hvis en ny type glemmes.
- **Eksplicitte returtyper** på alle funktioner.
- **Kanttilfælde: blød nedbrydning + logning.** Forventede fejl (forbudt sti, binær fil) bliver til en forklarende besked, ikke et crash — og logges, så mønstre kan ses over tid.
- **Dansk navngivning hele vejen.** Blandet sprog er det værste valg; skift eventuelt samlet senere.

## Frontend-standarder (fra læselisten og JP)

- **`cn()` til alle betingede klasser** (`src\lib\cn.ts`) — aldrig tekststrenge med `${}`. En `className` udefra vinder over basisklasser.
- **Hover kun med mus:** skriv `pointer-fine:hover:...`, aldrig bare `hover:`. Touch-skærme får ellers "klæbende" hover efter et tryk.
- **Ikoner med `fill-current`** (`components\Ikoner.tsx`), så de arver knappens farve. `aria-hidden` når knappen har tekst, `aria-label` på knapper der kun er et ikon.
- **Returtypen `Renderable`** på alle komponenter.
- **Optimistisk UI** via `useOptimistisk` (`src\lib`): ønsket er SLUTTILSTANDEN, skrevet som en funktion af den nuværende tilstand, så overlappende handlinger lægges ovenpå hinanden. Fejler serveren, ruller React selv tilbage.
- **Rene ønske-funktioner i egne filer** (fx `beslutningsOensker.ts`), så de kan testes uden React.

## Fil-adgang for agenter

- Opgaver kan få en **projektsti**; så får agenterne LÆSEADGANG (list, læs, søg) til den mappe.
- Sæt `PROJEKT_ROD` i `apps\api\.env` (fx `C:\Users\Jens Ulrik\IdeaProjects`) — så kan projekter kun ligge derunder.
- Aldrig tilgængeligt: `.env*`, `.git`, `node_modules`, `dist`, `build`, `.idea`, symlinks ud af projektet.
- Loft: `MAX_VAERKTOEJSKALD` (standard 15) pr. agentkørsel. Filer over 50 KB afkortes.
- API'et lytter kun på `127.0.0.1` — andre maskiner på netværket kan ikke få agenterne til at læse dine filer.

## Agent-implementeringer (git-grene)

Når du trykker **Implementér**, skriver Kodey koden på sin egen gren i en mappe ved siden af projektet (fx `multiagent-agent-a3f29c1e`). Din egen mappe og `main` røres aldrig. Agentens commits har forfatteren "Kodey (agent)".

| Gør | Kommando (fra projektets rod) |
|---|---|
| Se hvad agenten ændrede | Fanerne **Filer ændret** / **Filer oprettet** på kortet — eller `git diff HEAD...agent/a3f29c1e` |
| Se agentens commit | `git log -1 --stat agent/a3f29c1e` |
| Flet den ind | `git merge agent/a3f29c1e` |
| Fortryd efter fletning | `git revert <commit>` (laver en ny commit, historikken bevares) |
| Ryd op bagefter | Knappen **Ryd op** i browseren — fjerner gren og mappe |

- Kræver at projektet er et **git-repo med mindst én commit**. Agenten arbejder ud fra din seneste commit — ugemte ændringer er ikke med.
- Lofter pr. implementering i `apps\api\.env`: `MAX_IMPLEMENTERING_USD` (standard 1) og `MAX_IMPLEMENTERING_RUNDER` (standard 40).
- Agenten kan læse og skrive filer og køre typetjek — **ingen** kommandolinje. Mangler der en pakke eller migration, står det i dens opsummering.
- Stopper serveren midt i en kørsel, rydder den op ved næste opstart.

## Projekter

- Forsiden er **Projekter**. Opret et projekt med navn, sti (skriv den, eller brug **Gennemse filer**) og en kort beskrivelse.
- Klik på et projekt for at se og oprette dets opgaver. Opgaverne arver projektets sti — ændr stien på projektet, så følger opgaverne med.
- Opgaver fra før projekterne fandtes, blev placeret automatisk ved første opstart: ét projekt pr. sti, og "Uden projekt" for opgaver uden sti. Omdøb dem gerne.
- **Arkivér** fjerner et projekt fra oversigten. Find det igen under **Arkiverede projekter** nederst på forsiden, og tryk **Gendan**. Kun et arkiveret projekt kan **slettes permanent** — og så forsvinder opgaver, beslutninger og implementeringer for altid.

## Område og design-skitser

- Hver opgave har en **type** (hvilken slags arbejde) og et **område** (hvor i systemet): frontend, backend, fuldstack eller andet.
- Ved **frontend** og **fuldstack** tegner agenterne en skitse af hvert løsningsforslag. Klik på miniaturen for at se den i fuld størrelse.
- Området kan ændres under Redigér. Skift til frontend og bed om en ny vurdering, hvis du vil have skitser på en eksisterende opgave.
- Skitserne koster ekstra tokens pr. analyse — vælg kun frontend, når opgaven faktisk er visuel.

## Autokør

- På projektsiden: **Tilføj opgaver** → sæt flueben → **Sæt i kø** → **Start køen**. Opgaverne tages én ad gangen, på tværs af projekter, i den rækkefølge de blev sat i kø.
- For hver opgave: har du valgt retning, bruges dit valg; ellers vælger **arkitekten** (Astrid) og skriver en kort begrundelse. Kodey implementerer på sin egen gren, grenen pushes som `agent/<id>-<titel>`, og der oprettes en **pull request** mod den gren, du står på (typisk main).
- Du gennemser og fletter pull requesten på GitHub. Intet flettes automatisk, og main røres aldrig.
- Køen **stopper** ved første fejl, når dagens loft er nået (`AUTOKOER_MAX_PR_DAG`, standard 5), og efter en genstart af serveren — start den igen, når du har set, hvad der skete. "Stop efter den aktuelle" afbryder aldrig en kørsel midtvejs.
- Er en implementering stoppet af et loft (måske ufærdig), oprettes pull requesten som **kladde**.
- Kræver **GitHub CLI**: installér fra cli.github.com og kør `gh auth login` én gang. Repoet skal have en remote ved navn `origin` på GitHub. Systemet gemmer intet token selv.
- Uden API-nøgle (mock) kører hele kæden, men **intet pushes** til GitHub.
- Arkitektens valg er et lille betalt kald; det tæller med i forbrug og budgetvagt under arkitektens navn.
- Flettet en pull request? Hent den med `git pull`, og tryk derefter **Ryd op** på implementeringen.

## Topbjælken

- Titel og faner (Projekter · Forbrug · Indstillinger) hænger fast i toppen, når du ruller ned (`components\Topbjaelke.tsx`). Når der er rullet, får bjælken en kant og en skygge.

## Temaer

- Vælg tema under **Indstillinger** (øverst til højre): **Normal** (mørkt) eller **Platin** (mørkt stålblåt metal med sølvkant og lys tekst). Valget gemmes i browseren.
- Farverne bor i `apps\web\src\tema.css`: hvert tema er et sæt værdier for de samme tokens (`--color-flade`, `--color-kort` …) plus panel-variabler (`--panel-baggrund`, `--panel-ring`, `--panel-skygge`).
- Platin justeres i Platin-blokken i tema.css: panelernes metalskær (`--platin-hjoerne`, `--platin-mellem`, `--platin-skaer` — hold skæret mørkere end ca. `#5a82a3`, ellers kan den hvide tekst ikke læses) og sidens metalbånd (`--side-baggrund`). Lyse bokse (`bg-flade`, `bg-kort`) får automatisk mørk tekst. Gem filen — Vite opdaterer siden med det samme.
- Farver må ikke skrives direkte i komponenterne (fx `text-[#14121f]`) — brug tokens, ellers følger de ikke temaet med. Tekst på accentfarven: `text-paa-accent`.
- Store flader (kort, formularer, popups) har klassen `panel` — så får de temaets baggrund, kant og skygge. Nye paneler: brug `panel border` i stedet for `border border-kant bg-kort`.
- Nyt tema: tilføj en blok `[data-tema="navn"] { … }` i tema.css og en linje i `TEMAER` i `src\lib\tema.ts` (og navnet i scriptet i `index.html`).

## Billeder i opgaver og kommentarer

- Tryk **+** i højre side af beskrivelsesfeltet eller kommentarfeltet — eller indsæt et skærmbillede med **Ctrl+V**, eller træk en fil ind i feltet. Højst 6 billeder pr. opgave og pr. kommentar; PNG, JPG, GIF og WebP.
- **Agenterne ser billederne** — både når opgaven analyseres, ved en ny vurdering (kommentarernes billeder) og ved implementering. Billeder koster tokens (et stort billede ≈ 1.500 tokens pr. agent).
- Store billeder skaleres ned i browseren til højst 1568 px, før de uploades. Små billeder (fx teksturer) røres ikke og vises forstørret med skarpe pixels.
- Billeder kan fjernes igen under **Redigér**. Slettes en kommentar, forsvinder dens billeder også.
- Billederne ligger i databasen (tabellen `vedhaeftninger`). Billeder, der blev uploadet, men aldrig gemt med en opgave eller kommentar, ryddes op ved næste opstart.

## Billedfiler i filgennemsynet

- Ændrer agenten en billedfil (png, jpg, gif, webp, svg …), viser filgennemsynet billedet **før og efter** side om side — fx en tekstur i et spil eller et ikon i en app.
- Små billeder (op til 64 px, som Minecraft-teksturer på 16×16) forstørres med skarpe pixels. Den ternede baggrund viser gennemsigtighed.
- SVG vises både som billede og som tekst-diff. Virker for alle projekter — der skal ikke startes noget.

## Før/efter-billeder

- Ved **frontend**- og **fuldstack**-opgaver fotograferer systemet de berørte sider, når en implementering er færdig: **før** (grenens udgangspunkt) og **efter** (agentens commit). De vises side om side på implementeringskortet; klik for fuld størrelse og skift mellem Før og Efter på samme plads.
- Agenten skriver de berørte sider sidst i sin opsummering (`Ruter: /, /forbrug`) — højst 3. Ellers fotograferes forsiden.
- Systemet starter en midlertidig Vite-server i agentens mappe på en ledig port og fotograferer med din Edge eller Chrome (uden vindue). Din egen dev-server, mappe og `node_modules/.vite` røres ikke. Tager typisk 10–30 sek. og koster ingen tokens.
- Siderne bruger dine rigtige data, men må **kun læse** fra systemets eget API. Alt andet — andre domæner, andre porte, POST/PATCH/DELETE — afvises og står på kortet.
- Har agenten ændret en fil, Vite kører på din maskine (fx `vite.config.ts`, `package.json`, en `postcss.config`), springes efter-billederne over. Gennemse og flet først.
- Vite-processen får aldrig hemmeligheder fra `.env` (API-nøgle, database-adgang).
- Kræver `npm install` i `apps\api` (pakken `playwright-core`). Ingen browser skal hentes. Slå funktionen fra med `SKAERMBILLEDER=fra` i `apps\api\.env`.
- Billederne gemmes i databasen og bliver, når grenen ryddes op.

## Forbrug og budget

- Siden **Forbrug** (link øverst til højre) viser forbrug i dag, pr. dag, pr. opgave og pr. agent.
- `DAGLIGT_BUDGET_USD=1` i `apps\api\.env` slår budgetvagten til: nye analyser og implementeringer afvises, når dagens forbrug har nået beløbet. Nulstilles ved midnat. Mock-kørsler blokeres aldrig.
- Tre lag beskyttelse: loft pr. implementering (`MAX_IMPLEMENTERING_USD`) → dagsbudget → dine kreditter uden auto-reload (den hårde mur).
- Systemets beløb er beregnet ud fra en pristabel (`apps\api\src\forbrug\priser.ts`). Det beløb, du faktisk betaler, står i Anthropics konsol.
- Beløb vises også i kroner i småt, fx *0,09 USD (≈ 60 øre)*. Kursen er fast og kun vejledende — opdatér `KURS_USD_DKK` i `packages\domain\src\domain\valuta.ts` en gang imellem.

## Ændringer fra Claude (patch-arbejdsgang)

Repoet er sandheden — ikke Claudes kopi. Derfor leveres ændringer som en patch, der flettes ind i DIN kode, så intet, du eller agenterne har lavet, overskrives.

1. **Send din aktuelle kode** (fra roden): `git archive -o "$env:USERPROFILE\Downloads\multiagent-main.zip" HEAD` — lille zip uden `node_modules` og `.env`. Upload den i chatten.
2. **Anvend patchen** på en ny gren: `git switch -c <navn>` og `git apply --3way "$env:USERPROFILE\Downloads\<navn>.patch"`
3. **Konflikter** vises som almindelige git-konflikter: Git → Resolve Conflicts i IntelliJ.
4. `npx tsc` i begge apps, test, commit, flet ind i `main`.

Pak ALDRIG en hel projektmappe til upload: den indeholder `.env` med din API-nøgle og `node_modules`.

## Klassiske Windows-fælder

- **Skjulte `.txt`-endelser:** filer gemt via Notesblok/browser kan hedde `fil.ts.txt`. Tjek med `dir`; opret hellere filer inde fra IntelliJ (højreklik mappe → New → File).
- **Stier med mellemrum skal i anførselstegn:** `C:\Users\Jens Ulrik\...` læses ellers som to argumenter. Skriv `"C:\Users\Jens Ulrik\..."`, eller brug en relativ sti fra projektroden, fx `apps\web\src\...`.
- **`<`-omdirigering virker ikke i PowerShell:** brug `Get-Content fil.sql | kommando` i stedet.
- **Hængende Docker:** `wsl --update` + `wsl --shutdown`, quit Docker Desktop helt fra systembakken, start igen.
