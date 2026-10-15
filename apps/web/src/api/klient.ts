// Fælles HTTP-fundament for alle API-kald.

export const API_URL = "http://localhost:3000";

export async function tjek<T>(svar: Response, handling: string): Promise<T> {
  if (!svar.ok) throw new Error(await fejlbesked(svar, handling));
  return svar.json();
}

/**
 * Serverens forklaring, hvis den har sendt én: enten vores egen `fejl`
 * eller Fastifys standard `message`. Ellers kun statuskoden.
 */
export async function fejlbesked(svar: Response, handling: string): Promise<string> {
  const krop = (await svar.json().catch(() => null)) as {
    fejl?: string;
    message?: string;
  } | null;
  const forklaring = krop?.fejl ?? krop?.message;
  return forklaring
    ? `${handling} fejlede: ${forklaring}`
    : `${handling} fejlede (${svar.status})`;
}
