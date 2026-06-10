import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTournamentStore } from "@/store/useTournamentStore";
import type { GameType } from "@/types";

const GAME_LABELS: Record<GameType, string> = {
  futbol: "Fútbol",
  tenis: "Tenis",
  shooter: "Shooter",
  carreras: "Carreras",
  otro: "Otro",
};

export const Route = createFileRoute("/torneos")({
  head: () => ({ meta: [{ title: "Mis torneos" }] }),
  component: Page,
});

function Page() {
  const list = useTournamentStore((s) => s.tournaments);
  const remove = useTournamentStore((s) => s.remove);
  const duplicate = useTournamentStore((s) => s.duplicate);
  const nav = useNavigate();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Inicio</Link>
          <h1 className="font-display mt-2 text-3xl uppercase neon-text">Mis torneos</h1>
        </div>
        <Link to="/nuevo" className="btn-neon rounded-lg bg-primary px-4 py-2 font-display text-sm uppercase tracking-widest">+ Nuevo</Link>
      </div>

      {list.length === 0 && <p className="mt-10 text-center text-muted-foreground">Aún no creaste torneos. <Link to="/nuevo" className="text-primary underline">Crear el primero</Link></p>}

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {list.map((t) => (
          <div key={t.id} className="glass flex items-center justify-between gap-3 rounded-xl p-4">
            <Link to="/torneo/$id" params={{ id: t.id }} className="flex-1 min-w-0">
              <p className="font-display text-lg uppercase">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.format.replace("_"," + ")} · {t.competitors.length} participantes · {new Date(t.createdAt).toLocaleDateString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">Videojuego: {GAME_LABELS[t.game]}</p>
              {t.finished && <span className="mt-1 inline-block rounded-full bg-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">Finalizado 🏆</span>}
            </Link>
            <div className="flex flex-col gap-1">
              <Link to="/torneo/$id" params={{ id: t.id }}
                className="rounded border border-primary/60 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary hover:bg-primary/20">
                Ingresar
              </Link>
              <button onClick={() => { const id = duplicate(t.id); if (id) nav({ to: "/torneo/$id", params: { id } }); }}
                className="rounded border border-border bg-secondary/40 px-2 py-1 text-xs">Duplicar</button>
              <button onClick={() => { if (confirm("¿Eliminar?")) remove(t.id); }} className="rounded border border-destructive/50 bg-destructive/20 px-2 py-1 text-xs text-destructive">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}