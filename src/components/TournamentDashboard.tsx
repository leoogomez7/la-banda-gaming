import { useMemo, useState } from "react";
import type { Match, Tournament } from "@/types";
import { useTournamentStore } from "@/store/useTournamentStore";
import { LeagueTable } from "./LeagueTable";
import { KnockoutBracket } from "./KnockoutBracket";
import { MatchCard } from "./MatchCard";
import { MatchDialog } from "./MatchDialog";
import { StatisticsPanel } from "./StatisticsPanel";
import { TournamentWinner } from "./TournamentWinner";
import { ShareDialog } from "./ShareDialog";
import { computeGroupTable, computeLeagueTable, seedKnockoutFromRanking } from "@/services/tournamentEngine";
import { Link, useNavigate } from "@tanstack/react-router";

type Tab = "tabla" | "partidos" | "bracket" | "stats";

export function TournamentDashboard({ tournament }: { tournament: Tournament }) {
  const [tab, setTab] = useState<Tab>(tournament.format === "eliminatoria" ? "bracket" : "tabla");
  const [openMatch, setOpenMatch] = useState<Match | null>(null);
  const [share, setShare] = useState(false);
  const nav = useNavigate();
  const appendMatches = useTournamentStore((s) => s.appendMatches);
  const remove = useTournamentStore((s) => s.remove);
  const duplicate = useTournamentStore((s) => s.duplicate);

  const hasBracket = tournament.matches.some((m) => ["16","cuartos","semifinal","final"].includes(m.stage));
  const groupStageDone = tournament.format === "grupos_eliminatoria" &&
    tournament.matches.filter((m) => m.stage === "grupo").every((m) => m.status === "confirmado") &&
    (tournament.matches.filter((m) => m.stage === "grupo").length > 0);
  const leagueDone = (tournament.format === "liga" || tournament.format === "liga_eliminatoria") &&
    tournament.matches.filter((m) => m.stage === "liga").every((m) => m.status === "confirmado") &&
    tournament.matches.filter((m) => m.stage === "liga").length > 0;

  const generatePlayoffs = () => {
    let ranking: string[] = [];
    if (tournament.format === "grupos_eliminatoria" && tournament.groups) {
      const q = tournament.knockout?.qualifiersPerGroup ?? 2;
      // interleave: 1st of each group, 2nd of each group...
      const perGroup = tournament.groups.map((g) => computeGroupTable(tournament, g.id));
      for (let pos = 0; pos < q; pos++) for (const tbl of perGroup) if (tbl[pos]) ranking.push(tbl[pos].competitorId);
    } else if (tournament.format === "liga_eliminatoria") {
      const q = tournament.knockout?.qualifiersFromLeague ?? 4;
      ranking = computeLeagueTable(tournament).slice(0, q).map((r) => r.competitorId);
    }
    if (ranking.length < 2) return alert("Necesitas al menos 2 clasificados.");
    const ko = seedKnockoutFromRanking(tournament.id, ranking);
    appendMatches(tournament.id, ko);
    setTab("bracket");
  };

  const pendingFirst = useMemo(
    () => [...tournament.matches].sort((a, b) => {
      if (a.status !== b.status) return a.status === "confirmado" ? 1 : -1;
      return a.round - b.round;
    }),
    [tournament.matches]
  );

  const showGenerateBtn = !hasBracket && (groupStageDone || leagueDone);

  return (
    <div id="tournament-canvas" className="space-y-6">
      <header className="glass neon-border flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <Link to="/torneos" className="text-xs text-muted-foreground hover:text-foreground">← Mis torneos</Link>
          <h1 className="font-display text-2xl uppercase neon-text">{tournament.name}</h1>
          <p className="text-xs text-muted-foreground">{tournament.format.replace("_", " + ")} · {tournament.game} · {tournament.competitors.length} participantes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShare(true)} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">Compartir</button>
          <button onClick={() => { duplicate(tournament.id); alert("Torneo duplicado"); }} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">Duplicar</button>
          <button onClick={() => { if (confirm("¿Eliminar torneo?")) { remove(tournament.id); nav({ to: "/torneos" }); } }}
            className="rounded-lg border border-destructive/50 bg-destructive/20 px-3 py-2 text-sm text-destructive">Eliminar</button>
        </div>
      </header>

      {tournament.finished && <TournamentWinner tournament={tournament} />}

      {showGenerateBtn && (
        <button onClick={generatePlayoffs} className="btn-neon w-full rounded-xl bg-primary py-3 font-display uppercase tracking-widest">
          🎯 Generar llave eliminatoria
        </button>
      )}

      <nav className="flex gap-1 rounded-xl bg-secondary/40 p-1">
        {(["tabla","partidos","bracket","stats"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs uppercase tracking-wider transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "tabla" ? "Tabla" : t === "partidos" ? "Partidos" : t === "bracket" ? "Llave" : "Stats"}
          </button>
        ))}
      </nav>

      {tab === "tabla" && (
        <div className="space-y-4">
          {tournament.format === "grupos_eliminatoria" && tournament.groups?.map((g) => (
            <div key={g.id} className="space-y-2">
              <h3 className="font-display text-sm uppercase tracking-widest text-primary">{g.name}</h3>
              <LeagueTable tournament={tournament} groupId={g.id} qualifies={tournament.knockout?.qualifiersPerGroup} />
            </div>
          ))}
          {(tournament.format === "liga" || tournament.format === "liga_eliminatoria") && (
            <LeagueTable tournament={tournament} qualifies={tournament.knockout?.qualifiersFromLeague} />
          )}
          {tournament.format === "eliminatoria" && (
            <p className="text-center text-muted-foreground">Formato eliminatoria — ver la pestaña Llave.</p>
          )}
        </div>
      )}

      {tab === "partidos" && (
        <div className="grid gap-3 md:grid-cols-2">
          {pendingFirst.map((m) => (
            <MatchCard key={m.id} match={m} tournament={tournament} onClick={() => setOpenMatch(m)} />
          ))}
        </div>
      )}

      {tab === "bracket" && <KnockoutBracket tournament={tournament} onMatchClick={setOpenMatch} />}
      {tab === "stats" && <StatisticsPanel tournament={tournament} />}

      <MatchDialog match={openMatch} tournament={tournament} onClose={() => setOpenMatch(null)} />
      {share && <ShareDialog tournament={tournament} onClose={() => setShare(false)} />}
    </div>
  );
}
