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

Skærmbilleder af systemet:

<img width="817" height="541" alt="image" src="https://github.com/user-attachments/assets/9ebd9254-083a-4e53-ae01-86f5c988ae2e" />

<img width="750" height="621" alt="image" src="https://github.com/user-attachments/assets/d201e604-bad9-497a-a079-082e3f88943f" />

<img width="778" height="848" alt="image" src="https://github.com/user-attachments/assets/470a5a8e-857a-4c42-b64c-bca1faf060c5" />

<img width="777" height="653" alt="image" src="https://github.com/user-attachments/assets/d0001015-de60-4cbc-a341-2c08874ef4ad" />

<img width="769" height="879" alt="image" src="https://github.com/user-attachments/assets/cbb2aeaa-be43-455f-ad6f-45e9b88ae017" />

<img width="774" height="870" alt="image" src="https://github.com/user-attachments/assets/7a8a1cb9-18fa-43f9-ba75-770d37ca4f2d" />

<img width="713" height="514" alt="image" src="https://github.com/user-attachments/assets/21784968-5a8a-43de-88da-7a7faeec11fc" />

<img width="806" height="855" alt="image" src="https://github.com/user-attachments/assets/a089c864-5924-4792-bb54-79ed27868fbb" />

<img width="2250" height="1500" alt="image" src="https://github.com/user-attachments/assets/b832b877-287b-4cb1-bf95-8a7477cf74ee" />





