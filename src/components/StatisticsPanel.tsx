import type { Tournament } from "@/types";
import { computeStats } from "@/services/statisticsEngine";

export function StatisticsPanel({ tournament }: { tournament: Tournament }) {
  const s = computeStats(tournament);
  const commonCards = [
    { label: "Partidos jugados", value: s.played },
    { label: "Pendientes", value: s.pending },
  ];

  const gameCards =
    tournament.game === "futbol"
      ? [
          { label: "Goles totales", value: s.totalGoals },
          { label: "Promedio goles", value: s.avgGoals },
        ]
      : tournament.game === "tenis"
      ? [
          { label: "Sets totales", value: s.totalSets },
          { label: "Promedio sets", value: s.avgSets },
          { label: "Games totales", value: s.totalGames },
          { label: "Promedio games", value: s.avgGames },
          { label: "Puntos totales", value: s.totalPoints },
          { label: "Promedio puntos", value: s.avgPoints },
        ]
      : tournament.game === "shooter"
      ? [
          { label: "Derribos totales", value: s.totalKills },
          { label: "Promedio derribos", value: s.avgKills },
        ]
      : tournament.game === "carreras"
      ? [
          { label: "Puntos totales", value: s.totalPoints },
          { label: "Promedio posición", value: s.avgPosition },
        ]
      : [
          { label: "Puntos totales", value: s.totalPoints },
          { label: "Promedio puntos", value: s.avgPoints },
        ];

  const cards = [
    ...commonCards,
    ...gameCards,
    ...(tournament.game === "futbol" || tournament.game === "tenis" || tournament.game === "shooter"
      ? s.mostConceded
        ? [{ label: tournament.game === "futbol" ? "Más goles recibidos" : "Más puntos en contra", value: `${s.mostConceded.name} (${s.mostConceded.value})` }]
        : []
      : []),
    ...(s.mostLost ? [{ label: "Más perdidos", value: `${s.mostLost.name} (${s.mostLost.value})` }] : []),
    ...(s.bestEfficiency ? [{ label: "Mejor efectividad", value: `${s.bestEfficiency.name} ${s.bestEfficiency.value}` }] : []),
    ...(s.worstEfficiency ? [{ label: "Peor efectividad", value: `${s.worstEfficiency.name} ${s.worstEfficiency.value}` }] : []),
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 overflow-hidden">
        {cards.map((c) => (
          <div key={c.label} className="glass min-w-0 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="font-display mt-1 text-3xl neon-text">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {s.topScorer && (
          <Top
            title={
              tournament.game === "futbol"
                ? "🥇 Máximo goleador"
                : tournament.game === "tenis"
                ? "🥇 Más sets ganados"
                : tournament.game === "shooter"
                ? "🥇 Máximo derribos"
                : tournament.game === "carreras"
                ? "🥇 Mejor puntaje"
                : "🥇 Mejor rendimiento"
            }
            name={s.topScorer.name}
            value={s.topScorer.value}
            suffix={
              tournament.game === "futbol"
                ? "goles"
                : tournament.game === "tenis"
                ? "sets"
                : tournament.game === "shooter"
                ? "derribos"
                : tournament.game === "carreras"
                ? "pts"
                : "pts"
            }
          />
        )}
        {s.topWinner && <Top title="🏆 Máximo ganador" name={s.topWinner.name} value={s.topWinner.value} suffix="vict." />}
        {s.topKiller && s.totalKills > 0 && <Top title="💀 Top derribador" name={s.topKiller.name} value={s.topKiller.value} suffix="derribos" />}
        {s.highestScoringMatch && (
          <Top
            title={
              tournament.game === "futbol"
                ? "⚡ Resultado más goleador"
                : tournament.game === "tenis"
                ? "⚡ Partidos con más sets"
                : tournament.game === "shooter"
                ? "⚡ Combate con más derribos"
                : tournament.game === "carreras"
                ? "⚡ Carrera con más puntos"
                : "⚡ Resultado más alto"
            }
            name={s.highestScoringMatch.match}
            value={s.highestScoringMatch.total}
            suffix={
              tournament.game === "futbol"
                ? "goles"
                : tournament.game === "tenis"
                ? "sets"
                : tournament.game === "shooter"
                ? "derribos"
                : tournament.game === "carreras"
                ? "pts"
                : "pts"
            }
          />
        )}
        {s.biggestMarginMatch && <Top title="📈 Mayor diferencia" name={s.biggestMarginMatch.match} value={s.biggestMarginMatch.diff} suffix="dif." />}
      </div>
    </div>
  );
}

function Top({ title, name, value, suffix }: { title: string; name: string; value: number; suffix: string }) {
  return (
    <div className="glass neon-border rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg font-bold">{name}</p>
      <p className="font-display text-primary">{value} <span className="text-xs text-muted-foreground">{suffix}</span></p>
    </div>
  );
}
