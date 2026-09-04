import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { CosmicGreeter } from '@/components/ui/CosmicPair';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/auth';
import { useStore } from '@/context/store';
import * as repo from '@/lib/db/repo';
import { pendingOnboarding, clearPendingOnboarding } from '@/lib/pendingOnboarding';
import { today } from '@/lib/dates';
import { createInitialCycles } from '@/lib/cycles';
import { InviteShare } from '@/features/InviteShare';
import s from './CoupleSetup.module.css';

/**
 * "How do you want to start?" — the step that turns one account into a
 * shared space. The question is about which of the two doors you take, so the
 * two buttons under it are the answer; the couple's own details come after. Everything the couple answers here is couple-level and is
 * asked once, of the first person; the partner who joins by link is never
 * asked any of it again.
 */

type Step = 'choose' | 'create' | 'join' | 'invite';

/* Stored as free text on the couple row, so 'other' needs no migration. */
const RELATIONSHIP = [
  { value: 'dating', label: 'Dating', emoji: '💞' },
  { value: 'engaged', label: 'Engaged', emoji: '💍' },
  { value: 'married', label: 'Married', emoji: '🤍' },
  { value: 'other', label: 'Something else', emoji: '✨' },
  { value: 'unsaid', label: 'Rather not say', emoji: '🤫' },
];

/* The same five as the name step, asked about the other person. */
const IDENTITIES = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'self-describe', label: 'Self-describe' },
  { value: 'unsaid', label: 'Prefer not to say' },
];

const CLOSENESS = [
  { value: 'together', label: 'We live together', emoji: '🏠' },
  { value: 'same-area', label: 'Same city', emoji: '🚲' },
  { value: 'different-cities', label: 'Different cities', emoji: '🚆' },
  { value: 'long-distance', label: 'Long distance', emoji: '✈️' },
];

export default function CoupleSetupScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { refresh, state, coupleId } = useStore();
  const toast = useToast();

  const [step, setStep] = useState<Step>(params.get('code') ? 'join' : 'choose');
  /** Which of the five questions is on screen, once step is 'create'. */
  const [q, setQ] = useState(0);
  const [nameChecked, setNameChecked] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerGender, setPartnerGender] = useState('');
  const [partnerCity, setPartnerCity] = useState('');
  const [partnerGenderNote, setPartnerGenderNote] = useState('');
  const [since, setSince] = useState('');
  const [status, setStatus] = useState('');
  const [distance, setDistance] = useState('');
  const [homeBase, setHomeBase] = useState('');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Nobody makes a space before they have a name.
   *
   * Not just tidiness: the very next screen says "Bring Marian in" and the
   * invitation it sends is signed by whoever is sending it. An account that
   * skipped the name step — an OAuth provider that gave us nothing, a session
   * restored from an older build — would send a nameless invitation, so it
   * gets asked here rather than papered over.
   */
  useEffect(() => {
    if (!user) {
      setNameChecked(true);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const profile = await repo.getProfile(user.id);
        if (!alive) return;
        if (!profile?.display_name?.trim()) {
          navigate('/me/name?next=/couple', { replace: true });
          return;
        }
      } catch {
        // A lookup that fails must not strand anyone in setup with no way on.
      }
      if (alive) setNameChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [user, navigate]);

  // Someone arriving here who already has a space (a stale tab, a back
  // button) belongs in the app, not in setup.
  useEffect(() => {
    if (coupleId && step !== 'invite') navigate('/', { replace: true });
  }, [coupleId, step, navigate]);

  if (!nameChecked) return null;

  const create = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      // The answers given before signing up were held in this browser only.
      // Now there is an account to attach them to.
      const pending = pendingOnboarding();
      if (pending?.displayName) {
        await repo.upsertProfile(user.id, {
          display_name: pending.displayName,
          avatar_type: pending.avatarId ? 'avatar' : 'avatar',
          avatar_value: pending.avatarId ?? null,
          date_preferences: pending.datePreferences ?? {},
          relationship_preferences: pending.relationshipPreferences ?? {},
          home_base: homeBase || null,
        });
      }
      const couple = await repo.createCouple(user.id, {
        partnerName,
        togetherSince: since || undefined,
        relationshipStatus: status || 'unsaid',
        distanceSetup: distance || undefined,
        homeBase: homeBase || undefined,
        profile: {
          ...(pending?.coupleProfile ?? state.couple.profile),
          ...(partnerGender
            ? {
                partnerGender,
                ...(partnerGender === 'self-describe' && partnerGenderNote.trim()
                  ? { partnerGenderNote: partnerGenderNote.trim() }
                  : {}),
              }
            : {}),
          ...(partnerCity.trim() ? { partnerCity: partnerCity.trim() } : {}),
        } as never,
        rhythmStart: today(),
      });
      // The three clocks start the moment the space exists.
      await repo.seedCycles(
        couple.id,
        createInitialCycles(couple.rhythm_start?.slice(0, 10) || today()).map((c) => ({
          tier: c.tier,
          seq: c.seq,
          startDate: c.startDate,
          dueDate: c.dueDate,
        })),
      );
      clearPendingOnboarding();
      await refresh();
      setStep('invite');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      await repo.joinCoupleByCode(code);
      const pending = pendingOnboarding();
      if (user && pending?.displayName) {
        await repo.upsertProfile(user.id, {
          display_name: pending.displayName,
          avatar_value: pending.avatarId ?? null,
          date_preferences: pending.datePreferences ?? {},
        });
      }
      clearPendingOnboarding();
      await refresh();
      toast.show({ emoji: '🎉', message: "You're in. Welcome to your 777." });
      navigate('/me/setup', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'invite') {
    return <InviteShare partnerName={partnerName} onDone={() => navigate('/', { replace: true })} />;
  }

  if (step === 'choose') {
    return (
      <Screen className={s.screen}>
        <div className={s.top}>
          <h1 className={s.title}>How do you want to start?</h1>
          <p className={s.body}>
            Couple777 is built for two. One of you starts the space, the other joins with a code.
          </p>
        </div>
        <div className={s.actions}>
          <Button variant="accent" size="lg" block onClick={() => setStep('create')}>
            Create our space
          </Button>
          <Button variant="secondary" size="lg" block onClick={() => setStep('join')}>
            I have an invite
          </Button>
        </div>
      </Screen>
    );
  }

  if (step === 'join') {
    return (
      <Screen className={s.screen}>
        <div className={s.top}>
          <h1 className={s.title}>Enter your invite code</h1>
          <p className={s.body}>It looks like K7-4M2P. Your partner has it on their phone.</p>
        </div>
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            void join();
          }}
        >
          <Input
            label="Invite code"
            value={code}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="K7-4M2P"
            required
          />
          {error ? <p className={s.error}>{error}</p> : null}
          <Button type="submit" variant="accent" size="lg" block disabled={busy || !code.trim()}>
            {busy ? 'Joining…' : 'Join'}
          </Button>
          <button type="button" className={s.link} onClick={() => setStep('choose')}>
            Back
          </button>
        </form>
      </Screen>
    );
  }

  /* One question, one answer, next. The relationship question advances on the
     tap that answers it — a Continue button under a list of five options asks
     you to say the same thing twice. Closeness cannot: answering it opens a
     follow-up underneath, and a screen that leaves the moment it grows is a
     screen nobody gets to read. */
  const QUESTIONS = 4;
  /* The bar spans the whole of onboarding, and the name step already spent
     the first segment — so these four continue it rather than restarting. */
  const BAR = 5;
  /* Living together and sharing a city both mean one place to suggest things
     in; the other two mean two. */
  const nearby = distance === 'together' || distance === 'same-area';
  const apart = distance === 'different-cities' || distance === 'long-distance';

  const back = () => (q === 0 ? setStep('choose') : setQ(q - 1));
  const forward = () => setQ((current) => Math.min(QUESTIONS - 1, current + 1));

  /** Take the answer, then move on a beat later so the choice is seen. */
  const answer = (set: (v: string) => void, value: string) => {
    set(value);
    window.setTimeout(forward, 180);
  };

  return (
    <Screen className={s.wizard}>
      {/* The city question it used to sit behind is now folded into the one
          above, and that screen is far too busy to carry a picture. It moves
          to the last question, which is a single date field and has the room. */}
      {q === 3 ? <div className={s.cosmos} aria-hidden /> : null}

      <div className={s.progress} aria-hidden>
        {Array.from({ length: BAR }).map((_, i) => (
          <span key={i} className={[s.tick, i <= q + 1 ? s.tickOn : ''].filter(Boolean).join(' ')} />
        ))}
      </div>

      {/* Keyed on the index so each question replays the entrance. */}
      <div
        className={[s.question, q === 0 ? s.questionFill : ''].filter(Boolean).join(' ')}
        key={q}
      >
        {q === 0 ? (
          <>
            <div className={s.qHead}>
              <h1 className={s.qTitle}>What should we call your partner?</h1>
              <p className={s.qBody}>
                We&rsquo;ll use this name across Couple777, so enter what you usually call
                them.
              </p>
            </div>

            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                if (partnerName.trim()) forward();
              }}
            >
              <Input
                label="Partner&rsquo;s name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Type your partner&rsquo;s name"
                autoComplete="off"
                maxLength={40}
                required
              />
            </form>

            <fieldset className={s.identity}>
              <legend className={s.legend}>
                How do they identify?
                <span className={s.optional}>(optional)</span>
              </legend>
              <div className={s.chips}>
                {IDENTITIES.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={s.chip}
                    aria-pressed={partnerGender === o.value}
                    onClick={() =>
                      setPartnerGender(partnerGender === o.value ? '' : o.value)
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {partnerGender === 'self-describe' ? (
                <div className={s.selfDescribe}>
                  <Input
                    label="In their words"
                    value={partnerGenderNote}
                    onChange={(e) => setPartnerGenderNote(e.target.value)}
                    placeholder="However they describe themselves"
                    maxLength={40}
                    autoFocus
                  />
                </div>
              ) : null}
            </fieldset>

            {/* The other traveller, waiting to be named. */}
            <div className={s.mascot}>
              <CosmicGreeter tone="cool" />
              <div className={s.mascotNote}>
                <span className={s.hand}>
                  {partnerName.trim()
                    ? `This is ${partnerName.trim().split(/\s+/)[0]}`
                    : 'This is your person'}
                </span>
                <ArrowDoodle />
              </div>
            </div>
          </>
        ) : null}

        {q === 1 ? (
          <>
            <div>
              <h1 className={s.qTitle}>How would you describe your relationship?</h1>
              <p className={s.qBody}>Only the two of you ever see this.</p>
            </div>
            <div className={s.options}>
              {RELATIONSHIP.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={s.option}
                  data-on={status === o.value || undefined}
                  onClick={() => answer(setStatus, o.value)}
                >
                  <span className={s.optionEmoji} aria-hidden>{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {q === 2 ? (
          <>
            <div>
              <h1 className={s.qTitle}>How close are you two?</h1>
              <p className={s.qBody}>
                We&rsquo;ll use this to suggest dates and mini adventures that actually fit
                your lives.
              </p>
            </div>
            <div className={s.options}>
              {CLOSENESS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={s.option}
                  data-on={distance === o.value || undefined}
                  onClick={() => setDistance(o.value)}
                >
                  <span className={s.optionEmoji} aria-hidden>{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Same screen, opened underneath the answer. Two people in one
                place need one city; two people in two places need both, and
                asking for the second only when it exists is the difference
                between a conversation and a form. */}
            {nearby ? (
              <div className={s.reveal} key="near">
                <div className={s.revealInner}>
                  <p className={s.followUp}>What city are you based in?</p>
                  <Input
                    label="Your city"
                    value={homeBase}
                    onChange={(e) => setHomeBase(e.target.value)}
                    placeholder="Type your city"
                    autoComplete="address-level2"
                    maxLength={60}
                  />
                  <p className={s.followUpHint}>
                    Used for nearby date ideas and mini adventures.
                  </p>
                </div>
              </div>
            ) : null}

            {apart ? (
              <div className={s.reveal} key="apart">
                <div className={s.revealInner}>
                  <p className={s.followUp}>Where are you both based?</p>
                  <Input
                    label="Your city"
                    value={homeBase}
                    onChange={(e) => setHomeBase(e.target.value)}
                    placeholder="Type your city"
                    autoComplete="address-level2"
                    maxLength={60}
                  />
                  <Input
                    label={`${partnerName.trim() || 'Your partner'}\u2019s city`}
                    value={partnerCity}
                    onChange={(e) => setPartnerCity(e.target.value)}
                    placeholder="Type their city"
                    autoComplete="off"
                    maxLength={60}
                  />
                  <p className={s.followUpHint}>
                    We&rsquo;ll use this to suggest ideas in both places.
                  </p>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {q === 3 ? (
          <>
            <div>
              <h1 className={s.qTitle}>Together since?</h1>
              <p className={s.qBody}>
                For the anniversaries worth a plan. Skip it if you would rather not count.
              </p>
            </div>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <Input
                label="Together since"
                type="date"
                value={since}
                onChange={(e) => setSince(e.target.value)}
              />
            </form>
          </>
        ) : null}

        {error ? <p className={s.error}>{error}</p> : null}
      </div>

      <div className={s.foot}>
        {q === QUESTIONS - 1 ? (
          <Button
            variant="accent"
            size="lg"
            block
            glow
            disabled={busy}
            onClick={() => void create()}
          >
            {busy ? 'Making your space…' : 'Create our space'}
          </Button>
        ) : q === 0 || q === 2 ? (
          <Button
            variant="accent"
            size="lg"
            block
            glow
            disabled={q === 0 && !partnerName.trim()}
            onClick={forward}
          >
            Continue
          </Button>
        ) : null}

        {q === QUESTIONS - 1 ? (
          <button
            type="button"
            className={s.link}
            disabled={busy}
            onClick={() => {
              setSince('');
              void create();
            }}
          >
            Skip for now
          </button>
        ) : (
          <button type="button" className={s.link} onClick={back}>
            Back
          </button>
        )}
      </div>
    </Screen>
  );
}

/** A small hand-drawn arrow, curving back toward the traveller beside it. */
function ArrowDoodle() {
  return (
    <svg className={s.arrow} viewBox="0 0 62 40" width="56" height="36" aria-hidden>
      <path
        d="M 56 5 C 50 20, 38 31, 16 33"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M 25 26 L 14 33.4 L 25 38"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
