import type { Tournament } from "@/types";
import { computeStats } from "@/services/statisticsEngine";

export function StatisticsPanel({ tournament }: { tournament: Tournament }) {
  const s = computeStats(tournament);
  const cards = [
    { label: "Partidos jugados", value: s.played },
    { label: "Pendientes", value: s.pending },
    { label: "Goles totales", value: s.totalGoals },
    { label: "Promedio goles", value: s.avgGoals },
    ...(s.totalKills > 0 ? [{ label: "Kills totales", value: s.totalKills }, { label: "Promedio kills", value: s.avgKills }] : []),
    ...(s.mostConceded ? [{ label: "Más goles recibidos", value: `${s.mostConceded.name} (${s.mostConceded.value})` }] : []),
    ...(s.mostLost ? [{ label: "Más perdidos", value: `${s.mostLost.name} (${s.mostLost.value})` }] : []),
    ...(s.bestEfficiency ? [{ label: "Mejor efectividad", value: `${s.bestEfficiency.name} ${s.bestEfficiency.value}` }] : []),
    ...(s.worstEfficiency ? [{ label: "Peor efectividad", value: `${s.worstEfficiency.name} ${s.worstEfficiency.value}` }] : []),
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="font-display mt-1 text-3xl neon-text">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {s.topScorer && <Top title="🥇 Máximo goleador" name={s.topScorer.name} value={s.topScorer.value} suffix="goles" />}
        {s.topWinner && <Top title="🏆 Máximo ganador" name={s.topWinner.name} value={s.topWinner.value} suffix="vict." />}
        {s.topKiller && s.totalKills > 0 && <Top title="💀 Top killer" name={s.topKiller.name} value={s.topKiller.value} suffix="kills" />}
        {s.highestScoringMatch && <Top title="⚡ Resultado más goleador" name={s.highestScoringMatch.match} value={s.highestScoringMatch.total} suffix="goles" />}
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
