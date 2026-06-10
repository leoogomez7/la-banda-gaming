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
  doc.text("Participantes", 40, y);
  y += 18;
  doc.setFontSize(10);
  const columnWidth = (W - 80) / 2;
  t.competitors.forEach((c, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 50 + col * columnWidth;
    const lineY = y + row * 14;
    doc.text(`${index + 1}. ${c.name}`, x, lineY);
    if (lineY > 740) {
      doc.addPage();
      y = 50;
      doc.setFontSize(10);
    }
  });
  y += Math.ceil(t.competitors.length / 2) * 14 + 24;

  if (t.format === "liga" || t.format === "liga_eliminatoria") {
    if (y > 660) { doc.addPage(); y = 50; }
    doc.setFontSize(14);
    doc.setTextColor(167, 139, 250);
    doc.text("Tabla de posiciones", 40, y);
    y += 18;
    doc.setFontSize(9);
    doc.setTextColor(20);
    doc.text("Pos  Nombre                    PJ  PG  PE  PP  GF  GC  DG  PTS", 40, y);
    y += 14;
    const table = computeLeagueTable(t);
    table.forEach((r, i) => {
      const c = t.competitors.find((x) => x.id === r.competitorId)!;
      const line = `${(i + 1).toString().padEnd(4)} ${c.name.slice(0, 22).padEnd(24)} ${r.PJ.toString().padEnd(3)} ${r.PG.toString().padEnd(3)} ${r.PE.toString().padEnd(3)} ${r.PP.toString().padEnd(3)} ${r.GF.toString().padEnd(3)} ${r.GC.toString().padEnd(3)} ${r.DG.toString().padEnd(3)} ${r.PTS}`;
      doc.text(line, 40, y);
      y += 12;
      if (y > 760) { doc.addPage(); y = 50; doc.setFontSize(9); }
    });
    y += 14;
  }

  if (y > 640) { doc.addPage(); y = 50; }
  doc.setFontSize(14);
  doc.setTextColor(167, 139, 250);
  doc.text("Resultados", 40, y);
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(20);
  t.matches.filter((m) => m.status === "confirmado").forEach((m) => {
    const a = t.competitors.find((c) => c.id === m.competitorA)?.name ?? "BYE";
    const b = t.competitors.find((c) => c.id === m.competitorB)?.name ?? "BYE";
    const s: any = m.score ?? {};
    const score = `${s.golesA ?? s.setsA ?? s.puntosA ?? s.killsA ?? s.posicionA ?? 0} - ${s.golesB ?? s.setsB ?? s.puntosB ?? s.killsB ?? s.posicionB ?? 0}`;
    doc.text(`[${m.stage}] ${a} ${score} ${b}`, 40, y);
    y += 13;
    if (y > 760) { doc.addPage(); y = 50; doc.setFontSize(10); }
  });

  const stats = computeStats(t);
  if (y > 620) { doc.addPage(); y = 50; }
  y += 14;
  doc.setFontSize(14);
  doc.setTextColor(167, 139, 250);
  doc.text("Estadísticas", 40, y);
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(20);
  const statsRows = [
    `Partidos jugados: ${stats.played}`,
    `Pendientes: ${stats.pending}`,
    `Goles totales: ${stats.totalGoals}`,
    `Promedio goles: ${stats.avgGoals}`,
    ...(stats.totalKills > 0 ? [`Kills totales: ${stats.totalKills}`, `Promedio kills: ${stats.avgKills}`] : []),
    stats.topScorer ? `Máximo goleador: ${stats.topScorer.name} (${stats.topScorer.value})` : null,
    stats.topWinner ? `Máximo ganador: ${stats.topWinner.name} (${stats.topWinner.value})` : null,
    stats.mostConceded ? `Más goles recibidos: ${stats.mostConceded.name} (${stats.mostConceded.value})` : null,
    stats.mostLost ? `Más perdidos: ${stats.mostLost.name} (${stats.mostLost.value})` : null,
    stats.bestEfficiency ? `Mejor efectividad: ${stats.bestEfficiency.name} (${stats.bestEfficiency.value})` : null,
    stats.worstEfficiency ? `Peor efectividad: ${stats.worstEfficiency.name} (${stats.worstEfficiency.value})` : null,
    stats.highestScoringMatch ? `Resultado más goleador: ${stats.highestScoringMatch.match}` : null,
    stats.biggestMarginMatch ? `Mayor diferencia: ${stats.biggestMarginMatch.match}` : null,
  ].filter(Boolean) as string[];
  statsRows.forEach((line) => {
    doc.text(line, 40, y);
    y += 14;
    if (y > 760) { doc.addPage(); y = 50; doc.setFontSize(10); }
  });

  if (t.championId) {
    if (y > 720) { doc.addPage(); y = 50; }
    y += 16;
    doc.setFontSize(18);
    doc.setTextColor(167, 139, 250);
    const champ = t.competitors.find((c) => c.id === t.championId)?.name ?? "—";
    doc.text(`🏆 Campeón: ${champ}`, 40, y);
  }

  doc.save(`${t.name.replace(/\s+/g, "_")}.pdf`);
}
