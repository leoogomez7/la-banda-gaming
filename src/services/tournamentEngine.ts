import type { Tournament, Match, Competitor, ScoreData, FootballScore, ShooterScore, GenericScore, Stage } from "@/types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export function getCompetitor(t: Tournament, id?: string | null): Competitor | null {
  if (!id) return null;
  return t.competitors.find((c) => c.id === id) ?? null;
}

// --- League: round-robin (Berger) ---
export function generateLeagueMatches(tournamentId: string, ids: string[]): Match[] {
  const players = [...ids];
  if (players.length < 2) return [];
  if (players.length % 2 === 1) players.push("__BYE__");
  const n = players.length;
  const rounds = n - 1;
  const half = n / 2;
  const matches: Match[] = [];
  const arr = [...players];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== "__BYE__" && b !== "__BYE__") {
        matches.push({
          id: uid(),
          tournamentId,
          stage: "liga",
          round: r + 1,
          competitorA: a,
          competitorB: b,
          status: "pendiente",
          createdAt: Date.now(),
        });
      }
    }
    // rotate (keep first fixed)
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr.splice(0, arr.length, fixed, ...rest);
  }
  return matches;
}

// --- Knockout bracket ---
const STAGE_BY_SIZE: Record<number, Stage> = { 32: "16", 16: "16", 8: "cuartos", 4: "semifinal", 2: "final" };

function nextPowerOfTwo(n: number) { let p = 1; while (p < n) p *= 2; return p; }

export function generateKnockoutMatches(tournamentId: string, seedIds: (string | null)[]): Match[] {
  const size = nextPowerOfTwo(seedIds.length);
  const seeds: (string | null)[] = [...seedIds];
  while (seeds.length < size) seeds.push(null); // BYE
  const matches: Match[] = [];
  // Build rounds bottom-up
  let currentRoundIds: string[] = [];
  let prevRoundIds: string[] = [];
  let roundSize = size / 2;
  let stage: Stage = STAGE_BY_SIZE[size] ?? "final";
  // First round
  const firstRound: Match[] = [];
  for (let i = 0; i < size; i += 2) {
    const m: Match = {
      id: uid(),
      tournamentId,
      stage,
      round: 1,
      competitorA: seeds[i],
      competitorB: seeds[i + 1],
      status: "pendiente",
      createdAt: Date.now(),
    };
    // Auto-advance BYEs
    if (m.competitorA && !m.competitorB) { m.status = "confirmado"; m.winnerId = m.competitorA; }
    else if (!m.competitorA && m.competitorB) { m.status = "confirmado"; m.winnerId = m.competitorB; }
    firstRound.push(m);
    currentRoundIds.push(m.id);
  }
  matches.push(...firstRound);
  let roundIndex = 2;
  while (roundSize > 1) {
    prevRoundIds = currentRoundIds;
    currentRoundIds = [];
    roundSize = roundSize / 2;
    const sz = (size >> (roundIndex - 1));
    stage = STAGE_BY_SIZE[sz] ?? (sz === 2 ? "final" : sz === 4 ? "semifinal" : sz === 8 ? "cuartos" : "16");
    const round: Match[] = [];
    for (let i = 0; i < prevRoundIds.length; i += 2) {
      const m: Match = {
        id: uid(),
        tournamentId,
        stage,
        round: roundIndex,
        competitorA: null,
        competitorB: null,
        status: "pendiente",
        createdAt: Date.now(),
      };
      round.push(m);
      currentRoundIds.push(m.id);
      // link previous
      const prevA = matches.find((x) => x.id === prevRoundIds[i])!;
      const prevB = matches.find((x) => x.id === prevRoundIds[i + 1])!;
      prevA.next = { matchId: m.id, slot: "A" };
      prevB.next = { matchId: m.id, slot: "B" };
    }
    matches.push(...round);
    roundIndex++;
  }
  // propagate any BYE auto-wins
  matches.forEach((m) => {
    if (m.status === "confirmado" && m.winnerId && m.next) {
      const nxt = matches.find((x) => x.id === m.next!.matchId)!;
      if (m.next.slot === "A") nxt.competitorA = m.winnerId; else nxt.competitorB = m.winnerId;
    }
  });
  return matches;
}

// --- Confirm match: compute winner + propagate ---
export function determineWinner(score: ScoreData, game: string): "A" | "B" | "draw" {
  if (game === "futbol") {
    const s = score as FootballScore;
    if (s.golesA > s.golesB) return "A";
    if (s.golesB > s.golesA) return "B";
    if (s.penalesA != null && s.penalesB != null) {
      if (s.penalesA > s.penalesB) return "A";
      if (s.penalesB > s.penalesA) return "B";
    }
    return "draw";
  }
  if (game === "shooter") {
    const s = score as ShooterScore;
    if (s.killsA > s.killsB) return "A";
    if (s.killsB > s.killsA) return "B";
    if (s.winner) return s.winner;
    return "draw";
  }
  // generic: puntosA/B (works for tenis sets, carreras inv, etc.)
  const g = score as GenericScore & any;
  const a = g.puntosA ?? g.setsA;
  const b = g.puntosB ?? g.setsB;
  if (a > b) return "A";
  if (b > a) return "B";
  // carreras: lower position wins
  if (g.posicionA != null && g.posicionB != null) {
    if (g.posicionA < g.posicionB) return "A";
    if (g.posicionB < g.posicionA) return "B";
  }
  return "draw";
}

export function applyMatchResult(t: Tournament, matchId: string, score: ScoreData): Tournament {
  const m = t.matches.find((x) => x.id === matchId);
  if (!m) return t;
  const w = determineWinner(score, t.game);
  m.score = score;
  m.status = "confirmado";
  if (w === "A") { m.winnerId = m.competitorA; m.loserId = m.competitorB; }
  else if (w === "B") { m.winnerId = m.competitorB; m.loserId = m.competitorA; }
  else { m.winnerId = null; m.loserId = null; }

  // propagate in knockout
  if (m.next && w !== "draw" && m.winnerId) {
    const nxt = t.matches.find((x) => x.id === m.next!.matchId);
    if (nxt) {
      if (m.next.slot === "A") nxt.competitorA = m.winnerId;
      else nxt.competitorB = m.winnerId;
    }
  }

  // Check final / champion
  const finals = t.matches.filter((x) => x.stage === "final");
  if (finals.length && finals.every((f) => f.status === "confirmado" && f.winnerId)) {
    const fin = finals[finals.length - 1];
    t.championId = fin.winnerId!;
    t.runnerUpId = fin.loserId ?? undefined;
    t.finished = true;
  }
  return { ...t, matches: [...t.matches] };
}

// --- League table ---
export interface TableRow {
  competitorId: string;
  PJ: number;
  PG: number;
  PE: number;
  PP: number;
  GF: number;
  GC: number;
  DG: number;
  PTS: number;
  SW?: number;
  GW?: number;
  KD?: number;
  F1?: number;
  F2?: number;
  F3?: number;
  F4?: number;
  TIME?: number;
}

function parseTennisDetail(detail?: string) {
  const result = { gamesA: 0, gamesB: 0, pointsA: 0, pointsB: 0 };
  if (!detail) return result;

  const scorePairs = [...detail.matchAll(/(\d+)\s*-\s*(\d+)/g)];
  scorePairs.forEach((match) => {
    result.gamesA += Number(match[1]);
    result.gamesB += Number(match[2]);
  });

  const tokens = [...detail.matchAll(/40d?|30|15|0/gi)].map((m) => m[0].toUpperCase());
  const scoreMap: Record<string, number> = { "0": 0, "15": 1, "30": 2, "40": 3, "40D": 4 };
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

function parseRaceTime(value?: string) {
  if (!value) return null;
  const timeParts = value.split(":");
  const parts = timeParts.map((p) => Number(p.trim()));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 4) {
    const [h, m, s, ms] = parts;
    return h * 3600 + m * 60 + s + ms / 1000;
  }
  return null;
}

function compareHeadToHead(t: Tournament, aId: string, bId: string, stage: "liga" | "grupo", groupId?: string) {
  const match = t.matches.find((m) =>
    m.status === "confirmado" &&
    ((m.competitorA === aId && m.competitorB === bId) || (m.competitorA === bId && m.competitorB === aId)) &&
    (groupId ? m.groupId === groupId : m.stage === stage)
  );
  if (!match || !match.winnerId) return 0;
  if (match.winnerId === aId) return 1;
  if (match.winnerId === bId) return -1;
  return 0;
}

function sortRows(rows: TableRow[], t: Tournament, game: string, stage: "liga" | "grupo", groupId?: string) {
  return rows.sort((x, y) => {
    if (game === "tenis") {
      const diff = y.PG - x.PG || y.PTS - x.PTS || (y.SW ?? 0) - (x.SW ?? 0) || (y.GW ?? 0) - (x.GW ?? 0);
      if (diff !== 0) return diff;
      const h2h = compareHeadToHead(t, x.competitorId, y.competitorId, stage, groupId);
      if (h2h !== 0) return h2h;
      return x.competitorId.localeCompare(y.competitorId);
    }
    if (game === "shooter") {
      const diff = y.PG - x.PG || (y.KD ?? 0) - (x.KD ?? 0) || y.PE - x.PE || x.PJ - y.PJ;
      if (diff !== 0) return diff;
      const h2h = compareHeadToHead(t, x.competitorId, y.competitorId, stage, groupId);
      if (h2h !== 0) return h2h;
      return x.competitorId.localeCompare(y.competitorId);
    }
    if (game === "carreras") {
      const diff = y.PTS - x.PTS || (y.F1 ?? 0) - (x.F1 ?? 0) || (y.F2 ?? 0) - (x.F2 ?? 0) || (y.F3 ?? 0) - (x.F3 ?? 0) || (x.TIME ?? 0) - (y.TIME ?? 0) || x.PJ - y.PJ;
      if (diff !== 0) return diff;
      const h2h = compareHeadToHead(t, x.competitorId, y.competitorId, stage, groupId);
      if (h2h !== 0) return h2h;
      return x.competitorId.localeCompare(y.competitorId);
    }
    if (game === "futbol") {
      const diff = y.PTS - x.PTS || y.DG - x.DG || y.GF - x.GF || x.PJ - y.PJ;
      if (diff !== 0) return diff;
      const h2h = compareHeadToHead(t, x.competitorId, y.competitorId, stage, groupId);
      if (h2h !== 0) return h2h;
      return x.competitorId.localeCompare(y.competitorId);
    }
    const diff = y.PTS - x.PTS || y.DG - x.DG || y.GF - x.GF || x.PJ - y.PJ;
    if (diff !== 0) return diff;
    const h2h = compareHeadToHead(t, x.competitorId, y.competitorId, stage, groupId);
    if (h2h !== 0) return h2h;
    return x.competitorId.localeCompare(y.competitorId);
  });
}

export function computeLeagueTable(t: Tournament): TableRow[] {
  const game = t.game;
  const cfg = t.league ?? { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };
  const map = new Map<string, TableRow>();
  t.competitors.forEach((c) =>
    map.set(c.id, {
      competitorId: c.id,
      PJ: 0,
      PG: 0,
      PE: 0,
      PP: 0,
      GF: 0,
      GC: 0,
      DG: 0,
      PTS: 0,
      SW: 0,
      GW: 0,
      KD: 0,
      F1: 0,
      F2: 0,
      F3: 0,
      F4: 0,
      TIME: 0,
    })
  );

  t.matches.filter((m) => m.stage === "liga" && m.status === "confirmado").forEach((m) => {
    const a = m.competitorA && map.get(m.competitorA);
    const b = m.competitorB && map.get(m.competitorB);
    if (!a || !b || !m.score) return;
    const s: any = m.score;

    a.PJ++; b.PJ++;
    if (game === "tenis") {
      const detail = parseTennisDetail(s.detalle);
      const setsA = s.setsA ?? 0;
      const setsB = s.setsB ?? 0;
      const gamesA = s.gamesA ?? detail.gamesA ?? s.gamesBySet?.reduce((sum: number, g: any) => sum + (g.gamesA ?? 0), 0) ?? 0;
      const gamesB = s.gamesB ?? detail.gamesB ?? s.gamesBySet?.reduce((sum: number, g: any) => sum + (g.gamesB ?? 0), 0) ?? 0;
      const rawPointsA = s.puntosA ?? detail.pointsA ?? s.pointsBySet?.flat().reduce((sum: number, p: any) => sum + (p.pointsA ?? 0), 0) ?? 0;
      const rawPointsB = s.puntosB ?? detail.pointsB ?? s.pointsBySet?.flat().reduce((sum: number, p: any) => sum + (p.pointsB ?? 0), 0) ?? 0;
      const pointWeight = cfg.pointsPerSetPoint ?? 1;
      const pointsA = rawPointsA * pointWeight;
      const pointsB = rawPointsB * pointWeight;
      a.SW! += setsA;
      b.SW! += setsB;
      a.GW! += gamesA;
      b.GW! += gamesB;
      a.PTS += pointsA;
      b.PTS += pointsB;
      a.GF += pointsA;
      a.GC += pointsB;
      b.GF += pointsB;
      b.GC += pointsA;
      if (m.winnerId === a.competitorId) { a.PG++; b.PP++; }
      else if (m.winnerId === b.competitorId) { b.PG++; a.PP++; }
      else { a.PE++; b.PE++; }
    } else if (game === "shooter") {
      const killsA = s.killsA ?? 0;
      const killsB = s.killsB ?? 0;
      const killWeight = cfg.pointsPerKill ?? 1;
      a.KD! += killsA;
      b.KD! += killsB;
      a.GF += killsA;
      a.GC += killsB;
      b.GF += killsB;
      b.GC += killsA;
      a.PTS += killsA * killWeight;
      b.PTS += killsB * killWeight;
      if (m.winnerId === a.competitorId) { a.PG++; b.PP++; }
      else if (m.winnerId === b.competitorId) { b.PG++; a.PP++; }
      else { a.PE++; b.PE++; }
    } else if (game === "carreras") {
      const posA = s.posicionA ?? 0;
      const posB = s.posicionB ?? 0;
      const timeA = parseRaceTime(s.tiempoA) ?? 0;
      const timeB = parseRaceTime(s.tiempoB) ?? 0;
      const participants = Math.max(2, t.competitors.length);
      const positionWeights = cfg.racePositionPoints ?? [];
      const pointsA = posA > 0 ? positionWeights[posA - 1] ?? Math.max(1, participants - posA + 1) : 0;
      const pointsB = posB > 0 ? positionWeights[posB - 1] ?? Math.max(1, participants - posB + 1) : 0;
      a.F1! += posA === 1 ? 1 : 0;
      a.F2! += posA === 2 ? 1 : 0;
      a.F3! += posA === 3 ? 1 : 0;
      a.F4! += posA >= 4 ? 1 : 0;
      b.F1! += posB === 1 ? 1 : 0;
      b.F2! += posB === 2 ? 1 : 0;
      b.F3! += posB === 3 ? 1 : 0;
      b.F4! += posB >= 4 ? 1 : 0;
      a.TIME! += timeA;
      b.TIME! += timeB;
      a.PTS += pointsA;
      b.PTS += pointsB;
      if (posA === 1) { a.PG++; b.PP++; }
      else if (posB === 1) { b.PG++; a.PP++; }
      else { a.PP++; b.PP++; }
    } else {
      const gfA = s.golesA ?? s.puntosA ?? s.setsA ?? s.killsA ?? 0;
      const gfB = s.golesB ?? s.puntosB ?? s.setsB ?? s.killsB ?? 0;
      a.GF += gfA;
      a.GC += gfB;
      b.GF += gfB;
      b.GC += gfA;
      if (m.winnerId === a.competitorId) { a.PG++; b.PP++; a.PTS += cfg.pointsWin; b.PTS += cfg.pointsLoss; }
      else if (m.winnerId === b.competitorId) { b.PG++; a.PP++; b.PTS += cfg.pointsWin; a.PTS += cfg.pointsLoss; }
      else { a.PE++; b.PE++; a.PTS += cfg.pointsDraw; b.PTS += cfg.pointsDraw; }
    }
  });

  map.forEach((r) => (r.DG = r.GF - r.GC));
  return sortRows([...map.values()], t, game, "liga");
}

// --- Groups distribution ---
export function distributeGroups(competitorIds: string[], numGroups: number): { id: string; name: string; competitorIds: string[] }[] {
  const groups = Array.from({ length: numGroups }, (_, i) => ({
    id: uid(),
    name: `Grupo ${String.fromCharCode(65 + i)}`,
    competitorIds: [] as string[],
  }));
  const shuffled = [...competitorIds].sort(() => Math.random() - 0.5);
  shuffled.forEach((id, i) => groups[i % numGroups].competitorIds.push(id));
  return groups;
}

export function computeGroupTable(t: Tournament, groupId: string): TableRow[] {
  const game = t.game;
  const cfg = t.league ?? { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };
  const group = t.groups?.find((g) => g.id === groupId);
  if (!group) return [];
  const map = new Map<string, TableRow>();
  group.competitorIds.forEach((id) =>
    map.set(id, {
      competitorId: id,
      PJ: 0,
      PG: 0,
      PE: 0,
      PP: 0,
      GF: 0,
      GC: 0,
      DG: 0,
      PTS: 0,
      SW: 0,
      GW: 0,
      KD: 0,
      F1: 0,
      F2: 0,
      F3: 0,
      F4: 0,
      TIME: 0,
    })
  );

  t.matches.filter((m) => m.stage === "grupo" && m.groupId === groupId && m.status === "confirmado").forEach((m) => {
    const a = m.competitorA && map.get(m.competitorA);
    const b = m.competitorB && map.get(m.competitorB);
    if (!a || !b || !m.score) return;
    const s: any = m.score;

    a.PJ++; b.PJ++;
    if (game === "tenis") {
      const detail = parseTennisDetail(s.detalle);
      const setsA = s.setsA ?? 0;
      const setsB = s.setsB ?? 0;
      const gamesA = s.gamesA ?? detail.gamesA ?? s.gamesBySet?.reduce((sum: number, g: any) => sum + (g.gamesA ?? 0), 0) ?? 0;
      const gamesB = s.gamesB ?? detail.gamesB ?? s.gamesBySet?.reduce((sum: number, g: any) => sum + (g.gamesB ?? 0), 0) ?? 0;
      const rawPointsA = s.puntosA ?? detail.pointsA ?? s.pointsBySet?.flat().reduce((sum: number, p: any) => sum + (p.pointsA ?? 0), 0) ?? 0;
      const rawPointsB = s.puntosB ?? detail.pointsB ?? s.pointsBySet?.flat().reduce((sum: number, p: any) => sum + (p.pointsB ?? 0), 0) ?? 0;
      const pointWeight = cfg.pointsPerSetPoint ?? 1;
      const pointsA = rawPointsA * pointWeight;
      const pointsB = rawPointsB * pointWeight;
      a.SW! += setsA;
      b.SW! += setsB;
      a.GW! += gamesA;
      b.GW! += gamesB;
      a.PTS += pointsA;
      b.PTS += pointsB;
      a.GF += pointsA;
      a.GC += pointsB;
      b.GF += pointsB;
      b.GC += pointsA;
      if (m.winnerId === a.competitorId) { a.PG++; b.PP++; }
      else if (m.winnerId === b.competitorId) { b.PG++; a.PP++; }
      else { a.PE++; b.PE++; }
    } else if (game === "shooter") {
      const killsA = s.killsA ?? 0;
      const killsB = s.killsB ?? 0;
      const killWeight = cfg.pointsPerKill ?? 1;
      a.KD! += killsA;
      b.KD! += killsB;
      a.GF += killsA;
      a.GC += killsB;
      b.GF += killsB;
      b.GC += killsA;
      a.PTS += killsA * killWeight;
      b.PTS += killsB * killWeight;
      if (m.winnerId === a.competitorId) { a.PG++; b.PP++; }
      else if (m.winnerId === b.competitorId) { b.PG++; a.PP++; }
      else { a.PE++; b.PE++; }
    } else if (game === "carreras") {
      const posA = s.posicionA ?? 0;
      const posB = s.posicionB ?? 0;
      const timeA = parseRaceTime(s.tiempoA) ?? 0;
      const timeB = parseRaceTime(s.tiempoB) ?? 0;
      const participants = Math.max(2, t.competitors.length);
      const positionWeights = cfg.racePositionPoints ?? [];
      const pointsA = posA > 0 ? positionWeights[posA - 1] ?? Math.max(1, participants - posA + 1) : 0;
      const pointsB = posB > 0 ? positionWeights[posB - 1] ?? Math.max(1, participants - posB + 1) : 0;
      a.F1! += posA === 1 ? 1 : 0;
      a.F2! += posA === 2 ? 1 : 0;
      a.F3! += posA === 3 ? 1 : 0;
      a.F4! += posA >= 4 ? 1 : 0;
      b.F1! += posB === 1 ? 1 : 0;
      b.F2! += posB === 2 ? 1 : 0;
      b.F3! += posB === 3 ? 1 : 0;
      b.F4! += posB >= 4 ? 1 : 0;
      a.TIME! += timeA;
      b.TIME! += timeB;
      a.PTS += pointsA;
      b.PTS += pointsB;
      if (posA === 1) { a.PG++; b.PP++; }
      else if (posB === 1) { b.PG++; a.PP++; }
      else { a.PP++; b.PP++; }
    } else {
      const gfA = s.golesA ?? s.puntosA ?? s.setsA ?? s.killsA ?? 0;
      const gfB = s.golesB ?? s.puntosB ?? s.setsB ?? s.killsB ?? 0;
      a.GF += gfA;
      a.GC += gfB;
      b.GF += gfB;
      b.GC += gfA;
      if (m.winnerId === a.competitorId) { a.PG++; b.PP++; a.PTS += cfg.pointsWin; b.PTS += cfg.pointsLoss; }
      else if (m.winnerId === b.competitorId) { b.PG++; a.PP++; b.PTS += cfg.pointsWin; a.PTS += cfg.pointsLoss; }
      else { a.PE++; b.PE++; a.PTS += cfg.pointsDraw; b.PTS += cfg.pointsDraw; }
    }
  });

  map.forEach((r) => (r.DG = r.GF - r.GC));
  return sortRows([...map.values()], t, game, "grupo", groupId);
}

// Build knockout from a set of seeds (1 vs N, 2 vs N-1, ...)
export function seedKnockoutFromRanking(tournamentId: string, ranking: string[]): Match[] {
  const n = ranking.length;
  const size = nextPowerOfTwo(n);
  const seeds: (string | null)[] = new Array(size).fill(null);
  // standard seed order for bracket
  // simple: 1 vs n, 2 vs n-1...
  for (let i = 0; i < size / 2; i++) {
    seeds[i * 2] = ranking[i] ?? null;
    seeds[i * 2 + 1] = ranking[n - 1 - i] ?? null;
  }
  return generateKnockoutMatches(tournamentId, seeds);
}
