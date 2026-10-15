// Ikoner som komponenter. Farven styres udefra med fill-current, så
// ikonet arver knappens tekstfarve — også ved hover og i fare-varianten.
// Ikonerne er dekorative (knappen har altid tekst), derfor aria-hidden.

import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";

function Ikon({ sti, className }: { sti: string; className?: string }): Renderable {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-4 shrink-0 fill-current", className)}
    >
      <path d={sti} />
    </svg>
  );
}

export function IkonSkraldespand(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  );
}

export function IkonBlyant(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  );
}

export function IkonFortryd(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"
    />
  );
}

export function IkonKode(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
    />
  );
}

export function IkonPlus(props: { className?: string }): Renderable {
  return <Ikon {...props} sti="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />;
}

export function IkonLuk(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  );
}

export function IkonFlueben(props: { className?: string }): Renderable {
  return <Ikon {...props} sti="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />;
}

export function IkonGenindlaes(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
    />
  );
}

export function IkonPil(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
    />
  );
}

export function IkonMappe(props: { className?: string }): Renderable {
  return (
    <Ikon
      {...props}
      sti="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
    />
  );
}
