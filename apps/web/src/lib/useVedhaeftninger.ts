// Billeder, brugeren er ved at vedhæfte. Hvert billede uploades, så snart
// det er valgt (så fejl ses med det samme), og kobles på, når opgaven
// eller kommentaren gemmes. Fjernes et billede igen, slettes det også
// på serveren; billeder, der aldrig blev gemt, ryddes op ved opstart.

import { useEffect, useRef, useState } from "react";
import { MAX_VEDHAEFTNINGER } from "../../../../packages/domain/src/domain/vedhaeftning";
import { sletVedhaeftning, uploadVedhaeftning } from "../api";
import { forberedBillede } from "./forberedBillede";

export interface VentendeBillede {
  lokalId: string;
  navn: string;
  /** Lokal forhåndsvisning — virker også, før uploaden er færdig */
  url: string;
  status: "uploader" | "klar" | "fejl";
  id: string | null;
  fejl: string | null;
}

export interface Vedhaeftninger {
  liste: VentendeBillede[];
  /** Id'erne på de færdige uploads — sendes med, når der gemmes */
  ider: string[];
  uploader: boolean;
  /** Plads til flere? */
  kanTilfoeje: boolean;
  tilfoej: (filer: File[]) => void;
  fjern: (lokalId: string) => void;
  /** Efter gem: listen tømmes, men billederne beholdes på serveren */
  nulstil: () => void;
}

/** @param optaget Billeder, der allerede hører til (ved redigering) */
export function useVedhaeftninger(optaget = 0): Vedhaeftninger {
  const [liste, setListe] = useState<VentendeBillede[]>([]);
  const urls = useRef(new Set<string>());
  const ledige = MAX_VEDHAEFTNINGER - optaget - liste.length;

  useEffect(() => {
    const aabne = urls.current;
    return () => aabne.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const opdater = (lokalId: string, felter: Partial<VentendeBillede>): void =>
    setListe((nu) => nu.map((b) => (b.lokalId === lokalId ? { ...b, ...felter } : b)));

  function tilfoej(filer: File[]): void {
    for (const fil of filer.slice(0, Math.max(0, ledige))) {
      const lokalId = crypto.randomUUID();
      const url = URL.createObjectURL(fil);
      urls.current.add(url);
      setListe((nu) => [...nu, { lokalId, navn: fil.name || "indsat billede", url, status: "uploader", id: null, fejl: null }]);
      forberedBillede(fil)
        .then(({ data, navn }) => uploadVedhaeftning(data, navn))
        .then((v) => opdater(lokalId, { status: "klar", id: v.id, navn: v.navn }))
        .catch((e: Error) => opdater(lokalId, { status: "fejl", fejl: e.message }));
    }
  }

  function fjern(lokalId: string): void {
    const billede = liste.find((b) => b.lokalId === lokalId);
    if (!billede) return;
    if (billede.id) void sletVedhaeftning(billede.id).catch(() => undefined);
    URL.revokeObjectURL(billede.url);
    urls.current.delete(billede.url);
    setListe((nu) => nu.filter((b) => b.lokalId !== lokalId));
  }

  function nulstil(): void {
    liste.forEach((b) => {
      URL.revokeObjectURL(b.url);
      urls.current.delete(b.url);
    });
    setListe([]);
  }

  return {
    liste,
    ider: liste.flatMap((b) => (b.status === "klar" && b.id ? [b.id] : [])),
    uploader: liste.some((b) => b.status === "uploader"),
    kanTilfoeje: ledige > 0,
    tilfoej,
    fjern,
    nulstil,
  };
}
