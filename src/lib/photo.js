/** Deterministic placeholder photography, seeded so cards stay stable. */
export function photo(seed, w = 800, h = 600) {
    return `https://picsum.photos/seed/c777-${seed}/${w}/${h}`;
}
/**
 * The warm gradient shown under every image while it loads, and in its place
 * if it never does. Hues are drawn from the app's own rose → peach → mauve
 * range so a failed image still looks like part of the product.
 */
const FALLBACK_HUES = [345, 353, 8, 20, 30, 300, 286];
export function gradientFor(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++)
        h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const from = FALLBACK_HUES[h % FALLBACK_HUES.length];
    const to = (from + 16) % 360;
    return `linear-gradient(145deg, hsl(${from} 64% 90%), hsl(${to} 46% 78%))`;
}
