export type GameType = "futbol" | "tenis" | "shooter" | "carreras" | "otro";
export type TournamentFormat = "liga" | "eliminatoria" | "grupos_eliminatoria" | "liga_eliminatoria";
export type MatchStatus = "pendiente" | "en_juego" | "confirmado";
export type Stage = "liga" | "grupo" | "16" | "8" | "cuartos" | "semifinal" | "final" | "tercer";

export interface Competitor {
  id: string;
  name: string;
  image?: string; // dataURL
  groupId?: string;
}

export interface FootballScore { golesA: number; golesB: number; penalesA?: number; penalesB?: number; }
export interface TenisScore {
  setsA: number;
  setsB: number;
  gamesA?: number;
  gamesB?: number;
  puntosA?: number;
  puntosB?: number;
  gamesBySet?: { gamesA: number; gamesB: number }[];
  pointsBySet?: { pointsA: number; pointsB: number }[][];
  detalle?: string;
}
export interface ShooterScore { killsA: number; killsB: number; winner?: "A" | "B"; }
export interface CarrerasScore { posicionA: number; posicionB: number; tiempoA?: string; tiempoB?: string; pole?: "A"|"B"; }
export type GenericScore = { puntosA: number; puntosB: number };

export type ScoreData = FootballScore | TenisScore | ShooterScore | CarrerasScore | GenericScore;

export interface Match {
  id: string;
  tournamentId: string;
  stage: Stage;
  round: number;
  groupId?: string;
  competitorA: string | null; // id or null/BYE
  competitorB: string | null;
  status: MatchStatus;
  score?: ScoreData;
  winnerId?: string | null;
  loserId?: string | null;
  next?: { matchId: string; slot: "A" | "B" }; // bracket linking
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  competitorIds: string[];
}

export interface LeagueConfig {
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pointsPerSetPoint?: number;
  pointsPerKill?: number;
  racePositionPoints?: number[];
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  game: GameType;
  createdAt: number;
  competitors: Competitor[];
  groups?: Group[];
  matches: Match[];
  league?: LeagueConfig;
  knockout?: {
    qualifiersPerGroup?: number; // for grupos
    qualifiersFromLeague?: number; // for liga_eliminatoria
  };
  championId?: string;
  runnerUpId?: string;
  thirdId?: string;
  finished?: boolean;
}
