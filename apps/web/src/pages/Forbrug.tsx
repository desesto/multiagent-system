// Forbrugssiden: hvad har agenterne kostet — i dag, pr. dag, pr. opgave
// og pr. agent. Bygger på rådata, der gemmes ved hver betalt kørsel.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ForbrugsOversigt } from "../../../../packages/domain/src/domain/forbrug";
import { hentForbrug } from "../api";
import { KURS_TJEKKET, KURS_USD_DKK } from "../../../../packages/domain/src/domain/valuta";
import { Faner } from "../components/Faner";
import { FejlBesked } from "../components/FejlBesked";
import { DagSoejler } from "../components/forbrug/DagSoejler";
import { NoegleTal } from "../components/forbrug/NoegleTal";
import { TopListe } from "../components/forbrug/TopListe";
import type { Renderable } from "../lib/renderable";

type Periode = "7" | "30" | "90";

export function Forbrug(): Renderable {
  const [periode, setPeriode] = useState<Periode>("30");
  const [o, setO] = useState<ForbrugsOversigt | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);

  useEffect(() => {
    hentForbrug(Number(periode))
      .then(setO)
      .catch((e: Error) => setFejl(e.message));
  }, [periode]);

  return (
    <article className="mt-9">
      <h2 className="text-2xl font-semibold">Forbrug</h2>
      <p className="mt-1 text-[0.9rem] text-daempet">
        Hvad agenterne har kostet. Mock-kørsler er gratis og tælles ikke med.
      </p>
      <div className="mt-5">
        <Faner
          etiket="Periode"
          aktiv={periode}
          onSkift={setPeriode}
          faner={[
            { id: "7", tekst: "7 dage" },
            { id: "30", tekst: "30 dage" },
            { id: "90", tekst: "90 dage" },
          ]}
        />
      </div>
      {fejl && <FejlBesked besked={fejl} />}
      {!o && !fejl && <p className="mt-6 text-daempet">Henter forbrug…</p>}
      {o && (
        <div className="mt-5 space-y-4">
          <NoegleTal o={o} />
          <section className="rounded-[10px] panel border p-4">
            <h3 className="mb-3 text-[0.95rem] font-semibold">Pr. dag</h3>
            <DagSoejler dage={o.prDag} />
          </section>
          <TopListe
            titel="Dyreste opgaver"
            poster={o.prOpgave.map((p) => ({
              noegle: p.opgaveId,
              navn: <Link to={`/opgaver/${p.opgaveId}`} className="pointer-fine:hover:text-accent">{p.titel}</Link>,
              usd: p.usd,
            }))}
          />
          <TopListe
            titel="Pr. agent"
            poster={o.prAgent.map((a) => ({
              noegle: a.navn,
              navn: a.navn,
              usd: a.usd,
              ekstra: `${a.koersler} kørsler`,
            }))}
          />
          <p className="text-xs text-daempet">
            Priserne beregnes ud fra en pristabel, der sidst er tjekket {o.priserTjekket}. Det er Anthropics
            konsol, der viser det beløb, du faktisk betaler. Kronerne er omregnet med en fast kurs på{" "}
            {KURS_USD_DKK.toLocaleString("da-DK")} kr. pr. dollar ({KURS_TJEKKET}) og er kun vejledende.
            {o.uprisedeKoersler > 0 &&
              ` ${o.uprisedeKoersler} kørsler kunne ikke prissættes (ukendt model) og er ikke med i beløbene.`}
          </p>
        </div>
      )}
    </article>
  );
}
