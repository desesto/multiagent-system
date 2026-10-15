// Brødkrummer øverst på en opgave: Projekter › projektnavn.
// Henter selv projektets navn; fejler det, vises bare et link til oversigten.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hentProjekt } from "../../api";
import type { Renderable } from "../../lib/renderable";

const LINK = "text-daempet pointer-fine:hover:text-tekst";

export function ProjektSti({ projektId }: { projektId: string | null }): Renderable {
  const [navn, setNavn] = useState<string | null>(null);

  useEffect(() => {
    if (!projektId) return;
    hentProjekt(projektId)
      .then((p) => setNavn(p.navn))
      .catch(() => setNavn(null));
  }, [projektId]);

  return (
    <nav aria-label="Placering" className="mb-5 flex items-center gap-1.5 text-[0.9rem]">
      <Link to="/" className={LINK}>
        Projekter
      </Link>
      {projektId && navn && (
        <>
          <span className="text-daempet">›</span>
          <Link to={`/projekter/${projektId}`} className={LINK}>
            {navn}
          </Link>
        </>
      )}
    </nav>
  );
}
