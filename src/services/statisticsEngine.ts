import type { Tournament } from "@/types";

export function computeStats(t: Tournament) {
  const confirmed = t.matches.filter((m) => m.status === "confirmado");
  const pending = t.matches.filter((m) => m.status !== "confirmado");
  let totalGoals = 0, totalKills = 0;
  const winsByCompetitor = new Map<string, number>();
  const goalsByCompetitor = new Map<string, number>();
  const killsByCompetitor = new Map<string, number>();
  confirmed.forEach((m) => {
    const s: any = m.score ?? {};
    const gA = s.golesA ?? 0, gB = s.golesB ?? 0;
    const kA = s.killsA ?? 0, kB = s.killsB ?? 0;
    totalGoals += gA + gB; totalKills += kA + kB;
    if (m.competitorA) {
      goalsByCompetitor.set(m.competitorA, (goalsByCompetitor.get(m.competitorA) ?? 0) + gA);
      killsByCompetitor.set(m.competitorA, (killsByCompetitor.get(m.competitorA) ?? 0) + kA);
    }
    if (m.competitorB) {
      goalsByCompetitor.set(m.competitorB, (goalsByCompetitor.get(m.competitorB) ?? 0) + gB);
      killsByCompetitor.set(m.competitorB, (killsByCompetitor.get(m.competitorB) ?? 0) + kB);
    }
    if (m.winnerId) winsByCompetitor.set(m.winnerId, (winsByCompetitor.get(m.winnerId) ?? 0) + 1);
  });

  const topBy = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  const name = (id?: string) => t.competitors.find((c) => c.id === id)?.name ?? "—";
  const topScorer = topBy(goalsByCompetitor);
  const topWinner = topBy(winsByCompetitor);
  const topKiller = topBy(killsByCompetitor);
  return {
    played: confirmed.length,
    pending: pending.length,
    totalGoals,
    totalKills,
    avgGoals: confirmed.length ? (totalGoals / confirmed.length).toFixed(2) : "0",
    avgKills: confirmed.length ? (totalKills / confirmed.length).toFixed(2) : "0",
    topScorer: topScorer ? { name: name(topScorer[0]), value: topScorer[1] } : null,
    topWinner: topWinner ? { name: name(topWinner[0]), value: topWinner[1] } : null,
    topKiller: topKiller ? { name: name(topKiller[0]), value: topKiller[1] } : null,
  };
}
