// Billedfiler, der kan vises som billeder i filgennemsynet — fx
// teksturer i et spil eller ikoner i en app. Endelsen afgør typen;
// filens indhold sendes uændret, men med headere, der forhindrer, at
// den kan køre kode (SVG kan indeholde scripts).

import path from "node:path";

const BILLED_TYPER: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

/** Billeder, der OGSÅ er tekst — de får både billede og tekst-diff */
const TEKSTBILLEDER = new Set([".svg"]);

/** Største billede, der sendes til browseren */
export const MAX_BILLED_BYTES = 10 * 1024 * 1024;

/** MIME-typen for en billedfil, eller null hvis filen ikke er et billede */
export function billedType(sti: string): string | null {
  return BILLED_TYPER[path.posix.extname(sti).toLowerCase()] ?? null;
}

export function erTekstbillede(sti: string): boolean {
  return TEKSTBILLEDER.has(path.posix.extname(sti).toLowerCase());
}

/** Headere, så et billede kun kan vises — aldrig køre scripts eller hente andet */
export const BILLED_HEADERE = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-site",
  // Filen i en bestemt implementering ændrer sig aldrig (commit'en ligger fast)
  "Cache-Control": "private, max-age=3600",
};
