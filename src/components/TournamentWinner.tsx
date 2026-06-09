import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { Tournament } from "@/types";
import { CompetitorAvatar } from "./CompetitorAvatar";
import { motion } from "framer-motion";

export function TournamentWinner({ tournament }: { tournament: Tournament }) {
  const champ = tournament.competitors.find((c) => c.id === tournament.championId);
  const ru = tournament.competitors.find((c) => c.id === tournament.runnerUpId);

  useEffect(() => {
    const end = Date.now() + 2500;
    const fire = () => {
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, colors: ["#8B5CF6", "#2563EB", "#22D3EE"] });
      if (Date.now() < end) requestAnimationFrame(fire);
    };
    fire();
  }, []);

  if (!champ) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass neon-border relative overflow-hidden rounded-2xl p-8 text-center"
    >
      <p className="font-display text-sm uppercase tracking-[0.4em] text-primary">Campeón del torneo</p>
      <div className="my-4 flex justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <CompetitorAvatar c={champ} size={120} />
        </motion.div>
      </div>
      <h2 className="font-display text-4xl uppercase neon-text">{champ.name}</h2>
      <div className="mt-2 text-5xl">🏆</div>
      {ru && <p className="mt-4 text-sm text-muted-foreground">Subcampeón: <span className="font-semibold text-foreground">{ru.name}</span></p>}
    </motion.div>
  );
}
