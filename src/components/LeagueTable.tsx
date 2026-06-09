import type { Tournament } from "@/types";
import { computeLeagueTable, computeGroupTable } from "@/services/tournamentEngine";
import { CompetitorAvatar } from "./CompetitorAvatar";

const TABLE_LAYOUTS: Record<string, Array<{ key: string; label: string }>> = {
  futbol: [
    { key: "PJ", label: "PJ" },
    { key: "PG", label: "PG" },
    { key: "PE", label: "PE" },
    { key: "PP", label: "PP" },
    { key: "GF", label: "GF" },
    { key: "GC", label: "GC" },
    { key: "DG", label: "DG" },
    { key: "PTS", label: "PTS" },
  ],
  tenis: [
    { key: "PJ", label: "PJ" },
    { key: "PG", label: "PG" },
    { key: "PP", label: "PP" },
    { key: "SW", label: "SW" },
    { key: "GW", label: "GW" },
    { key: "PTS", label: "PTS" },
  ],
  shooter: [
    { key: "PJ", label: "CJ" },
    { key: "PG", label: "CG" },
    { key: "PE", label: "CE" },
    { key: "PP", label: "CP" },
    { key: "KD", label: "KD" },
    { key: "PTS", label: "PTS" },
  ],
  carreras: [
    { key: "PJ", label: "CJ" },
    { key: "F1", label: "1º" },
    { key: "F2", label: "2º" },
    { key: "F3", label: "3º" },
    { key: "F4", label: "4+" },
    { key: "TIME", label: "TT" },
    { key: "PTS", label: "PTS" },
  ],
  default: [
    { key: "PJ", label: "PJ" },
    { key: "PG", label: "PG" },
    { key: "PE", label: "PE" },
    { key: "PP", label: "PP" },
    { key: "GF", label: "GF" },
    { key: "GC", label: "GC" },
    { key: "DG", label: "DG" },
    { key: "PTS", label: "PTS" },
  ],
};

const LEGENDS: Record<string, Array<{ abbr: string; desc: string }>> = {
  futbol: [
    { abbr: "PJ", desc: "Partidos jugados" },
    { abbr: "PG", desc: "Partidos ganados" },
    { abbr: "PE", desc: "Partidos empatados" },
    { abbr: "PP", desc: "Partidos perdidos" },
    { abbr: "GF", desc: "Goles a favor" },
    { abbr: "GC", desc: "Goles en contra" },
    { abbr: "DG", desc: "Diferencia de goles" },
    { abbr: "PTS", desc: "Puntos" },
  ],
  tenis: [
    { abbr: "PJ", desc: "Partidos jugados" },
    { abbr: "PG", desc: "Partidos ganados" },
    { abbr: "PP", desc: "Partidos perdidos" },
    { abbr: "SW", desc: "Sets ganados" },
    { abbr: "GW", desc: "Games ganados" },
    { abbr: "PTS", desc: "Puntos por games" },
  ],
  shooter: [
    { abbr: "CJ", desc: "Combates jugados" },
    { abbr: "CG", desc: "Combates ganados" },
    { abbr: "CE", desc: "Combates empatados" },
    { abbr: "CP", desc: "Combates perdidos" },
    { abbr: "KD", desc: "Personajes derribados" },
    { abbr: "PTS", desc: "Puntos de liga" },
  ],
  carreras: [
    { abbr: "CJ", desc: "Carreras jugadas" },
    { abbr: "1º", desc: "1er puesto" },
    { abbr: "2º", desc: "2do puesto" },
    { abbr: "3º", desc: "3er puesto" },
    { abbr: "4+", desc: "4to o peor" },
    { abbr: "TT", desc: "Tiempo total" },
    { abbr: "PTS", desc: "Puntos por posición" },
  ],
  default: [
    { abbr: "PJ", desc: "Partidos jugados" },
    { abbr: "PG", desc: "Partidos ganados" },
    { abbr: "PE", desc: "Partidos empatados" },
    { abbr: "PP", desc: "Partidos perdidos" },
    { abbr: "GF", desc: "Goles a favor" },
    { abbr: "GC", desc: "Goles en contra" },
    { abbr: "DG", desc: "Diferencia" },
    { abbr: "PTS", desc: "Puntos" },
  ],
};

function formatCell(value: number | string | undefined, key: string) {
  if (value === undefined || value === null) return "-";
  if (key === "TIME") {
    const seconds = Number(value);
    if (Number.isNaN(seconds)) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return String(value);
}

export function LeagueTable({ tournament, groupId, qualifies }: { tournament: Tournament; groupId?: string; qualifies?: number }) {
  const rows = groupId ? computeGroupTable(tournament, groupId) : computeLeagueTable(tournament);
  const layout = TABLE_LAYOUTS[tournament.game] ?? TABLE_LAYOUTS.default;
  const legend = LEGENDS[tournament.game] ?? LEGENDS.default;

  return (
    <div className="glass overflow-hidden rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Participante</th>
            {layout.map((col) => (
              <th key={col.key} className="p-2 text-center">{col.label}</th>
            ))}
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
                    {isQ && <span className="rounded-full bg-primary/30 px-2 text-[10px]">Clasificando</span>}
                  </div>
                </td>
                {layout.map((col) => (
                  <td key={col.key} className="p-2 text-center font-medium">
                    {formatCell((r as any)[col.key], col.key)}
                  </td>
                ))}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={layout.length + 2} className="p-6 text-center text-muted-foreground">Sin participantes</td></tr>
          )}
        </tbody>
      </table>
      <div className="border-t border-border/40 bg-secondary/30 p-4 text-xs text-muted-foreground">
        <div className="grid gap-2 sm:grid-cols-2">
          {legend.map((item) => (
            <div key={item.abbr}>
              <span className="font-semibold text-foreground">{item.abbr}</span>: {item.desc}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
