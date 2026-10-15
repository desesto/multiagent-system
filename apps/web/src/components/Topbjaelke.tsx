// Topbjælken med titel og faner. Den bliver hængende i toppen, når man
// ruller ned, så man altid kan navigere. Baggrunden er sidens egen (også
// Platins metalbånd, se .topbjaelke i tema.css), så den glider ubemærket
// ind i siden; først når der er rullet, får den en kant og en skygge.

import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "../lib/cn";
import type { Renderable } from "../lib/renderable";
import { useRullet } from "../lib/useRullet";

export function Topbjaelke(): Renderable {
  const { pathname } = useLocation();
  const rullet = useRullet();
  // "Projekter" er aktiv i hele hierarkiet: oversigt, projekt og opgave
  const iProjekter = pathname === "/" || pathname.startsWith("/projekter") || pathname.startsWith("/opgaver");
  const faner = [
    { til: "/", tekst: "Projekter", aktiv: iProjekter },
    { til: "/forbrug", tekst: "Forbrug", aktiv: pathname.startsWith("/forbrug") },
    { til: "/indstillinger", tekst: "Indstillinger", aktiv: pathname.startsWith("/indstillinger") },
  ];

  return (
    // z-[5]: over sidens paneler, men under popups (z-10)
    <header
      className={cn(
        "topbjaelke sticky top-0 z-[5] -mx-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-5 py-3",
        rullet ? "border-kant shadow-[0_6px_16px_rgb(0_0_0/0.28)]" : "border-transparent"
      )}
    >
      <h1 className="font-jetbrains-mono text-[2.1rem] leading-tight font-bold tracking-[-0.02em]">
        <Link to="/" className="pointer-fine:hover:text-accent">
          Multiagent
        </Link>
      </h1>
      <nav aria-label="Hovedmenu" className="flex gap-4 text-[0.9rem]">
        {faner.map((l) => (
          <NavLink
            key={l.til}
            to={l.til}
            className={cn(l.aktiv ? "font-semibold text-tekst" : "text-daempet pointer-fine:hover:text-tekst")}
          >
            {l.tekst}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
