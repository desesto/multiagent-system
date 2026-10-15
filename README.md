# Multiagent

Et system, hvor en opgave gives til et hold af AI-agenter med hver deres rolle. De analyserer den parallelt, kan læse projektets kode, og fremlægger forskellige retninger med fordele og ulemper. Brugeren vælger retningen, og programmør-agenten implementerer den på sin egen git-gren, som brugeren selv gennemser og fletter. Alle beslutninger gemmes som historik, der kan fortrydes uden at blive overskrevet.

**Princip:** AI foreslår, mennesket beslutter.

## Stak

- **Backend:** Node.js, Fastify, PostgreSQL (Docker), Drizzle ORM, Anthropic API
- **Frontend:** React 19, React Router, Tailwind CSS v4, Vite
- **Delt:** `packages/domain` — typer og kontrakter, som både frontend og backend importerer

## Kom i gang

```powershell
# 1. Database (fra roden)
docker compose up -d

# 2. API (fra apps\api)
npm install fastify @fastify/cors drizzle-orm pg @anthropic-ai/sdk @anthropic-ai/claude-agent-sdk zod
npm install -D drizzle-kit typescript tsx @types/node @types/pg
npx drizzle-kit migrate
npx tsx src/seed.ts          # opretter dev-bruger, roller og agenter — notér bruger-id'et
npm run dev                  # http://127.0.0.1:3000

# 3. Web (fra apps\web)
npm install react-router-dom tailwindcss @tailwindcss/vite clsx tailwind-merge
# Indsæt bruger-id'et fra seed i src\api\konfig.ts
npm run dev                  # http://localhost:5173
```

## Konfiguration (`apps\api\.env` — aldrig i git)

| Variabel | Betydning |
|---|---|
| `ANTHROPIC_API_KEY` | Uden nøgle kører agenterne som gratis mock |
| `PROJEKT_ROD` | Projekter, agenterne må læse, skal ligge herunder — og her starter "Gennemse filer" |
| `MAX_VAERKTOEJSKALD` | Loft over fil-læsninger pr. analyse (standard 15) |
| `MAX_IMPLEMENTERING_USD` | Udgiftsloft pr. implementering (standard 1) |
| `MAX_IMPLEMENTERING_RUNDER` | Loft over runder pr. implementering (standard 40) |
| `DAGLIGT_BUDGET_USD` | Dagsbudget: nye betalte kørsler afvises, når det er brugt (tom = slået fra) |
| `ANTHROPIC_MODEL` | Standard `claude-sonnet-4-6` |
| `AUTOKOER_MAX_PR_DAG` | Højst så mange autokørsler pr. dag (standard 5) |
| `SKAERMBILLEDER` | `fra` slår før/efter-billeder fra (standard: til) |
| `SKAERMBILLEDE_BROWSER` | Sti til en Chromium-browser, hvis hverken Edge eller Chrome er installeret |

## Mere

- `CHEATSHEET.md` — kommandoer, kodestandarder og regler
- `BACKLOG.md` — planlagte skridt i prioriteret rækkefølge
