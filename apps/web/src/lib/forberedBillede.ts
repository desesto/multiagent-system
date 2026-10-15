// Gør et billede klar til upload, før det forlader browseren: kun de
// typer, AI-modellen kan se, og store billeder skaleres ned (modellen
// skalerer alligevel selv ned, så de ville bare koste upload og plads).
// GIF'er røres ikke — de kan være animerede.

import {
  MAX_BILLED_KANT_PX,
  MAX_VEDHAEFTNING_BYTES,
} from "../../../../packages/domain/src/domain/vedhaeftning";

const TILLADTE = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export async function forberedBillede(fil: File): Promise<{ data: Blob; navn: string }> {
  const navn = fil.name || `indsat-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`;
  if (!TILLADTE.includes(fil.type)) throw new Error(`${navn}: kun PNG, JPG, GIF og WebP kan vedhæftes`);
  const data = fil.type === "image/gif" ? fil : await skalerNed(fil);
  if (data.size > MAX_VEDHAEFTNING_BYTES) throw new Error(`${navn} fylder over 5 MB`);
  return { data, navn };
}

async function skalerNed(fil: File): Promise<Blob> {
  const billede = await createImageBitmap(fil);
  try {
    const stoerst = Math.max(billede.width, billede.height);
    if (stoerst <= MAX_BILLED_KANT_PX) return fil;
    const faktor = MAX_BILLED_KANT_PX / stoerst;
    const laerred = document.createElement("canvas");
    laerred.width = Math.round(billede.width * faktor);
    laerred.height = Math.round(billede.height * faktor);
    laerred.getContext("2d")?.drawImage(billede, 0, 0, laerred.width, laerred.height);
    const blob = await new Promise<Blob | null>((r) => laerred.toBlob(r, fil.type, 0.9));
    return blob ?? fil;
  } finally {
    billede.close();
  }
}
