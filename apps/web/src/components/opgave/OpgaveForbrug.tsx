// Hvad har opgaven kostet? Henter selv tallet, og opdateres, når en
// ny implementering eller vurdering er startet.

import { useEffect, useState } from "react";
import { hentOpgaveForbrug } from "../../api";
import { Pris } from "../Pris";
import type { Renderable } from "../../lib/renderable";

export function OpgaveForbrug({ opgaveId, opdatering }: { opgaveId: string; opdatering: number }): Renderable {
  const [forbrug, setForbrug] = useState<{ usd: number; koersler: number } | null>(null);

  useEffect(() => {
    hentOpgaveForbrug(opgaveId)
      .then(setForbrug)
      .catch(() => setForbrug(null)); // prisen er en bonus — siden skal virke uden
  }, [opgaveId, opdatering]);

  if (!forbrug || forbrug.koersler === 0) return null;
  return (
    <p className="mt-1.5 font-mono text-xs text-daempet">
      Har kostet <Pris usd={forbrug.usd} /> · {forbrug.koersler} betalte kørsler
    </p>
  );
}
