// Tom tilstand — ikke en fejl, men en anledning til at vejlede.

import type { Renderable } from "../../lib/renderable";

export function TomOpgaveListe(): Renderable {
  return (
    <div className="rounded-[10px] border border-dashed border-kant px-5 py-8 text-center">
      <h3 className="mb-2 font-semibold">Ingen opgaver i projektet endnu</h3>
      <p className="text-[0.9rem] text-daempet">
        Opret din første opgave i formularen ovenfor — så analyserer
        agenterne den og fremlægger retninger, du kan vælge imellem.
      </p>
    </div>
  );
}
