// Genbrugelige knapper: ÉN basekomponent med varianter, navngivne
// handlingsknapper ovenpå. Hover kun på enheder med mus
// (pointer-fine:), så touch-skærme ikke får "klæbende" hover.

import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";
import { IkonBlyant, IkonFlueben, IkonFortryd, IkonGenindlaes, IkonKode, IkonSkraldespand } from "./Ikoner";

type Variant = "primaer" | "sekundaer" | "fare";
type KnapProps = ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANTER: Record<Variant, string> = {
  primaer: "bg-accent border-accent text-paa-accent",
  sekundaer: "bg-kort border-kant text-tekst pointer-fine:hover:border-daempet",
  fare: "bg-kort border-fare text-farelys pointer-fine:hover:bg-fare/15",
};

export function Knap({
  variant = "sekundaer",
  className,
  ...rest
}: KnapProps & { variant?: Variant }): Renderable {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-sm font-semibold cursor-pointer",
        "disabled:cursor-default disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
        VARIANTER[variant],
        className
      )}
      {...rest}
    />
  );
}

export function SletKnap(props: KnapProps): Renderable {
  return (
    <Knap variant="fare" {...props}>
      Slet opgave
      <IkonSkraldespand />
    </Knap>
  );
}

export function RedigerKnap({ aktiv, ...rest }: KnapProps & { aktiv?: boolean }): Renderable {
  return (
    <Knap variant="sekundaer" {...rest}>
      {aktiv ? "Annullér redigering" : "Redigér"}
      {!aktiv && <IkonBlyant />}
    </Knap>
  );
}

export function FortrydKnap(props: KnapProps): Renderable {
  return (
    <Knap variant="sekundaer" {...props}>
      Fortryd retning
      <IkonFortryd />
    </Knap>
  );
}

export function ImplementerKnap({ starter, ...rest }: KnapProps & { starter?: boolean }): Renderable {
  return (
    <Knap variant="primaer" disabled={starter} {...rest}>
      {starter ? "Starter…" : "Implementér"}
      <IkonKode />
    </Knap>
  );
}

export function AfslutKnap(props: KnapProps): Renderable {
  return (
    <Knap variant="primaer" {...props}>
      Markér som afsluttet
      <IkonFlueben />
    </Knap>
  );
}

export function GenaabnKnap(props: KnapProps): Renderable {
  return (
    <Knap variant="sekundaer" {...props}>
      Genåbn opgave
      <IkonFortryd />
    </Knap>
  );
}

export function ReevaluerKnap({ vurderer, ...rest }: KnapProps & { vurderer?: boolean }): Renderable {
  return (
    <Knap variant="sekundaer" {...rest}>
      {vurderer ? "Vurderer…" : "Bed om ny vurdering"}
      <IkonGenindlaes />
    </Knap>
  );
}
