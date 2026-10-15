// Kontrakter for før/efter-billeder: persistens og selve fotograferingen.

import type { Skaermbillede } from "../domain/skaermbillede";

export type NytSkaermbillede = Omit<Skaermbillede, "id" | "oprettetTidspunkt"> & {
  /** PNG-billedet */
  png: Uint8Array;
};

export interface ISkaermbilledRepository {
  gem(nyt: NytSkaermbillede): Promise<Skaermbillede>;
  /** Kun metadata — billederne hentes enkeltvis med hentPng */
  hentForImplementering(implementeringId: string): Promise<Skaermbillede[]>;
  hentPng(id: string): Promise<Uint8Array | null>;
}

/**
 * Tager før/efter-billeder af en færdig implementering. Kører i
 * baggrunden og holder selv implementeringens billedStatus opdateret.
 * Fejler fotograferingen, påvirker det ALDRIG selve implementeringen.
 */
export interface IFoerEfterFotograf {
  tag(implementeringId: string): Promise<void>;
  /** Ved opstart: gør afbrudte fotograferinger færdige som fejlet og rydder op */
  ryddOpEfterGenstart(): Promise<void>;
}
