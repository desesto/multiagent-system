// Seed-script til udvikling: sikrer en bruger, en rolle og en agent,
// så opgaver kan oprettes og mock-flowet har en agent at køre.
// Kør: npx tsx src/seed.ts

import "./env";
import { db } from "./db/db";
import { eq } from "drizzle-orm";
import { brugere, roller, agenter } from "./db/schema";

// Bruger
const email = "dev@lokal.dk";
let bruger = await db.query.brugere.findFirst({
  where: (b, { eq }) => eq(b.email, email),
});
if (!bruger) {
  [bruger] = await db
    .insert(brugere)
    .values({ navn: "Dev-bruger", email })
    .returning();
}
console.log("Dev-bruger:", bruger.id);

// Rolle
let rolle = await db.query.roller.findFirst({
  where: (r, { eq }) => eq(r.navn, "Programmør"),
});
if (!rolle) {
  [rolle] = await db
    .insert(roller)
    .values({
      navn: "Programmør",
      formaal:
        "Skriver genbrugelig, skalerbar kode opdelt i microservices.",
      scopeGraenser: [
        "Må ikke træffe arkitekturbeslutninger uden brugerens godkendelse",
      ],
      anbefaledeKarakteristika: [
        { navn: "grundig", beskrivelse: "Tester før aflevering" },
      ],
      valgfrieKarakteristika: [
        { navn: "eksperimenterende", beskrivelse: "Foreslår nye teknologier" },
      ],
    })
    .returning();
}
console.log("Rolle:", rolle.navn, rolle.id);

// Agent
let agent = await db.query.agenter.findFirst({
  where: (a, { eq }) => eq(a.navn, "Kodey"),
});
if (!agent) {
  [agent] = await db
    .insert(agenter)
    .values({
      rolleId: rolle.id,
      navn: "Kodey",
      personlighed: "Pragmatisk og direkte",
      fokuspunkter: ["genbrugelighed", "skalerbarhed"],
      sparringsNiveau: "ekstra_arkitektur",
    })
    .returning();
}
console.log("Agent:", agent.navn, agent.id);

// Rolle 2: Arkitekt
let arkitektRolle = await db.query.roller.findFirst({
  where: (r, { eq }) => eq(r.navn, "Arkitekt"),
});
if (!arkitektRolle) {
  [arkitektRolle] = await db
    .insert(roller)
    .values({
      navn: "Arkitekt",
      formaal:
        "Vurderer helheden: hvordan løsninger passer ind i den samlede arkitektur og forbliver vedligeholdelige over tid.",
      scopeGraenser: ["Skriver ikke selv implementeringskode"],
      anbefaledeKarakteristika: [
        { navn: "helhedstænkende", beskrivelse: "Ser på tværs af moduler" },
      ],
      valgfrieKarakteristika: [
        { navn: "konservativ", beskrivelse: "Foretrækker gennemprøvede mønstre" },
      ],
    })
    .returning();
}
console.log("Rolle:", arkitektRolle.navn, arkitektRolle.id);

// Agent 2: Astrid — systemudvikler og arkitekt. Bevidst andre fokuspunkter
// end Kodey, så uenighed kan opstå. Personlighed og fokuspunkter opdateres
// ved hver kørsel af seed, så ændringer her også når en eksisterende database.
const ASTRID = {
  personlighed:
    "Systemudvikler og arkitekt, eftertænksom og helhedsorienteret. Genbruger altid eksisterende komponenter, " +
    "før der bygges noget nyt. Bygger nyt som genbrugelige komponenter, når der er god chance for, at de skal " +
    "bruges igen — ellers holdes det enkelt. Foretrækker løst koblede moduler og services med klare grænser " +
    "(microservices, hvor en del skal kunne skaleres, udskiftes eller deployes for sig — ikke for enhver pris). " +
    "Holder filer korte, højst 250 linjer: vokser en fil ud over det, deles den i to filer med fortællende navne",
  fokuspunkter: [
    "genbrug af eksisterende komponenter",
    "genbrugelige komponenter",
    "løst koblede moduler og services",
    "korte filer med fortællende navne",
  ],
};
let astrid = await db.query.agenter.findFirst({
  where: (a, { eq }) => eq(a.navn, "Astrid"),
});
if (!astrid) {
  [astrid] = await db
    .insert(agenter)
    .values({ rolleId: arkitektRolle.id, navn: "Astrid", sparringsNiveau: "normal", ...ASTRID })
    .returning();
} else {
  [astrid] = await db.update(agenter).set(ASTRID).where(eq(agenter.id, astrid.id)).returning();
}
console.log("Agent:", astrid.navn, astrid.id);

process.exit(0);
