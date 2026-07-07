import { colors } from "../../theme";

// Stable, distinct colors per owner id. You always render as one color; friends
// get deterministic hues so the map reads consistently between sessions.
const PALETTE = [
  "#2ea043", // you (green — see youColor override)
  "#58a6ff",
  "#bc8cff",
  "#f778ba",
  "#e3b341",
  "#ff7b72",
  "#39c5cf",
  "#db61a2",
];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Color for a region's owner. `you` are always the brand green. */
export function ownerColor(ownerId: string | null, youId: string | null): string {
  if (!ownerId) return colors.surfaceAlt; // unclaimed
  if (ownerId === youId) return colors.primary;
  return PALETTE[(hash(ownerId) % (PALETTE.length - 1)) + 1];
}
