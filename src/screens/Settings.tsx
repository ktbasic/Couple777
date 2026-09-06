import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/context/store';
import { useAuth } from '@/context/auth';
import { readerStatus, type ReadingSource } from '@/lib/memoryAi';
import s from './Settings.module.css';

export default function SettingsScreen() {
  const { state, dispatch, partner, me, reset } = useStore();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const [reader, setReader] = useState<ReadingSource | null>(null);

  useEffect(() => {
    let alive = true;
    void readerStatus().then((r) => alive && setReader(r));
    return () => {
      alive = false;
    };
  }, []);

  const readerName = reader === 'model' ? 'Couple777 reads it' : 'Read on this phone';

  return (
    <>
      <BackBar title="Settings" fallbackTo="/us" />
      <Screen>
        <ScreenHeader eyebrow="Us" title="Settings & privacy" />

        <section className={s.group}>
          <p className={s.groupLabel}>Daily connection</p>
          <div className={s.rows}>
            <button
              type="button"
              className={s.row}
              onClick={() =>
                dispatch({ type: 'setNotifications', enabled: !state.notificationsEnabled })
              }
            >
              <div className={s.rowMain}>
                <p className={s.rowTitle}>One prompt a day</p>
                <p className={s.rowBody}>
                  A single notification each evening. Never more than one — that is the whole
                  design.
                </p>
              </div>
              <span
                className={[s.switch, state.notificationsEnabled ? s.switchOn : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden
              />
            </button>
          </div>
        </section>

        <section className={s.group}>
          <p className={s.groupLabel}>Your couple</p>
          <div className={s.rows}>
            <div className={s.row}>
              <div className={s.rowMain}>
                <p className={s.rowTitle}>Connected to {partner.name}</p>
                <p className={s.rowBody}>One space, two accounts. Nobody else can join.</p>
              </div>
              <span className={s.code}>{state.couple.inviteCode}</span>
            </div>
            <div className={s.row}>
              <div className={s.rowMain}>
                <Input
                  label="Where you're based"
                  value={state.couple.homeCity}
                  readOnly
                  hint="Used to suggest mini adventures you can actually reach."
                />
              </div>
            </div>
          </div>
        </section>

        <section className={s.group}>
          <p className={s.groupLabel}>What stays private</p>
          <div className={s.privacy}>
            {[
              { icon: '👥', strong: 'Shared', body: 'Plans, trips, memories, and finished conversations.' },
              { icon: '🔒', strong: 'Yours only', body: 'Private memories, private notes, and private lines.' },
              { icon: '🤫', strong: 'Hidden', body: 'Surprise plans, and wishlist saves until they match.' },
              { icon: '⏳', strong: 'Sealed', body: 'Daily and Room answers, until you have both written one.' },
            ].map((r) => (
              <p key={r.strong} className={s.privacyRow}>
                <span className={s.privacyIcon} aria-hidden>
                  {r.icon}
                </span>
                <span>
                  <span className={s.privacyStrong}>{r.strong}.</span> {r.body}
                </span>
              </p>
            ))}
          </div>
        </section>

        {/*
          Where a memory is read, in plain words. Without a key the app falls
          back to reading notes on the phone, which is quieter and coarser —
          and if nobody says so, the only symptom is that a hard evening gets
          the same warm answer as a good one, with no way to tell why.
        */}
        <section className={s.group}>
          <p className={s.groupLabel}>Reading your memories</p>
          <div className={s.rows}>
            <div className={s.row}>
              <div className={s.rowMain}>
                <span className={s.rowLabel}>{readerName}</span>
                <span className={s.rowValue}>
                  {reader === 'device'
                    ? 'Nothing you write is sent anywhere. It is read on this phone, which is quicker but blunter.'
                    : 'Your note is read by Couple777 so the questions fit what you wrote.'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* The only place the email belongs. It is how you sign in, not who
            you are — everywhere else in the app you are your display name. */}
        <section className={s.group}>
          <p className={s.groupLabel}>Your account</p>
          <div className={s.rows}>
            <div className={s.row}>
              <div className={s.rowMain}>
                <p className={s.rowTitle}>{me.name}</p>
                <p className={s.rowBody}>
                  {user?.email ? `Signed in as ${user.email}` : 'Signed in'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className={s.danger}>
          <button type="button" className={s.dangerBtn} onClick={() => void signOut()}>
            Sign out
          </button>
          <p className={s.dangerNote}>
            Your account and everything in it stays where it is. Signing back in brings it all
            back.
          </p>
          <button type="button" className={s.dangerBtn} onClick={() => setConfirmReset(true)}>
            Clear this device
          </button>
          <p className={s.dangerNote}>
            Only what this browser keeps — notes, saved ideas, the daily question. Your plans and
            memories live in your account.
          </p>
        </div>
      </Screen>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Start over?">
        <p className={s.rowBody} style={{ marginBottom: 'var(--s-5)' }}>
          This clears what this browser is keeping — notes, saved ideas, daily answers. Your
          plans, memories and your shared space are in your account and are not touched.
        </p>
        <Button
          variant="accent"
          block
          onClick={() => {
            reset();
            setConfirmReset(false);
            navigate('/', { replace: true });
          }}
        >
          Clear this device
        </Button>
      </Sheet>
    </>
  );
}
