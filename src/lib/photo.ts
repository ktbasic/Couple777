/** Deterministic placeholder photography, seeded so cards stay stable. */
export function photo(seed: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/c777-${seed}/${w}/${h}`;
}

/** A warm gradient stand-in used when an image fails to load. */
export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const a = 18 + (h % 24);
  return `linear-gradient(140deg, hsl(${a} 42% 78%), hsl(${(a + 28) % 360} 30% 62%))`;
}
