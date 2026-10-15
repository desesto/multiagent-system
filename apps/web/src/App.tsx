import { Routes, Route } from "react-router-dom";
import { ProjektOversigt } from "./pages/ProjektOversigt";
import { ProjektSide } from "./pages/ProjektSide";
import { OpgaveDetalje } from "./pages/OpgaveDetalje";
import { Forbrug } from "./pages/Forbrug";
import { Indstillinger } from "./pages/Indstillinger";
import { Topbjaelke } from "./components/Topbjaelke";
import type { Renderable } from "./lib/renderable";


export default function App(): Renderable {
  return (
    <main className="mx-auto max-w-[680px] px-5 pb-24 pt-9">
      <Topbjaelke />
      <p className="text-[0.95rem] text-daempet">Projekter, opgaver og orkestrering</p>

      <Routes>
        <Route path="/" element={<ProjektOversigt />} />
        <Route path="/projekter/:id" element={<ProjektSide />} />
        <Route path="/opgaver/:id" element={<OpgaveDetalje />} />
        <Route path="/forbrug" element={<Forbrug />} />
        <Route path="/indstillinger" element={<Indstillinger />} />
        <Route
          path="*"
          element={<p className="mt-9 text-daempet">Siden findes ikke.</p>}
        />
      </Routes>
    </main>
  );
}
