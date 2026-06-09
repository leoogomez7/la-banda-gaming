import { useState } from "react";
import type { Match, ScoreData, Tournament } from "@/types";
import { useTournamentStore } from "@/store/useTournamentStore";
import { motion, AnimatePresence } from "framer-motion";
import { CompetitorAvatar } from "./CompetitorAvatar";

interface Props {
  match: Match | null;
  tournament: Tournament;
  onClose: () => void;
}

export function MatchDialog({ match, tournament, onClose }: Props) {
  const confirm = useTournamentStore((s) => s.confirmMatch);
  const [golesA, setGolesA] = useState(0);
  const [golesB, setGolesB] = useState(0);
  const [penalesA, setPenalesA] = useState(0);
  const [penalesB, setPenalesB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [killsA, setKillsA] = useState(0);
  const [killsB, setKillsB] = useState(0);
  const [deathsA, setDeathsA] = useState(0);
  const [deathsB, setDeathsB] = useState(0);
  const [posicionA, setPosicionA] = useState(1);
  const [posicionB, setPosicionB] = useState(2);
  const [tiempoA, setTiempoA] = useState("");
  const [tiempoB, setTiempoB] = useState("");
  const [detalle, setDetalle] = useState("");
  const [mvp, setMvp] = useState("");
  const [pole, setPole] = useState<"A" | "B" | "" >("");
  const [hadPenales, setHadPenales] = useState(false);
  const [warned, setWarned] = useState(false);

  if (!match) return null;
  const a = tournament.competitors.find((c) => c.id === match.competitorA);
  const b = tournament.competitors.find((c) => c.id === match.competitorB);
  if (!a || !b) return null;
  const isFootball = tournament.game === "futbol";
  const isTennis = tournament.game === "tenis";
  const isShooter = tournament.game === "shooter";
  const isCarreras = tournament.game === "carreras";
  const scoreLabel = isFootball
    ? "Goles"
    : isTennis
    ? "Sets"
    : isShooter
    ? "Kills"
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
  const draw = scoreA === scoreB;
  const isElim = match.stage !== "liga" && match.stage !== "grupo";

  const handleConfirm = () => {
    if (!warned) { setWarned(true); return; }
    let score: ScoreData;
    if (isFootball) {
      const fb: any = { golesA, golesB };
      if (draw && hadPenales) { fb.penalesA = penalesA; fb.penalesB = penalesB; }
      score = fb;
    } else if (isTennis) {
      score = { setsA, setsB, detalle: detalle || undefined };
    } else if (isShooter) {
      score = {
        killsA,
        killsB,
        deathsA: deathsA || undefined,
        deathsB: deathsB || undefined,
        mvp: mvp || undefined,
      };
    } else if (isCarreras) {
      score = {
        posicionA,
        posicionB,
        tiempoA: tiempoA || undefined,
        tiempoB: tiempoB || undefined,
        pole: pole || undefined,
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
          className="glass w-full max-w-lg rounded-2xl p-6 neon-border"
        >
          <h3 className="font-display mb-1 text-xl uppercase tracking-widest">Registrar partido</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {match.stage} · Ronda {match.round}
          </p>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <CompetitorAvatar c={a} size={56} />
              <p className="text-center text-sm font-semibold">{a.name}</p>
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{scoreLabel}</label>
              <input type="number" min={isCarreras ? 1 : 0} value={scoreA} onChange={(e) => setScoreA(+e.target.value)}
                className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl" />
            </div>
            <div className="font-display text-2xl text-muted-foreground">VS</div>
            <div className="flex flex-col items-center gap-2">
              <CompetitorAvatar c={b} size={56} />
              <p className="text-center text-sm font-semibold">{b.name}</p>
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{scoreLabel}</label>
              <input type="number" min={isCarreras ? 1 : 0} value={scoreB} onChange={(e) => setScoreB(+e.target.value)}
                className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl" />
            </div>
          </div>

          {isTennis && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <label className="text-sm font-semibold">Detalle de sets</label>
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Ej. 6-3, 4-6, 7-5"
                className="mt-2 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          )}

          {isShooter && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold">Detalles de shooter</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="number" min={0} value={deathsA} onChange={(e) => setDeathsA(+e.target.value)}
                  placeholder={`${a.name} deaths`} className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                <input type="number" min={0} value={deathsB} onChange={(e) => setDeathsB(+e.target.value)}
                  placeholder={`${b.name} deaths`} className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
              </div>
              <input type="text" value={mvp} onChange={(e) => setMvp(e.target.value)}
                placeholder="MVP"
                className="mt-3 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm" />
            </div>
          )}

          {isCarreras && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold">Detalles de carrera</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="text" value={tiempoA} onChange={(e) => setTiempoA(e.target.value)}
                  placeholder={`${a.name} tiempo`} className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
                <input type="text" value={tiempoB} onChange={(e) => setTiempoB(e.target.value)}
                  placeholder={`${b.name} tiempo`} className="rounded-md border border-border bg-background/50 px-2 py-1 text-center text-sm" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span>Pole position:</span>
                <button type="button" onClick={() => setPole("A")}
                  className={`rounded-lg px-3 py-1 ${pole === "A" ? "bg-primary text-primary-foreground" : "bg-background/70"}`}>
                  {a.name}
                </button>
                <button type="button" onClick={() => setPole("B")}
                  className={`rounded-lg px-3 py-1 ${pole === "B" ? "bg-primary text-primary-foreground" : "bg-background/70"}`}>
                  {b.name}
                </button>
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

          {isElim && draw && (!isFootball || !hadPenales) && (
            <p className="mt-3 text-xs text-destructive">
              En eliminatoria no puede haber empate. {isFootball ? "Marca penales." : "Ajusta el marcador."}
            </p>
          )}

          {warned && (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              ⚠ Una vez confirmado no podrá modificarse.
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border bg-secondary/40 py-2 text-sm">
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isElim && draw && (!isFootball || !hadPenales)}
              className="btn-neon flex-1 rounded-lg bg-primary py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              {warned ? "Sí, confirmar" : "Confirmar resultado"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
