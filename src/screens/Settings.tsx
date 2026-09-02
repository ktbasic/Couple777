import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import type { AppState } from '@/lib/types';
import s from './Settings.module.css';

export default function SettingsScreen() {
  const { state, dispatch, me, partner, reset } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <BackBar title="Settings" fallbackTo="/us" />
      <Screen>
        <ScreenHeader eyebrow="Us" title="Settings & privacy" />

        <section className={s.group}>
          <p className={s.groupLabel}>Who's holding the phone</p>
          <div className={s.rows}>
            {state.couple.people.map((p) => (
              <button
                key={p.id}
                type="button"
                className={s.row}
                onClick={() => {
                  dispatch({ type: 'switchPerson', id: p.id });
                  toast.show({ message: `Now viewing as ${p.name}` });
                }}
              >
                <Avatar person={p} size={34} ring={p.id === me.id} />
                <div className={s.rowMain}>
                  <p className={s.rowTitle}>{p.name}</p>
                  <p className={s.rowBody}>
                    {p.id === me.id ? 'This is you' : 'Switch to see their side'}
                  </p>
                </div>
                {p.id === me.id ? <span aria-hidden>✓</span> : null}
              </button>
            ))}
          </div>
          <p className={s.rowBody} style={{ marginTop: 'var(--s-3)' }}>
            In the real app each of you has your own account. Switching here lets you see how the
            private halves look from both sides.
          </p>
        </section>

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
          <p className={s.groupLabel}>Appearance</p>
          <Segmented<AppState['theme']>
            value={state.theme}
            onChange={(theme) => dispatch({ type: 'setTheme', theme })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
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
              { icon: '🔒', strong: 'Yours only', body: 'Private notes and private lines on a memory.' },
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

        <div className={s.danger}>
          <button type="button" className={s.dangerBtn} onClick={() => setConfirmReset(true)}>
            Reset the prototype
          </button>
          <p className={s.dangerNote}>Everything here is stored on this device only.</p>
        </div>
      </Screen>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Start over?">
        <p className={s.rowBody} style={{ marginBottom: 'var(--s-5)' }}>
          This clears everything on this device — plans, memories, notes, answers — and restores
          the sample couple. It cannot be undone.
        </p>
        <Button
          variant="accent"
          block
          onClick={() => {
            reset();
            setConfirmReset(false);
            navigate('/onboarding', { replace: true });
          }}
        >
          Reset everything
        </Button>
      </Sheet>
    </>
  );
}
