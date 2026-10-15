// cn(): sammensæt klassenavne betinget OG løs Tailwind-konflikter.
// clsx håndterer betingelser ({ "border-accent": valgt }), og
// tailwind-merge sørger for, at en className udefra vinder over
// basisklasser (cn("px-3", "px-5") → "px-5").

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...klasser: ClassValue[]): string {
  return twMerge(clsx(klasser));
}
