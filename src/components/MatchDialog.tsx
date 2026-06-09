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

export function MatchDialog({ match, tournament, onClose }: Props) {
  const confirm = useTournamentStore((s) => s.confirmMatch);
  const [golesA, setGolesA] = useState(0);
  const [golesB, setGolesB] = useState(0);
  const [penalesA, setPenalesA] = useState(0);
  const [penalesB, setPenalesB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [gamesA, setGamesA] = useState(0);
  const [gamesB, setGamesB] = useState(0);
  const [puntosA, setPuntosA] = useState(0);
  const [puntosB, setPuntosB] = useState(0);
  const [gamesBySet, setGamesBySet] = useState<{ gamesA: number; gamesB: number }[]>([]);
  const [pointsBySet, setPointsBySet] = useState<{ pointsA: number; pointsB: number }[][]>([]);
  const [killsA, setKillsA] = useState(0);
  const [killsB, setKillsB] = useState(0);
  const [shooterWinner, setShooterWinner] = useState<"A" | "B" | null>(null);
  const [deathsA, setDeathsA] = useState(0);
  const [deathsB, setDeathsB] = useState(0);
  const [posicionA, setPosicionA] = useState(1);
  const [posicionB, setPosicionB] = useState(1);
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

  const scoreA = isFootball
    ? golesA
    : isTennis
    ? setsA
    : isShooter
    ? killsA
    : isCarreras
    ? posicionA
    : golesA;
  const scoreB = isFootball
    ? golesB
    : isTennis
    ? setsB
    : isShooter
    ? killsB
    : isCarreras
    ? posicionB
    : golesB;
  const setScoreA = (value: number) => {
    if (isFootball) setGolesA(value);
    else if (isTennis) setSetsA(value);
    else if (isShooter) setKillsA(value);
    else if (isCarreras) setPosicionA(Math.max(1, value));
    else setGolesA(value);
  };
  const setScoreB = (value: number) => {
    if (isFootball) setGolesB(value);
    else if (isTennis) setSetsB(value);
    else if (isShooter) setKillsB(value);
    else if (isCarreras) setPosicionB(Math.max(1, value));
    else setGolesB(value);
  };

  const totalSetsPlayed = isTennis ? setsA + setsB : 0;
  const draw = scoreA === scoreB;
  const tennisWinner = isTennis
    ? setsA > setsB
      ? "A"
      : setsB > setsA
      ? "B"
      : setsA || setsB
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
  const totalSetPointsA = pointsBySet.flat().reduce((sum, p) => sum + p.pointsA, 0);
  const totalSetPointsB = pointsBySet.flat().reduce((sum, p) => sum + p.pointsB, 0);

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
    setPointsBySet((current) => {
      const next = gamesBySet.map((set, index) => {
        const totalGames = set.gamesA + set.gamesB;
        const row = current[index] ? [...current[index]] : [];
        if (totalGames > row.length) {
          for (let j = row.length; j < totalGames; j++) row.push({ pointsA: 0, pointsB: 0 });
        } else if (totalGames < row.length) {
          row.length = totalGames;
        }
        return row;
      });
      return next;
    });
  }, [gamesBySet]);

  const handleConfirm = () => {
    setPassword("");
    setPasswordError("");
    setShowConfirmDialog(true);
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
    let score: ScoreData;
    if (isFootball) {
      const fb: any = { golesA, golesB };
      if (draw && hadPenales) { fb.penalesA = penalesA; fb.penalesB = penalesB; }
      score = fb;
    } else if (isTennis) {
      score = {
        setsA,
        setsB,
        gamesA: totalGameWinsA || undefined,
        gamesB: totalGameWinsB || undefined,
        puntosA: totalSetPointsA || undefined,
        puntosB: totalSetPointsB || undefined,
        gamesBySet: gamesBySet.length ? gamesBySet : undefined,
        pointsBySet: pointsBySet.length ? pointsBySet : undefined,
      };
    } else if (isShooter) {
      score = {
        killsA,
        killsB,
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
        posicionA,
        posicionB,
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
          className="relative glass w-full max-w-lg rounded-2xl p-6 neon-border"
        >
          <h3 className="font-display mb-1 text-xl uppercase tracking-widest">
            REGISTRAR ENFRENTAMIENTO
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {match.stage} · Ronda {match.round}
          </p>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <CompetitorAvatar c={a} size={56} />
              <p className="text-center text-sm font-semibold">{a.name}</p>
              {isTennis ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tennisBadgeClass(tennisBadgeA)}`}>
                  {tennisBadgeA}
                </span>
              ) : (
                <>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{scoreLabel}</label>
                  <input type="number" min={isCarreras ? 1 : 0} value={scoreA} onChange={(e) => setScoreA(+e.target.value)}
                    className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl" />
                </>
              )}
            </div>
            <div className="font-display text-2xl text-muted-foreground">VS</div>
            <div className="flex flex-col items-center gap-2">
              <CompetitorAvatar c={b} size={56} />
              <p className="text-center text-sm font-semibold">{b.name}</p>
              {isTennis ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tennisBadgeClass(tennisBadgeB)}`}>
                  {tennisBadgeB}
                </span>
              ) : (
                <>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{scoreLabel}</label>
                  <input type="number" min={isCarreras ? 1 : 0} value={scoreB} onChange={(e) => setScoreB(+e.target.value)}
                    className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl" />
                </>
              )}
            </div>
          </div>

          {isTennis && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold">Resultado tenis</p>
              <p className="text-xs text-muted-foreground">Ingresa sólo la cantidad de sets, games y puntos.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
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
                        value={setsA}
                        onChange={(e) => setSetsA(+e.target.value)}
                        className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                      />
                    </div>
                    <div className="grid gap-1 text-xs">
                      <label>{b.name}</label>
                      <input
                        type="number"
                        min={0}
                        value={setsB}
                        onChange={(e) => setSetsB(+e.target.value)}
                        className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Games</p>
                    <p className="text-sm font-semibold">{totalGameWinsA} - {totalGameWinsB}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {gamesBySet.map((set, index) => (
                      <div key={index} className="grid gap-2 rounded-xl border border-border/80 bg-background/50 p-3 text-xs">
                        <p className="uppercase tracking-[0.2em] text-muted-foreground">Game {index + 1}</p>
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
                              className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
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
                              className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Puntos</p>
                    <p className="text-sm font-semibold">{totalSetPointsA} - {totalSetPointsB}</p>
                  </div>
                  <div className="mt-4 space-y-4">
                    {pointsBySet.map((set, setIndex) => (
                      <div key={setIndex} className="rounded-xl border border-border/80 bg-background/50 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Set {setIndex + 1}</p>
                        <div className="mt-3 grid gap-3">
                          {set.map((point, pointIndex) => (
                            <div key={pointIndex} className="grid gap-2 sm:grid-cols-2 text-xs">
                              <div className="grid gap-1">
                                <label>Puntos set{setIndex + 1} {pointIndex + 1} – {a.name}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={point.pointsA}
                                  onChange={(e) => {
                                    const value = +e.target.value;
                                    setPointsBySet((prev) => prev.map((row, idx) => idx !== setIndex ? row : row.map((item, jdx) => jdx === pointIndex ? { ...item, pointsA: value } : item)));
                                  }}
                                  className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                                />
                              </div>
                              <div className="grid gap-1">
                                <label>Puntos set{setIndex + 1} {pointIndex + 1} – {b.name}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={point.pointsB}
                                  onChange={(e) => {
                                    const value = +e.target.value;
                                    setPointsBySet((prev) => prev.map((row, idx) => idx !== setIndex ? row : row.map((item, jdx) => jdx === pointIndex ? { ...item, pointsB: value } : item)));
                                  }}
                                  className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <input type="number" min={0} value={penalesA} onChange={(e) => setPenalesA(+e.target.value)}
                    placeholder={`Pen. ${a.name}`} className="rounded-md border border-border bg-background/50 px-2 py-1 text-center" />
                  <input type="number" min={0} value={penalesB} onChange={(e) => setPenalesB(+e.target.value)}
                    placeholder={`Pen. ${b.name}`} className="rounded-md border border-border bg-background/50 px-2 py-1 text-center" />
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
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                        placeholder="Ingresa la contraseña"
                        className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
                      />
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
