import type { Competitor } from "@/types";

export function CompetitorAvatar({ c, size = 36 }: { c?: Competitor | null; size?: number }) {
  const s = { width: size, height: size };
  if (!c) {
    return (
      <div className="flex items-center justify-center rounded-full bg-muted text-xs text-muted-foreground" style={s}>
        ?
      </div>
    );
  }
  if (c.image) {
    return <img src={c.image} alt={c.name} className="rounded-full object-cover ring-2 ring-primary/40" style={s} />;
  }
  const initials = c.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-display text-xs font-bold ring-2 ring-primary/40"
      style={{ ...s, background: "linear-gradient(135deg, var(--neon-violet), var(--neon-blue))" }}
    >
      {initials}
    </div>
  );
}
