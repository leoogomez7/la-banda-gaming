import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Particles } from "@/components/Particles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "La Banda Gaming — Simulador de torneos" },
      { name: "description", content: "Crea torneos, registra resultados y comparte la gloria. Liga, eliminatoria, grupos y estadísticas avanzadas." },
      { property: "og:title", content: "La Banda Gaming" },
      { property: "og:description", content: "Simulador profesional de torneos gaming entre amigos." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Particles count={40} />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-xs uppercase tracking-[0.5em] text-primary"
        >
          PlayStation · Xbox · PC
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
          className="font-display mt-4 text-5xl uppercase tracking-tight neon-text md:text-7xl"
        >
          La Banda<br /><span className="text-primary">Gaming</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
          Crea torneos, registra resultados y comparte la gloria.
          <br />Simulador profesional de torneos gaming entre amigos.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/nuevo"
            className="btn-neon rounded-xl bg-primary px-8 py-4 font-display text-base uppercase tracking-widest text-primary-foreground">
            ▶ Empezar torneo
          </Link>
          <Link to="/torneos"
            className="rounded-xl border border-border bg-secondary/40 px-6 py-4 font-display text-sm uppercase tracking-widest">
            Mis torneos
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-20 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { i: "🏆", t: "4 formatos", d: "Liga, eliminatoria, grupos…" },
            { i: "⚡", t: "Tiempo real", d: "Actualización instantánea" },
            { i: "📊", t: "Estadísticas", d: "Goles, kills, MVPs" },
            { i: "📤", t: "Compartí", d: "PDF, PNG, QR y WhatsApp" },
          ].map((c) => (
            <div key={c.t} className="glass rounded-xl p-4 text-left">
              <div className="text-2xl">{c.i}</div>
              <p className="font-display mt-2 text-sm uppercase tracking-wider">{c.t}</p>
              <p className="text-xs text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
