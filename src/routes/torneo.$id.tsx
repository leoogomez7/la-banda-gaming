import { createFileRoute, Link } from "@tanstack/react-router";
import { useTournamentStore } from "@/store/useTournamentStore";
import { TournamentDashboard } from "@/components/TournamentDashboard";

export const Route = createFileRoute("/torneo/$id")({
  head: () => ({ meta: [{ title: "Torneo" }] }),
  component: Page,
  notFoundComponent: () => <div className="p-10 text-center">Torneo no encontrado.</div>,
  errorComponent: ({ error }) => <div className="p-10 text-center text-destructive">{error.message}</div>,
});

function Page() {
  const { id } = Route.useParams();
  const tournament = useTournamentStore((s) => s.tournaments.find((t) => t.id === id));
  if (!tournament) return (
    <div className="p-10 text-center">
      <p className="text-muted-foreground">Torneo no encontrado.</p>
      <Link to="/torneos" className="text-primary underline">Ver mis torneos</Link>
    </div>
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <TournamentDashboard tournament={tournament} />
    </div>
  );
}