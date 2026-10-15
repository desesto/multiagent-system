// Fælles returtype for komponenter — så alle komponenter har en
// eksplicit returtype, også dem der kan returnere null.

import type { ReactNode } from "react";

export type Renderable = ReactNode;
