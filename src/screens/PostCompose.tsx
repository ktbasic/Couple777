import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip, ChipWrap } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { TOPIC_EMOJI, TOPIC_LABEL, TOPICS } from '@/data/community';
import { inferKind } from '@/lib/postKind';
import type { CommunityTopic } from '@/lib/types';
import s from './PostCompose.module.css';

const MAX = 1000;

/**
 * Writing a post.
 *
 * There used to be a first question — is this a question, an experience, some
 * advice or a reflection — and it was the wrong thing to ask. Nobody arrives
 * wanting to classify what they are about to write; they arrive with the
 * thing. The shape is still recorded, read off the text by `inferKind` when
 * the post is made, and nothing on this screen mentions it.
 *
 * What is asked for is the subject, because that is what someone else will
 * filter by to find it.
 */
export default function PostComposeScreen() {
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const draft = state.postDraft;
  /*
   * Three sources, in order of how recently the person expressed the wish:
   * the topic they were filtered to when they tapped +, then whatever the
   * draft was in, then the widest of the six. The draft loses to the URL
   * because arriving from a filtered feed is a fresher intent than a draft
   * from some earlier session.
   */
  const fromUrl = params.get('topic') as CommunityTopic | null;
  const initialTopic =
    fromUrl && TOPICS.includes(fromUrl) ? fromUrl : (draft?.topic ?? 'life_together');

  const [topic, setTopic] = useState<CommunityTopic>(initialTopic);
  const [title, setTitle] = useState(draft?.title ?? '');
  const [body, setBody] = useState(draft?.body ?? '');
  const [anon, setAnon] = useState(draft?.anonymous ?? false);

  const text = body.trim();
  const heading = title.trim();

  const post = () => {
    if (!text) return;
    dispatch({
      type: 'addPost',
      post: {
        id: `cp-${Date.now().toString(36)}`,
        author: anon ? 'Anonymous' : me.name,
        anonymous: anon,
        mine: true,
        topic,
        kind: inferKind(text, heading),
        title: heading || undefined,
        body: text,
        createdAt: new Date().toISOString(),
        hearts: 0,
        replies: [],
      },
    });
    toast.show({ emoji: '✨', message: anon ? 'Posted anonymously' : 'Posted' });
    navigate('/community', { replace: true });
  };

  const saveDraft = () => {
    dispatch({
      type: 'saveDraft',
      draft: { topic, anonymous: anon, title, body, savedAt: new Date().toISOString() },
    });
    toast.show({ emoji: '📝', message: 'Draft saved' });
    navigate('/community', { replace: true });
  };

  const discardDraft = () => {
    dispatch({ type: 'clearDraft' });
    setTitle('');
    setBody('');
    toast.show({ emoji: '🗑️', message: 'Draft discarded' });
  };

  return (
    <>
      <BackBar title="Back" fallbackTo="/community" />
      <Screen>
        <ScreenHeader
          eyebrow="Community"
          title="Share with the community"
          sub="Share what’s on your mind — openly or anonymously."
        />

        {draft ? (
          <div className={s.resumed}>
            <span aria-hidden>📝</span>
            <p className={s.resumedText}>Picked up where you left off.</p>
            <button type="button" className={s.discard} onClick={discardDraft}>
              Discard
            </button>
          </div>
        ) : null}

        <Section>
          <p className={s.label}>Topic</p>
          <ChipWrap>
            {TOPICS.map((t) => (
              <Chip
                key={t}
                emoji={TOPIC_EMOJI[t]}
                selected={topic === t}
                onClick={() => setTopic(t)}
              >
                {TOPIC_LABEL[t]}
              </Chip>
            ))}
          </ChipWrap>
        </Section>

        {/*
          A row with a switch rather than two cards to choose between. Posting
          under your own name is the ordinary case and does not need arguing
          for; anonymity is the deliberate act, so it is the thing you turn on.
        */}
        <Section>
          <button
            type="button"
            role="switch"
            aria-checked={anon}
            className={s.anonRow}
            onClick={() => setAnon(!anon)}
          >
            <span className={s.anonMark} aria-hidden>
              {anon ? '🫥' : me.name.charAt(0).toUpperCase()}
            </span>
            <span className={s.anonText}>
              <span className={s.anonTitle}>Post anonymously</span>
              <span className={s.anonBody}>
                {anon
                  ? 'Nobody sees who wrote it, including on replies.'
                  : `Posting as ${me.name}.`}
              </span>
            </span>
            <span className={[s.track, anon ? s.trackOn : ''].filter(Boolean).join(' ')}>
              <span className={s.knob} />
            </span>
          </button>
        </Section>

        <Section>
          <label className={s.label} htmlFor="post-title">
            Title <span className={s.optional}>(optional)</span>
          </label>
          <input
            id="post-title"
            className={s.input}
            value={title}
            maxLength={90}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a short title…"
          />
        </Section>

        <Section>
          <label className={s.label} htmlFor="post-body">
            What’s on your mind?
          </label>
          <div className={s.areaWrap}>
            <textarea
              id="post-body"
              className={s.area}
              autoFocus
              value={body}
              maxLength={MAX}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts, ask a question, or tell your story…"
            />
            <span className={s.count}>
              {body.length}/{MAX}
            </span>
          </div>
          <p className={s.privacy}>
            <span aria-hidden>🔒</span> Others will only see what you choose to share.
          </p>
        </Section>

        <Section>
          <div className={s.actions}>
            <Button variant="accent" size="lg" block disabled={!text} onClick={post}>
              Post to community
            </Button>
            {/* Saving nothing is not saving, so this waits for something to
                save — but unlike posting it will take a title on its own. */}
            <Button
              variant="outline"
              size="lg"
              block
              disabled={!text && !heading}
              onClick={saveDraft}
            >
              Save draft
            </Button>
          </div>
        </Section>
      </Screen>
    </>
  );
}
