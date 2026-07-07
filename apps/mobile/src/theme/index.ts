// Minimal design tokens. Green-leaning palette to match the low-carbon nudge.
export const colors = {
  bg: "#0d1117",
  surface: "#161b22",
  surfaceAlt: "#21262d",
  border: "#30363d",
  text: "#e6edf3",
  textMuted: "#8b949e",
  primary: "#2ea043", // green — the whole point
  primaryText: "#ffffff",
  danger: "#da3633",
  // Transport-mode accents (greener = warmer green).
  mode: {
    walk: "#2ea043",
    bike: "#2ea043",
    train: "#3fb950",
    bus: "#56d364",
    ferry: "#58a6ff",
    car: "#d29922",
    plane: "#8b949e",
  },
} as const;

export const spacing = (n: number) => n * 8;

export const radius = { sm: 8, md: 12, lg: 20 } as const;

export const font = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
};
