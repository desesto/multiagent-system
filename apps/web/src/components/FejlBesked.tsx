// Fejlbesked — én komponent i stedet for tre kopier af samme klasser.

import type { Renderable } from "../lib/renderable";

export function FejlBesked({ besked }: { besked: string }): Renderable {
  return (
    <p className="mt-4 rounded-md border border-fare px-3.5 py-2.5 text-[0.9rem] text-farelys">
      {besked}
    </p>
  );
}
