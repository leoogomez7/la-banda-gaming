import type { Match, Tournament } from "@/types";
import { CompetitorAvatar } from "./CompetitorAvatar";

const STAGE_LABEL: Record<string, string> = {
  "16": "Octavos", cuartos: "Cuartos", semifinal: "Semifinal", final: "Final",
};

export function KnockoutBracket({ tournament, onMatchClick }: { tournament: Tournament; onMatchClick?: (m: Match) => void }) {
  const matches = tournament.matches.filter((m) => ["16","cuartos","semifinal","final"].includes(m.stage));
  if (!matches.length) return <div className="text-center text-muted-foreground">Llave aún no generada.</div>;

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a,b)=>a-b);
  const byRound = rounds.map((r) => matches.filter((m) => m.round === r));

  return (
    <div className="glass overflow-x-auto rounded-xl p-4">
      <div className="flex items-stretch gap-6 min-w-max">
        {byRound.map((roundMatches, idx) => (
          <div key={idx} className="flex flex-col justify-around gap-4 min-w-[240px]">
            <h4 className="font-display text-center text-xs uppercase tracking-widest text-primary">
              {STAGE_LABEL[roundMatches[0].stage] ?? roundMatches[0].stage}
            </h4>
            {roundMatches.map((m) => {
              const a = tournament.competitors.find((c) => c.id === m.competitorA);
              const b = tournament.competitors.find((c) => c.id === m.competitorB);
              const s: any = m.score ?? {};
              const sA = s.golesA ?? s.puntosA ?? "-";
              const sB = s.golesB ?? s.puntosB ?? "-";
              const winA = m.winnerId && m.winnerId === m.competitorA;
              const winB = m.winnerId && m.winnerId === m.competitorB;
              return (
                <button
                  key={m.id}
                  onClick={() => onMatchClick?.(m)}
                  disabled={m.status === "confirmado" || !a || !b}
                  className={`rounded-lg border bg-card/60 p-2 text-left transition hover:border-primary/60 ${
                    m.status === "confirmado" ? "border-primary/40" : "border-border"
                  }`}
                >
                  <Row c={a} score={sA} highlight={!!winA} />
                  <div className="my-1 h-px bg-border/60" />
                  <Row c={b} score={sB} highlight={!!winB} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ c, score, highlight }: { c: any; score: any; highlight: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${highlight ? "" : "opacity-80"}`}>
      <div className="flex items-center gap-2 min-w-0">
        <CompetitorAvatar c={c} size={24} />
        <span className={`truncate text-sm ${highlight ? "font-bold neon-text" : ""}`}>{c?.name ?? "BYE"}</span>
      </div>
      <span className={`font-display tabular-nums text-sm ${highlight ? "text-primary" : "text-muted-foreground"}`}>{score}</span>
    </div>
  );
}
