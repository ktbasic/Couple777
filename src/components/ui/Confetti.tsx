import s from './Confetti.module.css';

/**
 * A small burst, for the moment an answer is put away.
 *
 * A padlock said the right thing about the mechanic and the wrong thing about
 * the moment: you have just written something for the person you love, and
 * the screen answered with a security icon. This says the same thing —
 * something is closed until it is time — in the register the rest of the app
 * uses.
 *
 * It is one drawing, not a particle system. Six pieces and four sparkles,
 * placed rather than randomised, so it looks the same every time and can be
 * judged like any other illustration. The pieces fly out once on mount and
 * settle; only the sparkles keep going, slowly, and they are the quietest
 * thing on screen.
 */
export function Confetti({ className }: { className?: string }) {
  return (
    <svg
      className={[s.svg, className].filter(Boolean).join(' ')}
      viewBox="0 0 120 84"
      role="img"
      aria-label="A small burst of confetti"
    >
      <defs>
        <linearGradient id="cf-ribbon" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#F9A8B8" />
          <stop offset="100%" stopColor="#EF7E96" />
        </linearGradient>
        <linearGradient id="cf-gold" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FBD99A" />
          <stop offset="100%" stopColor="#F2B95F" />
        </linearGradient>
      </defs>

      {/* The curl in the middle: the one piece with a shape of its own. */}
      <g className={s.curl}>
        <path
          d="M75 41c-6-4-15-4-20 2-6 6-6 16 1 21 5 4 13 3 17-2 3-4 3-10-1-13-3-2-7-2-9 1"
          fill="none"
          stroke="url(#cf-ribbon)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* Streamers, thrown out to their places. */}
      <g className={`${s.piece} ${s.p1}`}>
        <rect x="36" y="20" width="6" height="15" rx="3" fill="url(#cf-ribbon)" transform="rotate(-24 39 27)" />
      </g>
      <g className={`${s.piece} ${s.p2}`}>
        <rect x="82" y="46" width="5.5" height="12" rx="2.75" fill="#F6BFCB" transform="rotate(36 85 52)" />
      </g>
      <g className={`${s.piece} ${s.p3}`}>
        <circle cx="30" cy="52" r="3.4" fill="#F7C9D5" />
      </g>
      <g className={`${s.piece} ${s.p4}`}>
        <circle cx="74" cy="24" r="2.8" fill="#F3B7C6" />
      </g>
      <g className={`${s.piece} ${s.p5}`}>
        <circle cx="52" cy="16" r="2.4" fill="#FAD9A6" />
      </g>
      <g className={`${s.piece} ${s.p6}`}>
        <circle cx="90" cy="66" r="2.6" fill="#F7CBD7" />
      </g>

      {/* Four-point sparkles, the same mark the eyebrow uses. */}
      <g className={`${s.spark} ${s.s1}`}>
        <path d="M92 18c1.1 6.4 2.1 7.4 8.5 8.5-6.4 1.1-7.4 2.1-8.5 8.5-1.1-6.4-2.1-7.4-8.5-8.5 6.4-1.1 7.4-2.1 8.5-8.5Z" fill="url(#cf-gold)" />
      </g>
      <g className={`${s.spark} ${s.s2}`}>
        <path d="M24 26c.8 4.6 1.5 5.3 6.1 6.1-4.6.8-5.3 1.5-6.1 6.1-.8-4.6-1.5-5.3-6.1-6.1 4.6-.8 5.3-1.5 6.1-6.1Z" fill="url(#cf-gold)" />
      </g>
      <g className={`${s.spark} ${s.s3}`}>
        <path d="M70 44c.6 3.6 1.2 4.2 4.8 4.8-3.6.6-4.2 1.2-4.8 4.8-.6-3.6-1.2-4.2-4.8-4.8 3.6-.6 4.2-1.2 4.8-4.8Z" fill="#F6C1D0" />
      </g>
      <g className={`${s.spark} ${s.s4}`}>
        <path d="M45 48c.5 3 1 3.5 4 4-3 .5-3.5 1-4 4-.5-3-1-3.5-4-4 3-.5 3.5-1 4-4Z" fill="#FADBAC" />
      </g>
    </svg>
  );
}
