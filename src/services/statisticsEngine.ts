import type { Tournament } from "@/types";

export interface StatItem {
  name: string;
  value: number | string;
}

export interface MatchSummary {
  match: string;
  total: number;
  diff: number;
}

export interface TournamentStats {
  played: number;
  pending: number;
  totalGoals: number;
  totalKills: number;
  avgGoals: string;
  avgKills: string;
  topScorer: StatItem | null;
  topWinner: StatItem | null;
  topKiller: StatItem | null;
  mostConceded: StatItem | null;
  mostLost: StatItem | null;
  bestEfficiency: StatItem | null;
  worstEfficiency: StatItem | null;
  highestScoringMatch: MatchSummary | null;
  biggestMarginMatch: MatchSummary | null;
}

function getScoreValue(score: any, side: "A" | "B") {
  if (!score) return 0;
  if (side === "A") return score.golesA ?? score.puntosA ?? score.setsA ?? score.killsA ?? score.posicionA ?? 0;
  return score.golesB ?? score.puntosB ?? score.setsB ?? score.killsB ?? score.posicionB ?? 0;
}

function makeMatchLabel(m: any, aName: string, bName: string) {
  const scoreA = getScoreValue(m.score, "A");
  const scoreB = getScoreValue(m.score, "B");
  return `[${m.stage}] ${aName} ${scoreA} - ${scoreB} ${bName}`;
}

export function computeStats(t: Tournament): TournamentStats {
  const confirmed = t.matches.filter((m) => m.status === "confirmado");
  const pending = t.matches.filter((m) => m.status !== "confirmado");
  const cfg = t.league ?? { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };

  let totalGoals = 0;
  let totalKills = 0;
  const metrics = new Map<string, { GF: number; GC: number; wins: number; draws: number; losses: number; points: number; PJ: number }>();
  t.competitors.forEach((c) => metrics.set(c.id, { GF: 0, GC: 0, wins: 0, draws: 0, losses: 0, points: 0, PJ: 0 }));

  let highestScoringMatch: MatchSummary | null = null;
  let biggestMarginMatch: MatchSummary | null = null;

  confirmed.forEach((m) => {
    const aName = t.competitors.find((c) => c.id === m.competitorA)?.name ?? "BYE";
    const bName = t.competitors.find((c) => c.id === m.competitorB)?.name ?? "BYE";
    const scoreA = getScoreValue(m.score, "A");
    const scoreB = getScoreValue(m.score, "B");
    const total = scoreA + scoreB;
    const diff = Math.abs(scoreA - scoreB);

    totalGoals += (m.score?.golesA ?? 0) + (m.score?.golesB ?? 0);
    totalKills += (m.score?.killsA ?? 0) + (m.score?.killsB ?? 0);

    const aStats = m.competitorA ? metrics.get(m.competitorA) : undefined;
    const bStats = m.competitorB ? metrics.get(m.competitorB) : undefined;
    if (aStats && bStats) {
      aStats.PJ += 1;
      bStats.PJ += 1;
      aStats.GF += scoreA;
      aStats.GC += scoreB;
      bStats.GF += scoreB;
      bStats.GC += scoreA;
      if (m.winnerId === m.competitorA) {
        aStats.wins += 1;
        bStats.losses += 1;
        aStats.points += cfg.pointsWin;
        bStats.points += cfg.pointsLoss;
      } else if (m.winnerId === m.competitorB) {
        bStats.wins += 1;
        aStats.losses += 1;
        bStats.points += cfg.pointsWin;
        aStats.points += cfg.pointsLoss;
      } else {
        aStats.draws += 1;
        bStats.draws += 1;
        aStats.points += cfg.pointsDraw;
        bStats.points += cfg.pointsDraw;
      }
    }

    const label = makeMatchLabel(m, aName, bName);
    if (!highestScoringMatch || total > highestScoringMatch.total) {
      highestScoringMatch = { match: label, total, diff };
    }
    if (!biggestMarginMatch || diff > biggestMarginMatch.diff) {
      biggestMarginMatch = { match: label, total, diff };
    }
  });

  const name = (id?: string) => t.competitors.find((c) => c.id === id)?.name ?? "—";

  const sortEntry = (map: Map<string, number>, desc = true) => {
    const entries = [...map.entries()];
    if (!entries.length) return null;
    entries.sort((a, b) => (desc ? b[1] - a[1] : a[1] - b[1]));
    return entries[0];
  };

  const topScorerEntry = sortEntry(new Map([...metrics.entries()].map(([id, stats]) => [id, stats.GF])));
  const topWinnerEntry = sortEntry(new Map([...metrics.entries()].map(([id, stats]) => [id, stats.wins])));
  const killTotals = new Map<string, number>();
  t.competitors.forEach((c) => {
    const killsA = t.matches.filter((m) => m.competitorA === c.id).reduce((sum, m) => sum + (m.score?.killsA ?? 0), 0);
    const killsB = t.matches.filter((m) => m.competitorB === c.id).reduce((sum, m) => sum + (m.score?.killsB ?? 0), 0);
    killTotals.set(c.id, killsA + killsB);
  });
  const topKillerEntry = sortEntry(killTotals);

  const mostConcededEntry = sortEntry(new Map([...metrics.entries()].map(([id, stats]) => [id, stats.GC])));
  const mostLostEntry = sortEntry(new Map([...metrics.entries()].map(([id, stats]) => [id, stats.losses])));

  const efficiencyMap = new Map<string, number>();
  metrics.forEach((stats, id) => {
    const possible = stats.PJ * cfg.pointsWin;
    efficiencyMap.set(id, possible > 0 ? stats.points / possible : 0);
  });
  const bestEfficiencyEntry = sortEntry(efficiencyMap);
  const worstEfficiencyEntry = sortEntry(efficiencyMap, false);

  return {
    played: confirmed.length,
    pending: pending.length,
    totalGoals,
    totalKills,
    avgGoals: confirmed.length ? (totalGoals / confirmed.length).toFixed(2) : "0",
    avgKills: totalKills && confirmed.length ? (totalKills / confirmed.length).toFixed(2) : "0",
    topScorer: topScorerEntry ? { name: name(topScorerEntry[0]), value: topScorerEntry[1] } : null,
    topWinner: topWinnerEntry ? { name: name(topWinnerEntry[0]), value: topWinnerEntry[1] } : null,
    topKiller: topKillerEntry ? { name: name(topKillerEntry[0]), value: topKillerEntry[1] } : null,
    mostConceded: mostConcededEntry ? { name: name(mostConcededEntry[0]), value: mostConcededEntry[1] } : null,
    mostLost: mostLostEntry ? { name: name(mostLostEntry[0]), value: mostLostEntry[1] } : null,
    bestEfficiency: bestEfficiencyEntry ? { name: name(bestEfficiencyEntry[0]), value: `${(bestEfficiencyEntry[1] * 100).toFixed(1)}%` } : null,
    worstEfficiency: worstEfficiencyEntry ? { name: name(worstEfficiencyEntry[0]), value: `${(worstEfficiencyEntry[1] * 100).toFixed(1)}%` } : null,
    highestScoringMatch,
    biggestMarginMatch,
  };
}
