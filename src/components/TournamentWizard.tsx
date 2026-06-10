import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Competitor, GameType, Tournament, TournamentFormat } from "@/types";
import { useTournamentStore } from "@/store/useTournamentStore";
import { distributeGroups, generateLeagueMatches, generateKnockoutMatches, uid } from "@/services/tournamentEngine";
import { motion } from "framer-motion";

const GAMES: { id: GameType; label: string; icon: string }[] = [
  { id: "futbol", label: "Fútbol", icon: "⚽" },
  { id: "tenis", label: "Tenis", icon: "🎾" },
  { id: "shooter", label: "Shooter", icon: "🎯" },
  { id: "carreras", label: "Carreras", icon: "🏎" },
];

const FORMATS: { id: TournamentFormat; label: string; desc: string }[] = [
  { id: "liga", label: "Liga", desc: "Todos contra todos" },
  { id: "eliminatoria", label: "Eliminatoria", desc: "Llaves directas" },
  { id: "grupos_eliminatoria", label: "Grupos + Eliminatoria", desc: "Fase de grupos y playoffs" },
  { id: "liga_eliminatoria", label: "Liga + Eliminatoria", desc: "Liga regular y playoffs" },
];

export function TournamentWizard() {
  const nav = useNavigate();
  const upsert = useTournamentStore((s) => s.upsert);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("liga");
  const [game, setGame] = useState<GameType>("futbol");
  const [comps, setComps] = useState<Competitor[]>([]);
  const [newName, setNewName] = useState("");
  const [newImg, setNewImg] = useState<string | undefined>();
  const [editingCompetitorId, setEditingCompetitorId] = useState<string | null>(null);
  const [numGroups, setNumGroups] = useState(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [qualifiersFromLeague, setQualifiersFromLeague] = useState(4);
  const [pointsWin, setPointsWin] = useState(3);
  const [pointsDraw, setPointsDraw] = useState(1);
  const [pointsLoss, setPointsLoss] = useState(0);
  const [shooterPointValue, setShooterPointValue] = useState(1);
  const [racePositionPoints, setRacePositionPoints] = useState<number[]>([3, 2, 1]);

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setNewImg(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addCompetitor = () => {
    if (!newName.trim()) return;
    if (editingCompetitorId) {
      setComps((c) => c.map((comp) =>
        comp.id === editingCompetitorId ? { ...comp, name: newName.trim(), image: newImg } : comp
      ));
      setEditingCompetitorId(null);
    } else {
      setComps((c) => [...c, { id: uid(), name: newName.trim(), image: newImg }]);
    }
    setNewName("");
    setNewImg(undefined);
  };

  const cancelEdit = () => {
    setEditingCompetitorId(null);
    setNewName("");
    setNewImg(undefined);
  };

  const editCompetitor = (id: string) => {
    const comp = comps.find((c) => c.id === id);
    if (!comp) return;
    setEditingCompetitorId(id);
    setNewName(comp.name);
    setNewImg(comp.image);
  };

  const deleteCompetitor = (id: string) => {
    setComps((c) => c.filter((comp) => comp.id !== id));
    if (editingCompetitorId === id) cancelEdit();
  };

  const updateRacePositionPoint = (index: number, value: number) => {
    setRacePositionPoints((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const create = () => {
    const id = uid();
    const leagueConfig = game === "tenis"
      ? { pointsWin: 0, pointsDraw: 0, pointsLoss: 0 }
      : game === "shooter"
      ? { pointsWin: 0, pointsDraw: 0, pointsLoss: 0, pointsPerKill: shooterPointValue }
      : game === "carreras"
      ? { pointsWin: 0, pointsDraw: 0, pointsLoss: 0, racePositionPoints: racePositionPoints }
      : { pointsWin, pointsDraw, pointsLoss };

    let t: Tournament = {
      id, name: name || "Torneo sin nombre", format, game, competitors: comps,
      createdAt: Date.now(), matches: [],
      league: leagueConfig,
    };
    if (format === "liga") {
      t.matches = generateLeagueMatches(id, comps.map((c) => c.id));
    } else if (format === "eliminatoria") {
      t.matches = generateKnockoutMatches(id, comps.map((c) => c.id));
    } else if (format === "grupos_eliminatoria") {
      const groups = distributeGroups(comps.map((c) => c.id), numGroups);
      t.groups = groups;
      t.knockout = { qualifiersPerGroup };
      groups.forEach((g) => {
        const ms = generateLeagueMatches(id, g.competitorIds).map((m) => ({ ...m, stage: "grupo" as const, groupId: g.id }));
        t.matches.push(...ms);
      });
    } else if (format === "liga_eliminatoria") {
      t.knockout = { qualifiersFromLeague };
      t.matches = generateLeagueMatches(id, comps.map((c) => c.id));
    }
    upsert(t);
    nav({ to: "/torneo/$id", params: { id } });
  };

  const canNext1 = name.trim() && format && game;
  const canCreate = comps.length >= 2;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Stepper step={step} />

      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass space-y-6 rounded-2xl p-6">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Nombre del torneo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Copa de Amigos, Mundial FIFA…"
              className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Formato</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`rounded-lg border p-3 text-left transition ${format === f.id ? "border-primary bg-primary/15" : "border-border bg-secondary/30 hover:border-primary/50"}`}>
                  <p className="font-display text-sm uppercase tracking-wider">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Videojuego</label>
            <div className="flex flex-wrap gap-2">
              {GAMES.map((g) => (
                <button key={g.id} onClick={() => setGame(g.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${game === g.id ? "border-primary bg-primary/15" : "border-border bg-secondary/30 hover:border-primary/50"}`}>
                  <span className="text-lg">{g.icon}</span> {g.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!canNext1}
            className="btn-neon w-full rounded-lg bg-primary py-3 font-display uppercase tracking-widest disabled:opacity-50">
            Continuar
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass space-y-4 rounded-2xl p-6">
          <h3 className="font-display uppercase tracking-widest">Participantes</h3>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-45">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                placeholder="Jugador o equipo"
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Imagen</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/30 file:px-3 file:py-2 file:text-foreground" />
            </div>
            {newImg && <img src={newImg} className="h-10 w-10 rounded-full object-cover" alt="" />}
            <button onClick={addCompetitor} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold">
              {editingCompetitorId ? "Guardar cambios" : "+ Agregar"}
            </button>
            {editingCompetitorId && (
              <button onClick={cancelEdit} className="rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm">
                Cancelar edición
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {comps.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-3">
                <div className="flex items-center gap-3">
                  {c.image ? <img src={c.image} className="h-8 w-8 rounded-full object-cover" alt="" /> :
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/30 text-xs font-bold">{c.name[0]?.toUpperCase()}</div>}
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editCompetitor(c.id)} className="flex-1 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold">
                    Modificar
                  </button>
                  <button onClick={() => deleteCompetitor(c.id)} className="flex-1 rounded-lg border border-destructive/50 bg-destructive/20 px-3 py-2 text-xs font-semibold text-destructive">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(format === "liga" || format === "liga_eliminatoria" || format === "grupos_eliminatoria") && (
            <div className="space-y-4 border-t border-border pt-3">
              {game === "futbol" && (
                <div className="grid grid-cols-3 gap-2">
                  <NumberField label="Pts Victoria" value={pointsWin} onChange={setPointsWin} />
                  <NumberField label="Pts Empate" value={pointsDraw} onChange={setPointsDraw} />
                  <NumberField label="Pts Derrota" value={pointsLoss} onChange={setPointsLoss} />
                </div>
              )}

              {game === "tenis" && (
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-muted-foreground">Para tenis solo se configura el torneo. Los resultados se registran luego por sets y games.</p>
                </div>
              )}

              {game === "shooter" && (
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-muted-foreground">No se configura puntos por victoria/empate/derrota. Calcula los puntos según cada baja de personaje.</p>
                  <NumberField label="Puntos por cada baja" value={shooterPointValue} onChange={setShooterPointValue} min={0} />
                </div>
              )}

              {game === "carreras" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Define puntos por posición de carrera. Si hay 3 participantes, indica puntos hasta el 3er puesto; el resto sigue la lógica de posición.</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {Array.from({ length: Math.min(Math.max(comps.length || 3, 3), 5) }, (_, index) => (
                      <NumberField key={index} label={`Puesto ${index + 1}`} value={racePositionPoints[index] ?? Math.max(1, 3 - index)} onChange={(value) => updateRacePositionPoint(index, value)} min={0} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {format === "grupos_eliminatoria" && (
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
              <NumberField label="Cantidad de grupos" value={numGroups} onChange={setNumGroups} min={2} />
              <NumberField label="Clasifican por grupo" value={qualifiersPerGroup} onChange={setQualifiersPerGroup} min={1} />
            </div>
          )}
          {format === "liga_eliminatoria" && (
            <div className="border-t border-border pt-3">
              <NumberField label="Cuántos clasifican a playoffs" value={qualifiersFromLeague} onChange={setQualifiersFromLeague} min={2} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(1)} className="rounded-lg border border-border bg-secondary/40 px-4 py-2">← Volver</button>
            <button onClick={create} disabled={!canCreate}
              className="btn-neon flex-1 rounded-lg bg-primary py-3 font-display uppercase tracking-widest disabled:opacity-50">
              Crear torneo ({comps.length})
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input type="number" min={min} value={value} onChange={(e) => onChange(+e.target.value)}
        className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-center font-display" />
    </label>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {[1, 2].map((s) => (
        <div key={s} className={`flex h-9 w-9 items-center justify-center rounded-full font-display ${step >= s ? "bg-primary text-primary-foreground neon-border" : "bg-secondary text-muted-foreground"}`}>
          {s}
        </div>
      ))}
    </div>
  );
}
