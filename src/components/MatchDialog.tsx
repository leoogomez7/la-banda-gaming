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
  const [hadPenales, setHadPenales] = useState(false);
  const [warned, setWarned] = useState(false);

  if (!match) return null;
  const a = tournament.competitors.find((c) => c.id === match.competitorA);
  const b = tournament.competitors.find((c) => c.id === match.competitorB);
  if (!a || !b) return null;
  const isFootball = tournament.game === "futbol";
  const labelA = "A";
  const labelB = "B";
  void labelA; void labelB;
  const draw = golesA === golesB;
  const isElim = match.stage !== "liga" && match.stage !== "grupo";

  const handleConfirm = () => {
    if (!warned) { setWarned(true); return; }
    let score: ScoreData;
    if (isFootball) {
      const fb: any = { golesA, golesB };
      if (draw && hadPenales) { fb.penalesA = penalesA; fb.penalesB = penalesB; }
      score = fb;
    } else {
      score = { puntosA: golesA, puntosB: golesB } as ScoreData;
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
              <input type="number" min={0} value={golesA} onChange={(e) => setGolesA(+e.target.value)}
                className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl" />
            </div>
            <div className="font-display text-2xl text-muted-foreground">VS</div>
            <div className="flex flex-col items-center gap-2">
              <CompetitorAvatar c={b} size={56} />
              <p className="text-center text-sm font-semibold">{b.name}</p>
              <input type="number" min={0} value={golesB} onChange={(e) => setGolesB(+e.target.value)}
                className="font-display w-20 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-2xl" />
            </div>
          </div>

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
