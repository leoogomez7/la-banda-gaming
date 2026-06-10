import type { ScoreData, Tournament } from "@/types";

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
  totalSets: number;
  totalGames: number;
  totalPoints: number;
  totalPositions: number;
  avgGoals: string;
  avgKills: string;
  avgSets: string;
  avgGames: string;
  avgPoints: string;
  avgPosition: string;
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

function getScoreValue(score: ScoreData | undefined, side: "A" | "B") {
  if (!score) return 0;
  if ("golesA" in score) return side === "A" ? score.golesA : score.golesB;
  if ("setsA" in score) return side === "A" ? score.setsA : score.setsB;
  if ("killsA" in score) return side === "A" ? score.killsA : score.killsB;
  if ("posicionA" in score) return side === "A" ? score.posicionA : score.posicionB;
  if ("puntosA" in score) return side === "A" ? score.puntosA ?? 0 : score.puntosB ?? 0;
  return 0;
}

function getPrimaryStatValue(score: ScoreData | undefined, game: string, side: "A" | "B") {
  if (!score) return 0;
  if (game === "futbol" && "golesA" in score) return side === "A" ? score.golesA : score.golesB;
  if (game === "tenis" && "setsA" in score) return side === "A" ? score.setsA : score.setsB;
  if (game === "shooter" && "killsA" in score) return side === "A" ? score.killsA : score.killsB;
  if (game === "carreras") return 0;
  if ("puntosA" in score) return side === "A" ? score.puntosA ?? 0 : score.puntosB ?? 0;
  return 0;
}

function makeMatchLabel(m: any, aName: string, bName: string) {
  const scoreA = getScoreValue(m.score, "A");
  const scoreB = getScoreValue(m.score, "B");
  return `[${m.stage}] ${aName} ${scoreA} - ${scoreB} ${bName}`;
}

function parseTennisDetail(detail?: string) {
  const result = { gamesA: 0, gamesB: 0, pointsA: 0, pointsB: 0 };
  if (!detail) return result;

  const scorePairs = [...detail.matchAll(/(\d+)\s*-\s*(\d+)/g)];
  scorePairs.forEach((match) => {
    result.gamesA += Number(match[1]);
    result.gamesB += Number(match[2]);
  });

  const tokens = [...detail.matchAll(/40[+-]?|30|15|0/gi)].map((m) => m[0].toUpperCase());
  const scoreMap: Record<string, number> = { "0": 0, "15": 1, "30": 2, "40-": 3, "40+": 4 };
  if (tokens.length >= 2) {
    for (let i = 0; i + 1 < tokens.length; i += 2) {
      result.pointsA += scoreMap[tokens[i]] ?? 0;
      result.pointsB += scoreMap[tokens[i + 1]] ?? 0;
    }
  }

  if (result.pointsA === 0 && result.pointsB === 0 && (result.gamesA || result.gamesB)) {
    result.pointsA = result.gamesA;
    result.pointsB = result.gamesB;
  }

  return result;
}

export function computeStats(t: Tournament): TournamentStats {
  const confirmed = t.matches.filter((m) => m.status === "confirmado");
  const pending = t.matches.filter((m) => m.status !== "confirmado");
  const cfg = t.league ?? { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };

  let totalGoals = 0;
  let totalKills = 0;
  let totalSets = 0;
  let totalGames = 0;
  let totalPoints = 0;
  let totalPositions = 0;
  const metrics = new Map<
    string,
    {
      GF: number;
      GC: number;
      wins: number;
      draws: number;
      losses: number;
      points: number;
      PJ: number;
      kills: number;
      sets: number;
      games: number;
      racePoints: number;
      totalPositions: number;
    }
  >();
  t.competitors.forEach((c) =>
    metrics.set(c.id, {
      GF: 0,
      GC: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      PJ: 0,
      kills: 0,
      sets: 0,
      games: 0,
      racePoints: 0,
      totalPositions: 0,
    })
  );

  let highestScoringMatch: MatchSummary | null = null;
  let biggestMarginMatch: MatchSummary | null = null;

  confirmed.forEach((m) => {
    const aName = t.competitors.find((c) => c.id === m.competitorA)?.name ?? "BYE";
    const bName = t.competitors.find((c) => c.id === m.competitorB)?.name ?? "BYE";
    const scoreA = getScoreValue(m.score, "A");
    const scoreB = getScoreValue(m.score, "B");
    const total = scoreA + scoreB;
    const diff = Math.abs(scoreA - scoreB);

    const explicitPointsA = m.score && "puntosA" in m.score ? m.score.puntosA ?? 0 : 0;
    const explicitPointsB = m.score && "puntosB" in m.score ? m.score.puntosB ?? 0 : 0;
    const detail = m.score && "detalle" in m.score ? parseTennisDetail(m.score.detalle) : { gamesA: 0, gamesB: 0, pointsA: 0, pointsB: 0 };
    const tennisPointsA = m.score && "puntosA" in m.score ? m.score.puntosA ?? detail.pointsA ?? 0 : detail.pointsA ?? 0;
    const tennisPointsB = m.score && "puntosB" in m.score ? m.score.puntosB ?? detail.pointsB ?? 0 : detail.pointsB ?? 0;
    totalGoals += m.score && "golesA" in m.score ? (m.score.golesA ?? 0) + (m.score.golesB ?? 0) : 0;
    totalKills += m.score && "killsA" in m.score ? (m.score.killsA ?? 0) + (m.score.killsB ?? 0) : 0;
    totalSets += m.score && "setsA" in m.score ? (m.score.setsA ?? 0) + (m.score.setsB ?? 0) : 0;
    totalGames += m.score && "gamesA" in m.score ? (m.score.gamesA ?? 0) + (m.score.gamesB ?? 0) : 0;
    totalPoints += t.game === "tenis" ? tennisPointsA + tennisPointsB : explicitPointsA + explicitPointsB;
    totalPositions += m.score && "posicionA" in m.score ? (m.score.posicionA ?? 0) + (m.score.posicionB ?? 0) : 0;

    const aStats = m.competitorA ? metrics.get(m.competitorA) : undefined;
    const bStats = m.competitorB ? metrics.get(m.competitorB) : undefined;
    if (aStats && bStats) {
      const gameValueA = getPrimaryStatValue(m.score, t.game, "A");
      const gameValueB = getPrimaryStatValue(m.score, t.game, "B");
      aStats.PJ += 1;
      bStats.PJ += 1;
      aStats.GF += gameValueA;
      aStats.GC += gameValueB;
      bStats.GF += gameValueB;
      bStats.GC += gameValueA;
      aStats.kills += m.score && "killsA" in m.score ? m.score.killsA ?? 0 : 0;
      bStats.kills += m.score && "killsB" in m.score ? m.score.killsB ?? 0 : 0;
      aStats.sets += m.score && "setsA" in m.score ? m.score.setsA ?? 0 : 0;
      bStats.sets += m.score && "setsB" in m.score ? m.score.setsB ?? 0 : 0;
      aStats.games += m.score && "gamesA" in m.score ? m.score.gamesA ?? 0 : 0;
      bStats.games += m.score && "gamesB" in m.score ? m.score.gamesB ?? 0 : 0;
      aStats.totalPositions += m.score && "posicionA" in m.score ? m.score.posicionA ?? 0 : 0;
      bStats.totalPositions += m.score && "posicionB" in m.score ? m.score.posicionB ?? 0 : 0;

      const winnerA = m.winnerId === m.competitorA;
      const winnerB = m.winnerId === m.competitorB;
      if (t.game === "tenis") {
        const rawPointsA = m.score && "puntosA" in m.score ? m.score.puntosA ?? detail.pointsA ?? 0 : detail.pointsA ?? 0;
        const rawPointsB = m.score && "puntosB" in m.score ? m.score.puntosB ?? detail.pointsB ?? 0 : detail.pointsB ?? 0;
        const pointWeight = cfg.pointsPerSetPoint ?? 1;
        aStats.points += rawPointsA * pointWeight;
        bStats.points += rawPointsB * pointWeight;
      } else if (t.game === "shooter") {
        const killWeight = cfg.pointsPerKill ?? 1;
        const killsA = m.score && "killsA" in m.score ? m.score.killsA ?? 0 : 0;
        const killsB = m.score && "killsB" in m.score ? m.score.killsB ?? 0 : 0;
        aStats.points += killsA * killWeight;
        bStats.points += killsB * killWeight;
      } else if (t.game === "carreras") {
        const posA = m.score && "posicionA" in m.score ? m.score.posicionA ?? 0 : 0;
        const posB = m.score && "posicionB" in m.score ? m.score.posicionB ?? 0 : 0;
        const positionWeights = cfg.racePositionPoints ?? [];
        const participants = Math.max(2, t.competitors.length);
        const positionPointsA = posA > 0 ? positionWeights[posA - 1] ?? Math.max(1, participants - posA + 1) : 0;
        const positionPointsB = posB > 0 ? positionWeights[posB - 1] ?? Math.max(1, participants - posB + 1) : 0;
        const pointsA = explicitPointsA + positionPointsA;
        const pointsB = explicitPointsB + positionPointsB;
        aStats.points += pointsA;
        bStats.points += pointsB;
        aStats.racePoints += pointsA;
        bStats.racePoints += pointsB;
        totalPoints += positionPointsA + positionPointsB;
      } else {
        if (winnerA) {
          aStats.points += cfg.pointsWin;
          bStats.points += cfg.pointsLoss;
        } else if (winnerB) {
          bStats.points += cfg.pointsWin;
          aStats.points += cfg.pointsLoss;
        } else {
          aStats.points += cfg.pointsDraw;
          bStats.points += cfg.pointsDraw;
        }
      }

      if (winnerA) {
        aStats.wins += 1;
        bStats.losses += 1;
      } else if (winnerB) {
        bStats.wins += 1;
        aStats.losses += 1;
      } else {
        aStats.draws += 1;
        bStats.draws += 1;
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

  const topScorerEntry = sortEntry(
    new Map(
      [...metrics.entries()].map(([id, stats]) => {
        if (t.game === "carreras") return [id, stats.racePoints];
        if (t.game === "shooter") return [id, stats.kills];
        return [id, stats.GF];
      })
    )
  );
  const topWinnerEntry = sortEntry(new Map([...metrics.entries()].map(([id, stats]) => [id, stats.wins])));
  const killTotals = new Map<string, number>();
  t.competitors.forEach((c) => {
    const killsA = t.matches.filter((m) => m.competitorA === c.id).reduce((sum, m) => sum + (m.score && "killsA" in m.score ? m.score.killsA ?? 0 : 0), 0);
    const killsB = t.matches.filter((m) => m.competitorB === c.id).reduce((sum, m) => sum + (m.score && "killsB" in m.score ? m.score.killsB ?? 0 : 0), 0);
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
    totalSets,
    totalGames,
    totalPoints,
    totalPositions,
    avgGoals: confirmed.length ? (totalGoals / confirmed.length).toFixed(2) : "0",
    avgKills: totalKills && confirmed.length ? (totalKills / confirmed.length).toFixed(2) : "0",
    avgSets: confirmed.length ? (totalSets / confirmed.length).toFixed(2) : "0",
    avgGames: confirmed.length ? (totalGames / confirmed.length).toFixed(2) : "0",
    avgPoints: confirmed.length ? (totalPoints / confirmed.length).toFixed(2) : "0",
    avgPosition: confirmed.length ? (totalPositions / (confirmed.length * 2)).toFixed(2) : "0",
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
