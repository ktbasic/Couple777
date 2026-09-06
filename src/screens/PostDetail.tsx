import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { BackBar, Screen, Section } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PostCard, since } from '@/features/PostCard';
import { useStore } from '@/context/store';
import s from './PostDetail.module.css';

export default function PostDetailScreen() {
  const { postId } = useParams();
  const { state, me, dispatch } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [anon, setAnon] = useState(false);

  const post = state.communityPosts.find((p) => p.id === postId);
  if (!post) return <Navigate to="/community" replace />;

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    dispatch({
      type: 'addReply',
      postId: post.id,
      reply: {
        id: `cr-${Date.now().toString(36)}`,
        author: anon ? 'Anonymous' : me.name,
        anonymous: anon,
        mine: true,
        body,
        createdAt: new Date().toISOString(),
      },
    });
    setDraft('');
    toast.show({ emoji: '💬', message: 'Replied' });
  };

  return (
    <>
      <BackBar title="Back" fallbackTo="/community" />
      <Screen>
        <PostCard post={post} full />

        <Section>
          {post.replies.length ? (
            <div className={s.replies}>
              {post.replies.map((r) => (
                <div key={r.id} className={s.reply}>
                  <div className={s.replyHead}>
                    <span className={s.replyName}>
                      {r.author}
                      {r.mine ? <span className={s.you}>you</span> : null}
                    </span>
                    <span className={s.replyAge}>{since(r.createdAt)}</span>
                  </div>
                  <p className={s.replyBody}>{r.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={s.none}>No replies yet. Yours would be the first.</p>
          )}
        </Section>

        <Section>
          <textarea
            className={s.area}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something useful, or something kind."
            rows={3}
          />
          <div className={s.send}>
            <button
              type="button"
              className={[s.anon, anon ? s.anonOn : ''].filter(Boolean).join(' ')}
              aria-pressed={anon}
              onClick={() => setAnon((a) => !a)}
            >
              🫥 Anonymously
            </button>
            <Button variant="accent" size="sm" disabled={!draft.trim()} onClick={send}>
              Reply
            </Button>
          </div>
        </Section>
      </Screen>
    </>
  );
}
