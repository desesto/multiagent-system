// Ét beslutningspunkt — åbne punkter er klikbare, besluttede er
// læsbar historik med det valgte fremhævet.

import { useEffect, useState } from "react";
import type { Beslutningspunkt as Punkt } from "../../../../packages/domain/src/domain/opgave";
import type { GemtAgentSvar } from "../../../../packages/domain/src/contracts/agentSvarRepository";
import { hentFuldtSvar, hentAgentNavne } from "../api";
import { Knap, FortrydKnap, ImplementerKnap } from "./Knapper";
import { Kommentarer } from "./Kommentarer";
import { DesignSkitse } from "./design/DesignSkitse";
import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";

export function Beslutning({
  punkt,
  svar,
  onValgt,
  onFortryd,
  onImplementer,
  onReevaluer,
  medKommentarer = false,
}: {
  punkt: Punkt;
  /** Preloadede svar (detaljesiden). Udelades → lazy-hentes ved fold-ud. */
  svar?: GemtAgentSvar[];
  onValgt?: (punkt: Punkt, mulighedId: string) => Promise<void>;
  /** Vises kun hvor fortrydelse giver mening (detaljesiden) */
  onFortryd?: (punkt: Punkt) => Promise<void>;
  /** Vises kun når opgaven har en projektsti (detaljesiden) */
  onImplementer?: (punkt: Punkt) => Promise<void>;
  /** Ny vurdering — udelades, når opgaven er afsluttet */
  onReevaluer?: (punkt: Punkt) => Promise<void>;
  /** Kommentarfeltet vises kun på detaljesiden */
  medKommentarer?: boolean;
}): Renderable {
  const [vaelger, setVaelger] = useState(false);
  const [starter, setStarter] = useState(false);
  const [hentede, setHentede] = useState<GemtAgentSvar[] | null>(svar ?? null);
  const [navne, setNavne] = useState<Record<string, string>>({});

  useEffect(() => {
    hentAgentNavne().then(setNavne);
  }, []);

  const besluttet = punkt.valgtMulighedId !== null;
  /** Erstattet af en ny vurdering: bevares i historikken, men kan kun læses */
  const erstattet = Boolean(punkt.erstattetAf);

  async function haandterImplementer(): Promise<void> {
    if (!onImplementer) return;
    setStarter(true);
    try {
      await onImplementer(punkt);
    } finally {
      setStarter(false);
    }
  }

  async function haandterValg(mulighedId: string): Promise<void> {
    if (!onValgt) return;
    setVaelger(true);
    try {
      await onValgt(punkt, mulighedId);
    } finally {
      setVaelger(false);
    }
  }

  async function haandterFoldUd(
    event: React.SyntheticEvent<HTMLDetailsElement>
  ): Promise<void> {
    if (event.currentTarget.open && hentede === null) {
      setHentede(await hentFuldtSvar(punkt.id));
    }
  }

  return (
    <div
      className={cn(
        "mt-3.5 rounded-lg border bg-flade p-3.5",
        erstattet && "opacity-60",
        besluttet || erstattet ? "border-kant" : "border-accent"
      )}
    >
      {erstattet && (
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-daempet">
          Erstattet af en ny vurdering
        </p>
      )}
      <p className="mb-3 text-[0.95rem] font-semibold">{punkt.spoergsmaal}</p>
      <div className="grid gap-2.5 md:grid-cols-2">
        {punkt.valgmuligheder.map((m) => {
          const valgt = punkt.valgtMulighedId === m.id;
          return (
            <div
              key={m.id}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border border-kant p-3",
                valgt && "border-accent",
                besluttet && !valgt && "opacity-45"
              )}
            >
              <p className="text-[0.9rem] font-semibold">
                {valgt && <span className="text-accent">✓ </span>}
                {m.beskrivelse}
              </p>
              {m.designHtml && <DesignSkitse html={m.designHtml} titel={m.beskrivelse} />}
              {m.fordele.length > 0 && (
                <p className="text-[0.8rem] text-t-feature">
                  + {m.fordele.join(" · ")}
                </p>
              )}
              {m.ulemper.length > 0 && (
                <p className="text-[0.8rem] text-t-bugfix">
                  − {m.ulemper.join(" · ")}
                </p>
              )}
              {m.foreslaaetAf && (
                <p className="font-mono text-xs text-daempet">
                  — {navne[m.foreslaaetAf] ?? "agent"}
                </p>
              )}
              {!besluttet && !erstattet && onValgt && (
                <Knap
                  variant="primaer"
                  className="mt-auto"
                  onClick={() => haandterValg(m.id)}
                  disabled={vaelger}
                >
                  Vælg denne retning
                </Knap>
              )}
            </div>
          );
        })}
      </div>
      {besluttet && !erstattet && punkt.besluttetTidspunkt && (
        <div className="mt-2.5 flex items-center justify-between">
          <p className="font-mono text-xs text-daempet">
            Besluttet{" "}
            {new Date(punkt.besluttetTidspunkt).toLocaleString("da-DK")}
          </p>
          <div className="flex gap-2">
            {onImplementer && (
              <ImplementerKnap starter={starter} onClick={haandterImplementer} />
            )}
            {onFortryd && <FortrydKnap onClick={() => onFortryd(punkt)} />}
          </div>
        </div>
      )}
      {(punkt.tidligereValg?.length ?? 0) > 0 && (
        <p className="mt-1.5 font-mono text-xs text-daempet">
          {punkt.tidligereValg!.length} tidligere valg fortrudt
        </p>
      )}
      {medKommentarer && (
        <Kommentarer
          punktId={punkt.id}
          start={punkt.kommentarer ?? []}
          laast={erstattet || !onReevaluer}
          onReevaluer={onReevaluer && !erstattet ? () => onReevaluer(punkt) : undefined}
        />
      )}
      <details className="mt-3" onToggle={haandterFoldUd}>
        <summary className="cursor-pointer text-[0.85rem] text-daempet">
          Se agentens fulde svar
        </summary>
        {hentede === null ? (
          <p className="text-daempet">Henter…</p>
        ) : hentede.length === 0 ? (
          <p className="text-daempet">Intet svar gemt for dette punkt.</p>
        ) : (
          hentede.map((s) => (
            <div key={s.id} className="mt-2 rounded-md bg-kort px-3 py-2.5">
              <p className="mb-1 font-mono text-xs text-daempet">
                {navne[s.agentId] ?? "Agent"}:
              </p>
              <p className="whitespace-pre-wrap text-[0.88rem]">{s.indhold}</p>
              <LaesteFiler filer={s.laesteFiler} />
            </div>
          ))
        )}
      </details>
    </div>
  );
}

/** Revisionssporet: hvad agenten faktisk kiggede på, før den svarede */
function LaesteFiler({ filer }: { filer: string[] }): Renderable {
  if (filer.length === 0) return null;
  return (
    <p className="mt-2 border-t border-kant pt-2 font-mono text-xs text-daempet">
      Læste {filer.length} {filer.length === 1 ? "fil" : "filer"}: {filer.join(", ")}
    </p>
  );
}
