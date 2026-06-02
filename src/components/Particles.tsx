export function Particles({ count = 24 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            background: i % 2 ? "var(--neon-violet)" : "var(--neon-blue)",
          }}
        />
      ))}
    </div>
  );
}
