import type { Tournament } from "@/types";
import { computeLeagueTable, computeGroupTable } from "@/services/tournamentEngine";
import { CompetitorAvatar } from "./CompetitorAvatar";

export function LeagueTable({ tournament, groupId, qualifies }: { tournament: Tournament; groupId?: string; qualifies?: number }) {
  const rows = groupId ? computeGroupTable(tournament, groupId) : computeLeagueTable(tournament);
  return (
    <div className="glass overflow-hidden rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Participante</th>
            <th className="p-2">PJ</th><th className="p-2">PG</th><th className="p-2">PE</th><th className="p-2">PP</th>
            <th className="p-2">GF</th><th className="p-2">GC</th><th className="p-2">DG</th><th className="p-2 text-primary">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const c = tournament.competitors.find((x) => x.id === r.competitorId);
            const isQ = qualifies && i < qualifies;
            return (
              <tr key={r.competitorId} className={`border-t border-border/40 ${isQ ? "bg-primary/10" : ""}`}>
                <td className="p-2 font-display">{i + 1}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <CompetitorAvatar c={c} size={26} />
                    <span className="font-semibold">{c?.name}</span>
                    {isQ && <span className="rounded-full bg-primary/30 px-2 text-[10px]">Q</span>}
                  </div>
                </td>
                <td className="p-2 text-center">{r.PJ}</td>
                <td className="p-2 text-center">{r.PG}</td>
                <td className="p-2 text-center">{r.PE}</td>
                <td className="p-2 text-center">{r.PP}</td>
                <td className="p-2 text-center">{r.GF}</td>
                <td className="p-2 text-center">{r.GC}</td>
                <td className="p-2 text-center">{r.DG}</td>
                <td className="p-2 text-center font-display text-primary">{r.PTS}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">Sin participantes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
