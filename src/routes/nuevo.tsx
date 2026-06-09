import { createFileRoute, Link } from "@tanstack/react-router";
import { TournamentWizard } from "@/components/TournamentWizard";

export const Route = createFileRoute("/nuevo")({
  head: () => ({ meta: [{ title: "Nuevo torneo · La Banda Gaming" }, { name: "description", content: "Crea un nuevo torneo gaming en segundos." }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Inicio</Link>
      <h1 className="font-display mt-2 mb-8 text-3xl uppercase neon-text">Nuevo torneo</h1>
      <TournamentWizard />
    </div>
  );
}