// Delte byggesten for ruterne.

export const UUID_MOENSTER =
  "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

export const idParamSkema = {
  type: "object",
  properties: { id: { type: "string", pattern: UUID_MOENSTER } },
} as const;
