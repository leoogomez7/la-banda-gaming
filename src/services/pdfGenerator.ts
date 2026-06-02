import jsPDF from "jspdf";
import type { Tournament } from "@/types";
import { computeLeagueTable } from "./tournamentEngine";
import { computeStats } from "./statisticsEngine";

export async function exportTournamentPDF(t: Tournament) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(167, 139, 250);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("LA BANDA GAMING", 40, 50);
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.text(t.name, 40, 72);
  doc.text(new Date(t.createdAt).toLocaleDateString(), W - 140, 72);

  y = 120;
  doc.setTextColor(20);
  doc.setFontSize(14);
  doc.text("Participantes", 40, y); y += 18;
  doc.setFontSize(10);
  t.competitors.forEach((c, i) => { doc.text(`${i + 1}. ${c.name}`, 50, y); y += 14; if (y > 760) { doc.addPage(); y = 50; } });

  if (t.format === "liga" || t.format === "liga_eliminatoria") {
    y += 14; doc.setFontSize(14); doc.text("Tabla de posiciones", 40, y); y += 18;
    doc.setFontSize(10);
    doc.text("Pos  Nombre                       PJ  PG  PE  PP  GF  GC  DG  PTS", 40, y); y += 14;
    const table = computeLeagueTable(t);
    table.forEach((r, i) => {
      const c = t.competitors.find((x) => x.id === r.competitorId)!;
      const line = `${(i + 1).toString().padEnd(4)} ${c.name.slice(0, 24).padEnd(26)} ${r.PJ.toString().padEnd(3)} ${r.PG.toString().padEnd(3)} ${r.PE.toString().padEnd(3)} ${r.PP.toString().padEnd(3)} ${r.GF.toString().padEnd(3)} ${r.GC.toString().padEnd(3)} ${r.DG.toString().padEnd(3)} ${r.PTS}`;
      doc.text(line, 40, y); y += 13;
      if (y > 780) { doc.addPage(); y = 50; }
    });
  }

  // Matches
  y += 14; if (y > 720) { doc.addPage(); y = 50; }
  doc.setFontSize(14); doc.text("Resultados", 40, y); y += 16;
  doc.setFontSize(10);
  t.matches.filter((m) => m.status === "confirmado").forEach((m) => {
    const a = t.competitors.find((c) => c.id === m.competitorA)?.name ?? "BYE";
    const b = t.competitors.find((c) => c.id === m.competitorB)?.name ?? "BYE";
    const s: any = m.score ?? {};
    const score = `${s.golesA ?? s.puntosA ?? s.setsA ?? s.killsA ?? 0} - ${s.golesB ?? s.puntosB ?? s.setsB ?? s.killsB ?? 0}`;
    doc.text(`[${m.stage}] ${a}  ${score}  ${b}`, 40, y); y += 13;
    if (y > 780) { doc.addPage(); y = 50; }
  });

  // Stats
  const stats = computeStats(t);
  if (y > 700) { doc.addPage(); y = 50; }
  y += 12; doc.setFontSize(14); doc.text("Estadísticas", 40, y); y += 16;
  doc.setFontSize(10);
  doc.text(`Partidos jugados: ${stats.played}    Pendientes: ${stats.pending}`, 40, y); y += 14;
  if (stats.topScorer) { doc.text(`Máximo goleador: ${stats.topScorer.name} (${stats.topScorer.value})`, 40, y); y += 14; }
  if (stats.topWinner) { doc.text(`Máximo ganador: ${stats.topWinner.name} (${stats.topWinner.value})`, 40, y); y += 14; }
  if (stats.topKiller && stats.totalKills > 0) { doc.text(`Top kills: ${stats.topKiller.name} (${stats.topKiller.value})`, 40, y); y += 14; }

  if (t.championId) {
    if (y > 720) { doc.addPage(); y = 50; }
    y += 18;
    doc.setFontSize(18); doc.setTextColor(167, 139, 250);
    const champ = t.competitors.find((c) => c.id === t.championId)?.name ?? "—";
    doc.text(`🏆 Campeón: ${champ}`, 40, y);
  }

  doc.save(`${t.name.replace(/\s+/g, "_")}.pdf`);
}
