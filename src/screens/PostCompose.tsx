import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBar, Screen, Section } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { TOPIC_EMOJI, TOPIC_LABEL, TOPICS } from '@/data/community';
import type { CommunityTopic } from '@/lib/types';
import s from './PostCompose.module.css';

export default function PostComposeScreen() {
  const { me, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [topic, setTopic] = useState<CommunityTopic>('question');
  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(false);

  const post = () => {
    const text = body.trim();
    if (!text) return;
    dispatch({
      type: 'addPost',
      post: {
        id: `cp-${Date.now().toString(36)}`,
        author: anon ? 'Anonymous' : me.name,
        anonymous: anon,
        mine: true,
        topic,
        body: text,
        createdAt: new Date().toISOString(),
        hearts: 0,
        replies: [],
      },
    });
    toast.show({ emoji: '✨', message: anon ? 'Posted anonymously' : 'Posted' });
    navigate('/community', { replace: true });
  };

  return (
    <>
      <BackBar title="Back" fallbackTo="/community" />
      <Screen>
        <Section>
          <p className={s.label}>What is this?</p>
          <ChipRow>
            {TOPICS.map((t) => (
              <Chip key={t} emoji={TOPIC_EMOJI[t]} selected={topic === t} onClick={() => setTopic(t)}>
                {TOPIC_LABEL[t]}
              </Chip>
            ))}
          </ChipRow>
        </Section>

        <Section>
          <textarea
            className={s.area}
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="However it comes out. Other couples have been here."
          />
        </Section>

        <Section>
          {/*
            Both ways of posting sit side by side rather than one being a
            setting behind the other: choosing to put your name on something is
            as deliberate as choosing not to, and neither should be the quiet
            default you did not notice.
          */}
          <p className={s.label}>Post as</p>
          <div className={s.who}>
            <button
              type="button"
              className={[s.pick, !anon ? s.pickOn : ''].filter(Boolean).join(' ')}
              aria-pressed={!anon}
              onClick={() => setAnon(false)}
            >
              <span className={s.pickTitle}>{me.name}</span>
              <span className={s.pickBody}>Your display name, as on your profile.</span>
            </button>
            <button
              type="button"
              className={[s.pick, anon ? s.pickOn : ''].filter(Boolean).join(' ')}
              aria-pressed={anon}
              onClick={() => setAnon(true)}
            >
              <span className={s.pickTitle}>🫥 Anonymous</span>
              <span className={s.pickBody}>Nobody sees who wrote it, including replies.</span>
            </button>
          </div>
        </Section>

        <Section>
          <Button variant="accent" size="lg" block disabled={!body.trim()} onClick={post}>
            Post
          </Button>
        </Section>
      </Screen>
    </>
  );
}
