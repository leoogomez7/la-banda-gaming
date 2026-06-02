import type { Match, Tournament } from "@/types";
import { CompetitorAvatar } from "./CompetitorAvatar";
import { motion } from "framer-motion";

interface Props {
  match: Match;
  tournament: Tournament;
  onClick?: () => void;
}

export function MatchCard({ match, tournament, onClick }: Props) {
  const a = tournament.competitors.find((c) => c.id === match.competitorA);
  const b = tournament.competitors.find((c) => c.id === match.competitorB);
  const s: any = match.score ?? {};
  const sA = s.golesA ?? s.puntosA ?? s.setsA ?? s.killsA ?? "-";
  const sB = s.golesB ?? s.puntosB ?? s.setsB ?? s.killsB ?? "-";
  const isWinA = match.winnerId && match.winnerId === match.competitorA;
  const isWinB = match.winnerId && match.winnerId === match.competitorB;
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      disabled={match.status === "confirmado"}
      className={`glass w-full rounded-xl p-3 text-left transition disabled:opacity-90 ${
        match.status === "confirmado" ? "border-primary/40" : "hover:border-accent/60"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
          {match.stage} · R{match.round}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
            match.status === "confirmado"
              ? "bg-primary/30 text-primary-foreground"
              : match.status === "en_juego"
              ? "bg-accent/30 text-accent-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {match.status.replace("_", " ")}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className={`flex items-center gap-2 ${isWinA ? "" : isWinB ? "opacity-60" : ""}`}>
          <CompetitorAvatar c={a} />
          <span className="truncate text-sm font-semibold">{a?.name ?? "BYE"}</span>
        </div>
        <div className="font-display text-2xl tabular-nums">
          <span className={isWinA ? "neon-text" : ""}>{sA}</span>
          <span className="mx-1 text-muted-foreground">·</span>
          <span className={isWinB ? "neon-text" : ""}>{sB}</span>
        </div>
        <div className={`flex items-center justify-end gap-2 ${isWinB ? "" : isWinA ? "opacity-60" : ""}`}>
          <span className="truncate text-sm font-semibold">{b?.name ?? "BYE"}</span>
          <CompetitorAvatar c={b} />
        </div>
      </div>
    </motion.button>
  );
}
