/**
 * The Couple777 avatar set. One head shape and one face language across the
 * whole family, so a bear and a bunny read as the same illustration system —
 * only the ears, muzzle and colour change.
 */

export interface AvatarDef {
  id: string;
  label: string;
  /** Group the picker sorts by. */
  group: 'People' | 'Creatures';
  skin: string;
  ground: string;
  hair?: string;
}

export const AVATARS: AvatarDef[] = [
  { id: 'person-1', label: 'Person', group: 'People', skin: '#F0C6A8', ground: '#FDECF2', hair: '#3B2B33' },
  { id: 'person-2', label: 'Person', group: 'People', skin: '#C98B62', ground: '#F5EFFA', hair: '#241A20' },
  { id: 'person-3', label: 'Person', group: 'People', skin: '#7C5238', ground: '#FCF0EC', hair: '#161016' },
  { id: 'person-4', label: 'Person', group: 'People', skin: '#F6D9C2', ground: '#FBF2E1', hair: '#B4732F' },
  { id: 'cat', label: 'Cat', group: 'Creatures', skin: '#C4BCC6', ground: '#F3EFF4' },
  { id: 'dog', label: 'Dog', group: 'Creatures', skin: '#C98B62', ground: '#FBF2E1' },
  { id: 'bear', label: 'Bear', group: 'Creatures', skin: '#A8785C', ground: '#FCF0EC' },
  { id: 'bunny', label: 'Bunny', group: 'Creatures', skin: '#F2D8DE', ground: '#FDECF2' },
  { id: 'frog', label: 'Frog', group: 'Creatures', skin: '#9CC49A', ground: '#EAF3E8' },
  { id: 'fox', label: 'Fox', group: 'Creatures', skin: '#E08A5E', ground: '#FCF0EC' },
  { id: 'panda', label: 'Panda', group: 'Creatures', skin: '#F4EFF2', ground: '#F5EFFA' },
  { id: 'owl', label: 'Owl', group: 'Creatures', skin: '#B69BC4', ground: '#F5EFFA' },
];

export function avatarById(id?: string): AvatarDef | undefined {
  return AVATARS.find((a) => a.id === id);
}

const BLUSH = '#E98BA6';
const INK = '#2C2430';

/** Ears and any head-shape extras, drawn behind the face. */
function Ears({ id, skin }: { id: string; skin: string }) {
  const dark = 'rgba(44, 36, 48, 0.16)';
  switch (id) {
    case 'cat':
    case 'fox':
      return (
        <>
          <path d="M22 30 L26 12 L42 22 Z" fill={skin} />
          <path d="M78 30 L74 12 L58 22 Z" fill={skin} />
          <path d="M27 26 L29 18 L37 23 Z" fill={BLUSH} opacity="0.55" />
          <path d="M73 26 L71 18 L63 23 Z" fill={BLUSH} opacity="0.55" />
        </>
      );
    case 'bear':
    case 'panda':
      return (
        <>
          <circle cx="26" cy="26" r="13" fill={id === 'panda' ? INK : skin} />
          <circle cx="74" cy="26" r="13" fill={id === 'panda' ? INK : skin} />
        </>
      );
    case 'bunny':
      return (
        <>
          <ellipse cx="38" cy="18" rx="8" ry="20" fill={skin} />
          <ellipse cx="62" cy="18" rx="8" ry="20" fill={skin} />
          <ellipse cx="38" cy="19" rx="4" ry="14" fill={BLUSH} opacity="0.5" />
          <ellipse cx="62" cy="19" rx="4" ry="14" fill={BLUSH} opacity="0.5" />
        </>
      );
    case 'dog':
      return (
        <>
          <ellipse cx="20" cy="46" rx="10" ry="18" fill={skin} />
          <ellipse cx="80" cy="46" rx="10" ry="18" fill={skin} />
          <ellipse cx="20" cy="46" rx="10" ry="18" fill={dark} />
          <ellipse cx="80" cy="46" rx="10" ry="18" fill={dark} />
        </>
      );
    case 'frog':
      return (
        <>
          <circle cx="30" cy="26" r="12" fill={skin} />
          <circle cx="70" cy="26" r="12" fill={skin} />
          <circle cx="30" cy="26" r="6" fill="#FFFFFF" />
          <circle cx="70" cy="26" r="6" fill="#FFFFFF" />
          <circle cx="30" cy="27" r="3" fill={INK} />
          <circle cx="70" cy="27" r="3" fill={INK} />
        </>
      );
    case 'owl':
      return (
        <>
          <path d="M24 34 L34 16 L44 30 Z" fill={skin} />
          <path d="M76 34 L66 16 L56 30 Z" fill={skin} />
        </>
      );
    default:
      return null;
  }
}

/** Hair, muzzle, snout — whatever sits in front of the face. */
function Features({ def }: { def: AvatarDef }) {
  const { id, skin, hair } = def;

  if (id.startsWith('person')) {
    const style = id.slice(-1);
    return (
      <>
        {/* Short crop: the cap on its own. */}
        {style === '1' ? <path d="M21.7 48 A30 30 0 0 1 78.3 48 Z" fill={hair} /> : null}

        {/* Bob: cap plus two short sides past the cheeks. */}
        {style === '2' ? (
          <>
            <path d="M21.7 48 A30 30 0 0 1 78.3 48 Z" fill={hair} />
            <path d="M21.7 46 q-3 14 1 22 q6 -4 5 -22 Z" fill={hair} />
            <path d="M78.3 46 q3 14 -1 22 q-6 -4 -5 -22 Z" fill={hair} />
          </>
        ) : null}

        {/* Curls: cap plus a few rounds sitting on top. */}
        {style === '3' ? (
          <>
            <path d="M21.7 48 A30 30 0 0 1 78.3 48 Z" fill={hair} />
            <circle cx="30" cy="38" r="10" fill={hair} />
            <circle cx="50" cy="31" r="11" fill={hair} />
            <circle cx="70" cy="38" r="10" fill={hair} />
            <circle cx="23" cy="49" r="7" fill={hair} />
            <circle cx="77" cy="49" r="7" fill={hair} />
          </>
        ) : null}

        {/* Long: cap plus lengths running past the jaw. */}
        {style === '4' ? (
          <>
            <path d="M21.7 48 A30 30 0 0 1 78.3 48 Z" fill={hair} />
            <path d="M21.7 44 q-5 20 -1 34 q8 -3 8 -32 Z" fill={hair} />
            <path d="M78.3 44 q5 20 1 34 q-8 -3 -8 -32 Z" fill={hair} />
          </>
        ) : null}
        <circle cx="27" cy="62" r="5" fill={BLUSH} opacity="0.4" />
        <circle cx="73" cy="62" r="5" fill={BLUSH} opacity="0.4" />
      </>
    );
  }

  if (id === 'panda') {
    return (
      <>
        <ellipse cx="36" cy="56" rx="10" ry="12" fill={INK} opacity="0.9" />
        <ellipse cx="64" cy="56" rx="10" ry="12" fill={INK} opacity="0.9" />
        <ellipse cx="50" cy="70" rx="13" ry="10" fill="#FFFFFF" />
      </>
    );
  }

  if (id === 'fox') {
    return (
      <>
        <path d="M50 44 C34 44 26 58 30 70 C36 82 64 82 70 70 C74 58 66 44 50 44 Z" fill="#FBF0E8" />
        <circle cx="26" cy="64" r="5" fill={BLUSH} opacity="0.45" />
        <circle cx="74" cy="64" r="5" fill={BLUSH} opacity="0.45" />
      </>
    );
  }

  if (id === 'cat' || id === 'dog' || id === 'bear') {
    return (
      <>
        <ellipse cx="50" cy="70" rx="15" ry="11" fill="#FFFFFF" opacity={id === 'bear' ? 0.55 : 0.75} />
        <circle cx="26" cy="64" r="5" fill={BLUSH} opacity="0.42" />
        <circle cx="74" cy="64" r="5" fill={BLUSH} opacity="0.42" />
      </>
    );
  }

  if (id === 'bunny') {
    return (
      <>
        <circle cx="27" cy="64" r="5.5" fill={BLUSH} opacity="0.5" />
        <circle cx="73" cy="64" r="5.5" fill={BLUSH} opacity="0.5" />
      </>
    );
  }

  if (id === 'owl') {
    return (
      <>
        <circle cx="37" cy="56" r="12" fill="#FFFFFF" opacity="0.85" />
        <circle cx="63" cy="56" r="12" fill="#FFFFFF" opacity="0.85" />
      </>
    );
  }

  return <circle cx="50" cy="66" r="0" fill={skin} />;
}

/** Eyes and mouth, shared by everyone so the set feels like one hand. */
function Face({ id }: { id: string }) {
  if (id === 'frog') {
    return <path d="M38 66 Q50 76 62 66" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
  const eyeY = id === 'panda' || id === 'owl' ? 56 : 58;
  const eyeX = id === 'panda' ? 36 : id === 'owl' ? 37 : 39;
  return (
    <>
      <circle cx={eyeX} cy={eyeY} r="3.6" fill={INK} />
      <circle cx={100 - eyeX} cy={eyeY} r="3.6" fill={INK} />
      {id === 'cat' || id === 'dog' || id === 'bear' || id === 'fox' ? (
        <>
          <ellipse cx="50" cy="66" rx="4" ry="3" fill={INK} />
          <path d="M50 69 Q44 75 40 71 M50 69 Q56 75 60 71" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : id === 'owl' ? (
        <path d="M50 62 L44 69 L56 69 Z" fill="#E3944F" />
      ) : (
        <path d="M43 70 Q50 76 57 70" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}
    </>
  );
}

export function AvatarArt({ id, size = 44 }: { id: string; size?: number }) {
  const def = avatarById(id) ?? AVATARS[0];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={def.label}>
      <circle cx="50" cy="50" r="50" fill={def.ground} />
      <Ears id={def.id} skin={def.skin} />
      <circle cx="50" cy="58" r="30" fill={def.skin} />
      <Features def={def} />
      <Face id={def.id} />
    </svg>
  );
}
