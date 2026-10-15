// Optimistisk UI efter læseliste-princippet: den optimistiske værdi er
// den ØNSKEDE SLUTTILSTAND — ikke handlingen. Ryd-knappen ønskede en tom
// liste; slet-knappen ønskede listen uden artiklen. Her ønsker "opret"
// listen MED den nye opgave, og "vælg" ønsker listen, hvor valget er truffet.
//
// Mens handlingen kører, vises ønsket med det samme. Lykkes den, erstattes
// ønsket af den rigtige tilstand. Fejler den, falder React selv tilbage
// til den oprindelige tilstand — ingen oprydningskode nødvendig.
//
// Én bevidst forskel fra læselisten: ønsket er en FUNKTION af den
// nuværende tilstand, ikke en fast værdi. Oprettelse tager op til 30 sek.,
// så to handlinger kan overlappe. Med faste værdier ville den sidste
// overskrive den første; med funktioner lægger React ønskerne ovenpå
// hinanden i rækkefølge.

import { startTransition, useOptimistic } from "react";

/** Ønsket sluttilstand, udtrykt ud fra den tilstand, der vises lige nu */
export type Oenske<T> = (nu: T) => T;

/**
 * @param tilstand Den rigtige tilstand (fra useState)
 * @returns [det der skal vises, en funktion der kører en handling optimistisk]
 */
export function useOptimistisk<T>(
  tilstand: T
): [T, (oenske: Oenske<T>, handling: () => Promise<() => void>) => Promise<void>] {
  const [vist, saetOenske] = useOptimistic(tilstand, (nu: T, oenske: Oenske<T>) => oenske(nu));

  /**
   * Viser ønsket med det samme og kører `handling`. Handlingen returnerer
   * en "commit"-funktion, der sætter den rigtige tilstand, når serveren
   * har svaret. Promiset afvises ved fejl, så kalderen kan vise fejlen.
   */
  function koerOptimistisk(
    oenske: Oenske<T>,
    handling: () => Promise<() => void>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        saetOenske(oenske);
        try {
          const commit = await handling();
          // Opdateringer efter await skal i en ny transition, så den
          // rigtige tilstand og ønsket skifter i samme render
          startTransition(commit);
          resolve();
        } catch (fejl) {
          reject(fejl);
        }
      });
    });
  }

  return [vist, koerOptimistisk];
}
