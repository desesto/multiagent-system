// Er siden rullet ned? Bruges af topbjælken til at vise en kant og en
// skygge, når indholdet glider ind under den.

import { useEffect, useState } from "react";

export function useRullet(graense = 8): boolean {
  const [rullet, setRullet] = useState(false);
  useEffect(() => {
    const tjek = (): void => setRullet(window.scrollY > graense);
    tjek();
    window.addEventListener("scroll", tjek, { passive: true });
    return () => window.removeEventListener("scroll", tjek);
  }, [graense]);
  return rullet;
}
