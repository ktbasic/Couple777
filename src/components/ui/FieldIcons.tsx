/**
 * The three marks on the when/where fields.
 *
 * Drawn rather than emoji so they take the field's colour, sit on the same
 * optical centre as each other, and stay the same weight as the rest of the
 * interface — an emoji calendar is a different illustration style wearing a
 * form's clothes.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function CalendarMark() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden focusable="false">
      <rect x="3.5" y="5.5" width="17" height="15" rx="3.5" {...stroke} />
      <path d="M3.5 10h17M8.5 3.5v4M15.5 3.5v4" {...stroke} />
    </svg>
  );
}

export function ClockMark() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <path d="M12 7.5V12l3 2" {...stroke} />
    </svg>
  );
}

export function PlaceMark() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden focusable="false">
      <path d="M12 21c4.5-4.4 6.8-7.7 6.8-10.4a6.8 6.8 0 1 0-13.6 0C5.2 13.3 7.5 16.6 12 21Z" {...stroke} />
      <circle cx="12" cy="10.4" r="2.6" {...stroke} />
    </svg>
  );
}

export function LinkMark() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden focusable="false">
      <path d="M10 13.8a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3" {...stroke} />
      <path d="M14 10.2a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.3-1.3" {...stroke} />
    </svg>
  );
}
