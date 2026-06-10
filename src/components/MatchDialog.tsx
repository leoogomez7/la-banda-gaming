import { useEffect, useState } from "react";
import type { Match, ScoreData, Tournament } from "@/types";
import { useTournamentStore } from "@/store/useTournamentStore";
import { motion, AnimatePresence } from "framer-motion";
import { CompetitorAvatar } from "./CompetitorAvatar";

interface Props {
  match: Match | null;
  tournament: Tournament;
  onClose: () => void;
}

interface TennisGame {
  id: number;
  raw: string;
  left: string;
  right: string;
  leftVal: number | null;
  rightVal: number | null;
  winner: "A" | "B" | "D" | null;
}

interface TennisSet {
  id: number;
  raw: string;
  games: TennisGame[];
  gamesA: number;
  gamesB: number;
}

const TENNIS_POINT_OPTIONS = ["0", "15", "30", "40-", "40+"] as const;
const TENNIS_POINT_VALUE_MAP: Record<typeof TENNIS_POINT_OPTIONS[number], number> = {
  "0": 0,
  "15": 1,
  "30": 2,
  "40-": 3,
  "40+": 4,
};

export function MatchDialog({ match, tournament, onClose }: Props) {
  const confirm = useTournamentStore((s) => s.confirmMatch);
  const [golesA, setGolesA] = useState<number | "">("");
  const [golesB, setGolesB] = useState<number | "">("");
  const [penalesA, setPenalesA] = useState<number | "">("");
  const [penalesB, setPenalesB] = useState<number | "">("");
  const [setsA, setSetsA] = useState<number | "">("");
  const [setsB, setSetsB] = useState<number | "">("");
  const [gamesA, setGamesA] = useState(0);
  const [gamesB, setGamesB] = useState(0);
  const [puntosLabelA, setPuntosLabelA] = useState<typeof TENNIS_POINT_OPTIONS[number]>("0");
  const [puntosLabelB, setPuntosLabelB] = useState<typeof TENNIS_POINT_OPTIONS[number]>("0");
  const puntosA = TENNIS_POINT_VALUE_MAP[puntosLabelA];
  const puntosB = TENNIS_POINT_VALUE_MAP[puntosLabelB];
  const [gamesBySet, setGamesBySet] = useState<{ gamesA: number; gamesB: number }[]>([]);
  const [pointsBySet, setPointsBySet] = useState<{ pointsA: number; pointsB: number }[][]>([]);
  const [killsA, setKillsA] = useState<number | "">("");
  const [killsB, setKillsB] = useState<number | "">("");
  const [shooterWinner, setShooterWinner] = useState<"A" | "B" | null>(null);
  const [deathsA, setDeathsA] = useState(0);
  const [deathsB, setDeathsB] = useState(0);
  const [posicionA, setPosicionA] = useState<number | "">("");
  const [posicionB, setPosicionB] = useState<number | "">("");
  const [tiempoAH, setTiempoAH] = useState(0);
  const [tiempoAM, setTiempoAM] = useState(0);
  const [tiempoAS, setTiempoAS] = useState(0);
  const [tiempoAMS, setTiempoAMS] = useState(0);
  const [tiempoBH, setTiempoBH] = useState(0);
  const [tiempoBM, setTiempoBM] = useState(0);
  const [tiempoBS, setTiempoBS] = useState(0);
  const [tiempoBMS, setTiempoBMS] = useState(0);
  const [mvp, setMvp] = useState("");
  const [hadPenales, setHadPenales] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const requiredPassword = import.meta.env.VITE_TOURNAMENT_PASSWORD ?? "";

  if (!match) return null;
  const a = tournament.competitors.find((c) => c.id === match.competitorA);
  const b = tournament.competitors.find((c) => c.id === match.competitorB);
  if (!a || !b) return null;
  const isElim = match.stage !== "liga" && match.stage !== "grupo";
  const needsPassword = match.stage === "liga" || match.stage === "grupo" || isElim;
  const isFootball = tournament.game === "futbol";
  const isTennis = tournament.game === "tenis";
  const isShooter = tournament.game === "shooter";
  const isCarreras = tournament.game === "carreras";
  const scoreLabel = isFootball
    ? "Goles"
    : isTennis
    ? "Sets"
    : isShooter
    ? "Personajes derribados"
    : isCarreras
    ? "Posición"
    : "Puntos";

  const golesAValue = typeof golesA === "number" ? golesA : 0;
  const golesBValue = typeof golesB === "number" ? golesB : 0;
  const setsAValue = typeof setsA === "number" ? setsA : 0;
  const setsBValue = typeof setsB === "number" ? setsB : 0;
  const killsAValue = typeof killsA === "number" ? killsA : 0;
  const killsBValue = typeof killsB === "number" ? killsB : 0;
  const posicionAValue = typeof posicionA === "number" ? posicionA : 0;
  const posicionBValue = typeof posicionB === "number" ? posicionB : 0;

  const scoreA = isFootball
    ? golesAValue
    : isTennis
    ? setsAValue
    : isShooter
    ? killsAValue
    : isCarreras
    ? posicionAValue
    : golesAValue;
  const scoreB = isFootball
    ? golesBValue
    : isTennis
    ? setsBValue
    : isShooter
    ? killsBValue
    : isCarreras
    ? posicionBValue
    : golesBValue;
  const setScoreA = (value: number | "") => {
    if (isFootball) setGolesA(value);
    else if (isTennis) setSetsA(value);
    else if (isShooter) setKillsA(value);
    else if (isCarreras) setPosicionA(typeof value === "number" ? Math.max(1, value) : "");
    else setGolesA(value);
  };
  const setScoreB = (value: number | "") => {
    if (isFootball) setGolesB(value);
    else if (isTennis) setSetsB(value);
    else if (isShooter) setKillsB(value);
    else if (isCarreras) setPosicionB(typeof value === "number" ? Math.max(1, value) : "");
    else setGolesB(value);
  };

  const totalSetsPlayed = isTennis ? setsAValue + setsBValue : 0;
  const draw = scoreA === scoreB;
  const tennisWinner = isTennis
    ? setsAValue > setsBValue
      ? "A"
      : setsBValue > setsAValue
      ? "B"
      : setsAValue || setsBValue
      ? "D"
      : null
    : null;
  const tennisBadgeA = isTennis
    ? tennisWinner === "A"
      ? "Ganador"
      : tennisWinner === "B"
      ? "Perdedor"
      : tennisWinner === "D"
      ? "Empate"
      : "Pendiente"
    : "";
  const tennisBadgeB = isTennis
    ? tennisWinner === "B"
      ? "Ganador"
      : tennisWinner === "A"
      ? "Perdedor"
      : tennisWinner === "D"
      ? "Empate"
      : "Pendiente"
    : "";
  const tennisBadgeClass = (badge: string) =>
    badge === "Ganador"
      ? "bg-emerald-500/15 text-emerald-300"
      : badge === "Perdedor"
      ? "bg-red-500/15 text-red-300"
      : badge === "Empate"
      ? "bg-slate-500/15 text-slate-300"
      : "bg-border text-muted-foreground";
  const totalGameWinsA = gamesBySet.reduce((sum, g) => sum + g.gamesA, 0);
  const totalGameWinsB = gamesBySet.reduce((sum, g) => sum + g.gamesB, 0);

  useEffect(() => {
    setGamesBySet((current) => {
      const next = [...current];
      if (totalSetsPlayed > next.length) {
        for (let i = next.length; i < totalSetsPlayed; i++) next.push({ gamesA: 0, gamesB: 0 });
      } else if (totalSetsPlayed < next.length) {
        next.length = totalSetsPlayed;
      }
      return next;
    });
  }, [totalSetsPlayed]);

  useEffect(() => {
    setPointsBySet((current) =>
      gamesBySet.map((set, index) => {
        const totalGames = Math.max(0, set.gamesA + set.gamesB);
        const existing = current[index] ?? [];
        const next = existing.slice(0, totalGames);
        while (next.length < totalGames) next.push({ pointsA: 0, pointsB: 0 });
        return next;
      })
    );
  }, [gamesBySet]);

  const totalPointsA = pointsBySet.flat().reduce((sum, game) => sum + game.pointsA, 0);
  const totalPointsB = pointsBySet.flat().reduce((sum, game) => sum + game.pointsB, 0);
  const hasPointsBySet = pointsBySet.some((set) => set.length > 0);
  const displayedPointsA = hasPointsBySet ? totalPointsA : puntosA;
  const displayedPointsB = hasPointsBySet ? totalPointsB : puntosB;

  const handleConfirm = () => {
    setPassword("");
    setShowPassword(false);
    setPasswordError("");
    setShowConfirmDialog(true);
  };

  const updatePointsBySet = (setIndex: number, gameIndex: number, side: "A" | "B", value: number) => {
    setPointsBySet((prev) =>
      prev.map((set, idx) =>
        idx === setIndex
          ? set.map((game, gIdx) =>
              gIdx === gameIndex
                ? { ...game, ...(side === "A" ? { pointsA: value } : { pointsB: value }) }
                : game
            )
          : set
      )
    );
  };

  const handleFinalConfirm = () => {
    if (needsPassword) {
      if (!requiredPassword) {
        alert("Contraseña de torneo no configurada en el entorno.");
        return;
      }
      if (password !== requiredPassword) {
        setPasswordError("Contraseña incorrecta.");
        return;
      }
    }
    const golesAValue = typeof golesA === "number" ? golesA : 0;
    const golesBValue = typeof golesB === "number" ? golesB : 0;
    const penalesAValue = typeof penalesA === "number" ? penalesA : undefined;
    const penalesBValue = typeof penalesB === "number" ? penalesB : undefined;
    const setsAValue = typeof setsA === "number" ? setsA : 0;
    const setsBValue = typeof setsB === "number" ? setsB : 0;
    const killsAValue = typeof killsA === "number" ? killsA : 0;
    const killsBValue = typeof killsB === "number" ? killsB : 0;
    const posicionAValue = typeof posicionA === "number" ? posicionA : 0;
    const posicionBValue = typeof posicionB === "number" ? posicionB : 0;
    let score: ScoreData;
    if (isFootball) {
      const fb: any = { golesA: golesAValue, golesB: golesBValue };
      if (draw && hadPenales) { if (penalesAValue !== undefined) fb.penalesA = penalesAValue; if (penalesBValue !== undefined) fb.penalesB = penalesBValue; }
      score = fb;
    } else if (isTennis) {
      score = {
        setsA: setsAValue,
        setsB: setsBValue,
        gamesA: totalGameWinsA || undefined,
        gamesB: totalGameWinsB || undefined,
        puntosA: (hasPointsBySet ? totalPointsA : puntosA) || undefined,
        puntosB: (hasPointsBySet ? totalPointsB : puntosB) || undefined,
        gamesBySet: gamesBySet.length ? gamesBySet : undefined,
        pointsBySet: hasPointsBySet ? pointsBySet : undefined,
      };
    } else if (isShooter) {
      score = {
        killsA: killsAValue,
        killsB: killsBValue,
        ...(shooterWinner ? { winner: shooterWinner } : {}),
      };
    } else if (isCarreras) {
      const formatTime = (h: number, m: number, s: number, ms: number) => {
        const hh = String(Math.max(0, h)).padStart(2, "0");
        const mm = String(Math.max(0, Math.min(59, m))).padStart(2, "0");
        const ss = String(Math.max(0, Math.min(59, s))).padStart(2, "0");
        const mss = String(Math.max(0, Math.min(999, ms))).padStart(3, "0");
        return `${hh}:${mm}:${ss}.${mss}`;
      };
      score = {
        posicionA: posicionAValue,
        posicionB: posicionBValue,
        tiempoA: formatTime(tiempoAH, tiempoAM, tiempoAS, tiempoAMS),
        tiempoB: formatTime(tiempoBH, tiempoBM, tiempoBS, tiempoBMS),
      };
    } else {
      score = { puntosA: scoreA, puntosB: scoreB } as ScoreData;
    }
    confirm(tournament.id, match.id, score);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative glass w-full max-w-[95vw] md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 neon-border"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-border bg-background/80 p-2 text-sm text-muted-foreground transition hover:bg-background hover:text-foreground"
            aria-label="Cerrar"
          >
            ×
          </button>
          <h3 className="font-display mb-1 text-xl uppercase tracking-widest">
            REGISTRAR ENFRENTAMIENTO
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {match.stage} · Ronda {match.round}
          </p>

          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <CompetitorAvatar c={a} size={56} />
              <p className="text-center text-sm font-semibold">{a.name}</p>
              {isTennis ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tennisBadgeClass(tennisBadgeA)}`}>
                  {tennisBadgeA}
                </span>
              ) : (
                <>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{scoreLabel}</label>
                  <input
                    type="number"
                    min={isCarreras ? 1 : 0}
                    placeholder=""
                    value={isFootball ? golesA : isShooter ? killsA : isCarreras ? posicionA : golesA}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number(e.target.value);
                      setScoreA(value);
                    }}
                    className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl"
                  />
                </>
              )}
            </div>
            <div className="font-display text-2xl text-muted-foreground">VS</div>
            <div className="flex min-w-0 flex-col items-center gap-2">
              <CompetitorAvatar c={b} size={56} />
              <p className="text-center text-sm font-semibold">{b.name}</p>
              {isTennis ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tennisBadgeClass(tennisBadgeB)}`}>
                  {tennisBadgeB}
                </span>
              ) : (
                <>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{scoreLabel}</label>
                  <input
                    type="number"
                    min={isCarreras ? 1 : 0}
                    placeholder=""
                    value={isFootball ? golesB : isShooter ? killsB : isCarreras ? posicionB : golesB}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number(e.target.value);
                      setScoreB(value);
                    }}
                    className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl"
                  />
                </>
              )}
            </div>
          </div>

          {isTennis && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold">Resultado tenis</p>
              <p className="text-xs text-muted-foreground">Ingresa sólo la cantidad de sets, games y puntos.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-3 min-w-0">
                <div className="rounded-2xl border border-border bg-background/70 p-4 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sets</p>
                    <p className="text-sm font-semibold">{setsA} - {setsB}</p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-1 text-xs">
                      <label>{a.name}</label>
                      <input
                        type="number"
                        min={0}
                        placeholder=""
                        value={setsA}
                        onChange={(e) => setSetsA(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                      />
                    </div>
                    <div className="grid gap-1 text-xs">
                      <label>{b.name}</label>
                      <input
                        type="number"
                        min={0}
                        placeholder=""
                        value={setsB}
                        onChange={(e) => setSetsB(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-4 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Games</p>
                    <p className="text-sm font-semibold">{totalGameWinsA} - {totalGameWinsB}</p>
                  </div>
                  <div className="mt-4 space-y-3 min-w-0">
                    {gamesBySet.map((set, index) => (
                      <div key={index} className="grid gap-3 rounded-xl border border-border/80 bg-background/50 p-3 text-xs min-w-0">
                        <p className="uppercase tracking-[0.2em] text-muted-foreground">Set {index + 1}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="grid gap-1">
                            <label>{a.name}</label>
                            <input
                              type="number"
                              min={0}
                              value={set.gamesA}
                              onChange={(e) => {
                                const value = +e.target.value;
                                setGamesBySet((prev) => prev.map((item, idx) => idx === index ? { ...item, gamesA: value } : item));
                              }}
                              className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                            />
                          </div>
                          <div className="grid gap-1">
                            <label>{b.name}</label>
                            <input
                              type="number"
                              min={0}
                              value={set.gamesB}
                              onChange={(e) => {
                                const value = +e.target.value;
                                setGamesBySet((prev) => prev.map((item, idx) => idx === index ? { ...item, gamesB: value } : item));
                              }}
                              className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2 rounded-xl border border-border/80 bg-background/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Puntos por game</p>
                          {pointsBySet[index]?.length ? (
                            <div className="grid gap-2">
                              {pointsBySet[index].map((game, gameIndex) => (
                                <div key={gameIndex} className="grid gap-2 rounded-lg border border-border/70 bg-background/60 p-2">
                                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Game {gameIndex + 1}</p>
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                      <label className="font-semibold text-[11px]">{a.name}</label>
                                      <div className="grid grid-cols-5 gap-1">
                                        {TENNIS_POINT_OPTIONS.map((option) => (
                                          <button
                                            key={option}
                                            type="button"
                                            onClick={() => updatePointsBySet(index, gameIndex, "A", TENNIS_POINT_VALUE_MAP[option])}
                                            className={`rounded-md border px-2 py-2 text-[11px] transition ${game.pointsA === TENNIS_POINT_VALUE_MAP[option] ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/70 hover:border-primary/80"}`}
                                          >
                                            {option}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="grid gap-2">
                                      <label className="font-semibold text-[11px]">{b.name}</label>
                                      <div className="grid grid-cols-5 gap-1">
                                        {TENNIS_POINT_OPTIONS.map((option) => (
                                          <button
                                            key={option}
                                            type="button"
                                            onClick={() => updatePointsBySet(index, gameIndex, "B", TENNIS_POINT_VALUE_MAP[option])}
                                            className={`rounded-md border px-2 py-2 text-[11px] transition ${game.pointsB === TENNIS_POINT_VALUE_MAP[option] ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/70 hover:border-primary/80"}`}
                                          >
                                            {option}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">Ingresa los games del set para poder detallar los puntos por cada game.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-4 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Puntos totales</p>
                      {!hasPointsBySet ? (
                        <p className="text-[11px] text-muted-foreground">Cada game se valora: 0 → 0 / 15 → 1 / 30 → 2 / 40- → 3 / 40+ → 4.</p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold">{displayedPointsA} - {displayedPointsB}</p>
                  </div>
                  {!hasPointsBySet && (
                    <div className="mt-4 grid gap-3 text-xs">
                      <div className="grid gap-2">
                        <label className="font-semibold">{a.name}</label>
                        <div className="grid grid-cols-5 gap-1">
                          {TENNIS_POINT_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setPuntosLabelA(option)}
                              className={`rounded-md border px-2 py-2 text-[11px] transition ${puntosLabelA === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/70 hover:border-primary/80"}`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="font-semibold">{b.name}</label>
                        <div className="grid grid-cols-5 gap-1">
                          {TENNIS_POINT_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setPuntosLabelB(option)}
                              className={`rounded-md border px-2 py-2 text-[11px] transition ${puntosLabelB === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/70 hover:border-primary/80"}`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {isCarreras && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold">Detalles de carrera</p>
              <p className="text-xs text-muted-foreground">Ingresa hora, minutos, segundos y milisegundos.</p>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-2 text-xs">
                  <label>{a.name} - Tiempo</label>
                  <div className="grid grid-cols-4 gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Horas</span>
                    <span>Minutos</span>
                    <span>Segundos</span>
                    <span>Milisegundos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <input type="number" min={0} value={tiempoAH} onChange={(e) => setTiempoAH(+e.target.value)}
                      placeholder="HH" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                    <input type="number" min={0} max={59} value={tiempoAM} onChange={(e) => setTiempoAM(+e.target.value)}
                      placeholder="MM" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                    <input type="number" min={0} max={59} value={tiempoAS} onChange={(e) => setTiempoAS(+e.target.value)}
                      placeholder="SS" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                    <input type="number" min={0} max={999} value={tiempoAMS} onChange={(e) => setTiempoAMS(+e.target.value)}
                      placeholder="MS" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                  </div>
                </div>
                <div className="grid gap-2 text-xs">
                  <label>{b.name} - Tiempo</label>
                  <div className="grid grid-cols-4 gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Horas</span>
                    <span>Minutos</span>
                    <span>Segundos</span>
                    <span>Milisegundos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <input type="number" min={0} value={tiempoBH} onChange={(e) => setTiempoBH(+e.target.value)}
                      placeholder="HH" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                    <input type="number" min={0} max={59} value={tiempoBM} onChange={(e) => setTiempoBM(+e.target.value)}
                      placeholder="MM" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                    <input type="number" min={0} max={59} value={tiempoBS} onChange={(e) => setTiempoBS(+e.target.value)}
                      placeholder="SS" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                    <input type="number" min={0} max={999} value={tiempoBMS} onChange={(e) => setTiempoBMS(+e.target.value)}
                      placeholder="MS" className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isFootball && draw && isElim && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hadPenales} onChange={(e) => setHadPenales(e.target.checked)} />
                ¿Hubo penales?
              </label>
              {hadPenales && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder={`Pen. ${a.name}`}
                    value={penalesA}
                    onChange={(e) => setPenalesA(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-md border border-border bg-background/50 px-2 py-1 text-center"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder={`Pen. ${b.name}`}
                    value={penalesB}
                    onChange={(e) => setPenalesB(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-md border border-border bg-background/50 px-2 py-1 text-center"
                  />
                </div>
              )}
            </div>
          )}

          {isShooter && draw && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold">Empate en personajes derribados</p>
              <p className="mt-2 text-xs text-muted-foreground">Selecciona quién ganó el partido.</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShooterWinner("A")}
                  className={`flex-1 rounded-lg px-3 py-2 ${shooterWinner === "A" ? "bg-primary text-primary-foreground" : "bg-background/70"}`}
                >
                  {a.name}
                </button>
                <button
                  type="button"
                  onClick={() => setShooterWinner("B")}
                  className={`flex-1 rounded-lg px-3 py-2 ${shooterWinner === "B" ? "bg-primary text-primary-foreground" : "bg-background/70"}`}
                >
                  {b.name}
                </button>
              </div>
              {!shooterWinner && (
                <p className="mt-3 text-xs text-destructive">
                  En shooter no puede quedar empate. Selecciona quién ganó.
                </p>
              )}
            </div>
          )}

          {isElim && draw && (!isFootball || !hadPenales) && (
            <p className="mt-3 text-xs text-destructive">
              En eliminatoria no puede haber empate. {isFootball ? "Marca penales." : "Ajusta el marcador."}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border bg-secondary/40 py-2 text-sm">
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={(isElim && draw && (!isFootball || !hadPenales)) || (isShooter && draw && !shooterWinner)}
              className="btn-neon flex-1 rounded-lg bg-primary py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              Confirmar resultado
            </button>
          </div>

          <AnimatePresence>
            {showConfirmDialog && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                  className="glass w-full max-w-md rounded-3xl border border-primary/30 p-6 neon-border"
                >
                  <h4 className="font-display text-lg uppercase tracking-widest text-primary">Confirmar resultado</h4>
                  <p className="mt-3 text-sm text-muted-foreground">
                    ¿Estás seguro de que quieres confirmar este resultado? Una vez confirmado no podrá modificarse.
                  </p>
                  {needsPassword && (
                    <div className="mt-4 space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
                      <p className="text-sm font-semibold">Contraseña requerida</p>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                        placeholder="Ingresa la contraseña"
                        className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
                      />
                      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="h-4 w-4 rounded border-border bg-background"
                        />
                        Mostrar contraseña
                      </label>
                      {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                    </div>
                  )}
                  <div className="mt-6 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPassword("");
                        setPasswordError("");
                        setShowConfirmDialog(false);
                      }}
                      className="flex-1 rounded-lg border border-border bg-secondary/40 py-2 text-sm"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalConfirm}
                      className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
                    >
                      Sí, confirmar
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
