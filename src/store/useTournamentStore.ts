import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tournament, Match, ScoreData } from "@/types";
import { applyMatchResult } from "@/services/tournamentEngine";

interface State {
  tournaments: Tournament[];
  upsert: (t: Tournament) => void;
  get: (id: string) => Tournament | undefined;
  remove: (id: string) => void;
  duplicate: (id: string) => string | null;
  confirmMatch: (tournamentId: string, matchId: string, score: ScoreData) => void;
  appendMatches: (tournamentId: string, matches: Match[]) => void;
  patch: (id: string, partial: Partial<Tournament>) => void;
}

export const useTournamentStore = create<State>()(
  persist(
    (set, getStore) => ({
      tournaments: [],
      upsert: (t) =>
        set((s) => {
          const i = s.tournaments.findIndex((x) => x.id === t.id);
          const next = [...s.tournaments];
          if (i >= 0) next[i] = t; else next.push(t);
          return { tournaments: next };
        }),
      get: (id) => getStore().tournaments.find((t) => t.id === id),
      remove: (id) => set((s) => ({ tournaments: s.tournaments.filter((t) => t.id !== id) })),
      duplicate: (id) => {
        const t = getStore().tournaments.find((x) => x.id === id);
        if (!t) return null;
        const copy: Tournament = {
          ...t,
          id: Math.random().toString(36).slice(2, 10),
          name: `${t.name} (copia)`,
          createdAt: Date.now(),
          matches: t.matches.map((m) => ({ ...m, status: "pendiente", score: undefined, winnerId: undefined, loserId: undefined })),
          championId: undefined, runnerUpId: undefined, thirdId: undefined, finished: false,
        };
        set((s) => ({ tournaments: [...s.tournaments, copy] }));
        return copy.id;
      },
      confirmMatch: (tournamentId, matchId, score) =>
        set((s) => {
          const t = s.tournaments.find((x) => x.id === tournamentId);
          if (!t) return s;
          const updated = applyMatchResult(t, matchId, score);
          return { tournaments: s.tournaments.map((x) => (x.id === tournamentId ? updated : x)) };
        }),
      appendMatches: (tournamentId, matches) =>
        set((s) => ({
          tournaments: s.tournaments.map((t) =>
            t.id === tournamentId ? { ...t, matches: [...t.matches, ...matches] } : t
          ),
        })),
      patch: (id, partial) =>
        set((s) => ({ tournaments: s.tournaments.map((t) => (t.id === id ? { ...t, ...partial } : t)) })),
    }),
    { name: "la-banda-gaming" }
  )
);
