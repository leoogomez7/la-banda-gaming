import { useEffect, useMemo, useState } from "react";
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
  const [showTieBreak, setShowTieBreak] = useState(false);
  const [showMatchAccessDialog, setShowMatchAccessDialog] = useState(false);
  const [matchAccessPassword, setMatchAccessPassword] = useState("");
  const [matchAccessError, setMatchAccessError] = useState("");
  const [showMatchAccessPassword, setShowMatchAccessPassword] = useState(false);
  const [matchAccessUnlocked, setMatchAccessUnlocked] = useState(false);
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

  const requiredMatchPassword = import.meta.env.VITE_TOURNAMENT_PASSWORD ?? "";
  const needsMatchPassword = tab === "partidos" || tab === "bracket";

  const openMatchAccessDialog = () => {
    setMatchAccessPassword("");
    setMatchAccessError("");
    setShowMatchAccessDialog(true);
  };

  const handleMatchAccessConfirm = () => {
    if (!requiredMatchPassword) {
      setMatchAccessError("Contraseña no configurada en el entorno.");
      return;
    }
    if (matchAccessPassword !== requiredMatchPassword) {
      setMatchAccessError("Contraseña incorrecta.");
      return;
    }
    setMatchAccessUnlocked(true);
    setShowMatchAccessDialog(false);
  };

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

  useEffect(() => {
    if (needsMatchPassword && !matchAccessUnlocked) {
      openMatchAccessDialog();
    }
  }, [tab]);

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

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/40 p-1 sm:grid-cols-4">
            {(["tabla","partidos","bracket","stats"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`w-full rounded-lg px-3 py-2 text-xs uppercase tracking-wider transition whitespace-normal ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "tabla" ? "Posiciones" : t === "partidos" ? "Enfrentamientos" : t === "bracket" ? "Eliminatorias" : "Estadísticas"}
              </button>
            ))}
          </nav>
          <button onClick={() => setShowTieBreak(true)} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
            Reglas de desempate
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-secondary/20 p-4">
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
            <p className="text-center text-muted-foreground">Formato eliminatoria — ver la pestaña Eliminatorias.</p>
          )}
        </div>
      )}

      {tab === "partidos" && (
        <div>
          {matchAccessUnlocked ? (
            <div className="grid gap-3 md:grid-cols-2">
              {pendingFirst.map((m) => (
                <MatchCard key={m.id} match={m} tournament={tournament} onClick={() => setOpenMatch(m)} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border border-border bg-secondary/40 p-8 text-center">
              <p className="mb-4 text-sm text-foreground">Los enfrentamientos están ocultos.</p>
              <p className="mb-6 text-xs text-muted-foreground">Solo podrás verlos después de ingresar la contraseña.</p>
              <button
                onClick={openMatchAccessDialog}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
              >
                Ingresar contraseña
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "bracket" && (
        <div>
          {matchAccessUnlocked ? (
            <KnockoutBracket tournament={tournament} onMatchClick={setOpenMatch} />
          ) : (
            <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border border-border bg-secondary/40 p-8 text-center">
              <p className="mb-4 text-sm text-foreground">La llave eliminatoria está oculta.</p>
              <p className="mb-6 text-xs text-muted-foreground">Solo podrás verla después de ingresar la contraseña.</p>
              <button
                onClick={openMatchAccessDialog}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
              >
                Ingresar contraseña
              </button>
            </div>
          )}
        </div>
      )}
      {tab === "stats" && <StatisticsPanel tournament={tournament} />}
        </div>
      </div>

      <MatchDialog key={openMatch?.id ?? "none"} match={openMatch} tournament={tournament} onClose={() => setOpenMatch(null)} />
      {share && <ShareDialog tournament={tournament} onClose={() => setShare(false)} />}

      {showTieBreak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur">
          <div className="glass w-full max-w-2xl rounded-3xl border border-primary/30 p-6 neon-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-widest text-primary">Reglas de desempate</h2>
                <p className="mt-2 text-sm text-muted-foreground">Estas reglas aplican en Liga y Grupos. En Eliminatoria la tabla no se usa porque es 1 vs 1.</p>
              </div>
              <button onClick={() => setShowTieBreak(false)} className="rounded-full border border-border px-3 py-2 text-sm">Cerrar</button>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-6 text-foreground">
              {tournament.game === "futbol" && (
                <div>
                  <p className="font-semibold uppercase tracking-widest text-xs text-primary">Fútbol</p>
                  <p>El orden de desempate es:</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Más puntos</li>
                    <li>Mejor diferencia de goles</li>
                    <li>Más goles a favor</li>
                    <li>Menos partidos jugados</li>
                    <li>Ganador del enfrentamiento directo</li>
                    <li>Si todo es igual, se define con un 1 vs 1</li>
                  </ol>
                </div>
              )}
              {tournament.game === "tenis" && (
                <div>
                  <p className="font-semibold uppercase tracking-widest text-xs text-primary">Tenis</p>
                  <p>El orden de desempate es:</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Más partidos ganados</li>
                    <li>Más puntos (cada game se valora: 0 → 0 / 15 → 1 / 30 → 2 / 40 → 3 / 40d → 4)</li>
                    <li>Más sets ganados</li>
                    <li>Más games ganados</li>
                    <li>Menos partidos jugados</li>
                    <li>Ganador del enfrentamiento directo</li>
                    <li>Si todo es igual, se define con un 1 vs 1</li>
                  </ol>
                </div>
              )}
              {tournament.game === "shooter" && (
                <div>
                  <p className="font-semibold uppercase tracking-widest text-xs text-primary">Shooter</p>
                  <p>El orden de desempate es:</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Más combates ganados</li>
                    <li>Más personajes derribados</li>
                    <li>Más combates empatados</li>
                    <li>Menos combates jugados</li>
                    <li>Ganador del enfrentamiento directo</li>
                    <li>Si todo es igual, se define con un 1 vs 1</li>
                  </ol>
                </div>
              )}
              {tournament.game === "carreras" && (
                <div>
                  <p className="font-semibold uppercase tracking-widest text-xs text-primary">Carreras</p>
                  <p>El orden de desempate es:</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Más puntos</li>
                    <li>Más 1er puesto</li>
                    <li>Más 2do puesto</li>
                    <li>Más 3er puesto</li>
                    <li>Menos tiempo total en carrera</li>
                    <li>Menos carreras jugadas</li>
                    <li>Si todo es igual, se define con un 1 vs 1</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showMatchAccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur">
          <div className="glass w-full max-w-md rounded-3xl border border-primary/30 p-6 neon-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-widest text-primary">Ingresar contraseña</h2>
                <p className="mt-2 text-sm text-muted-foreground">Para ver los enfrentamientos ingresa la contraseña del torneo.</p>
              </div>
              <button onClick={() => setShowMatchAccessDialog(false)} className="rounded-full border border-border px-3 py-2 text-sm">Cerrar</button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold uppercase tracking-widest text-muted-foreground">Contraseña</label>
              <input
                type={showMatchAccessPassword ? "text" : "password"}
                value={matchAccessPassword}
                onChange={(e) => { setMatchAccessPassword(e.target.value); setMatchAccessError(""); }}
                className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={showMatchAccessPassword}
                  onChange={(e) => setShowMatchAccessPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background"
                />
                Mostrar contraseña
              </label>
              {matchAccessError && <p className="text-sm text-destructive">{matchAccessError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMatchAccessDialog(false)}
                  className="rounded-xl border border-border bg-secondary/40 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMatchAccessConfirm}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
