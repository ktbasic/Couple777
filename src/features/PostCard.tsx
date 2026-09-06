import { Link } from 'react-router-dom';
import { useStore } from '@/context/store';
import { TOPIC_EMOJI, TOPIC_LABEL } from '@/data/community';
import type { CommunityPost } from '@/lib/types';
import s from './PostCard.module.css';

/** "3h", "2d" — a forum needs the age of a thread, not its date. */
export function since(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const HEART = (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
    <path
      d="M12 20.4C5.6 15.9 2.4 12.6 2.4 8.9 2.4 5.9 4.7 3.6 7.5 3.6c1.8 0 3.4.9 4.5 2.4 1.1-1.5 2.7-2.4 4.5-2.4 2.8 0 5.1 2.3 5.1 5.3 0 3.7-3.2 7-9.6 11.5Z"
      fill="currentColor"
    />
  </svg>
);

const REPLY = (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
    <path
      d="M20 12.4c0 3.5-3.4 6.3-7.6 6.3-.9 0-1.8-.1-2.6-.4L5 20l1.2-3.1C4.9 15.7 4 14.2 4 12.4 4 8.9 7.6 6 11.9 6S20 8.9 20 12.4Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

export function PostCard({ post, full }: { post: CommunityPost; full?: boolean }) {
  const { dispatch } = useStore();

  const body =
    full || post.body.length <= 220 ? post.body : `${post.body.slice(0, 220).trimEnd()}…`;

  return (
    <article className={s.card}>
      <div className={s.head}>
        <span className={s.avatar} aria-hidden>
          {post.anonymous ? '🫥' : post.author.charAt(0).toUpperCase()}
        </span>
        <div className={s.who}>
          <p className={s.name}>
            {post.author}
            {post.mine ? <span className={s.you}>you</span> : null}
          </p>
          <p className={s.meta}>
            {TOPIC_EMOJI[post.topic]} {TOPIC_LABEL[post.topic]} · {since(post.createdAt)}
          </p>
        </div>
      </div>

      {full ? (
        <p className={s.body}>{body}</p>
      ) : (
        <Link to={`/community/${post.id}`} className={s.bodyLink}>
          <p className={s.body}>{body}</p>
        </Link>
      )}

      <div className={s.foot}>
        <button
          type="button"
          className={[s.act, post.heartedByMe ? s.acted : ''].filter(Boolean).join(' ')}
          onClick={() => dispatch({ type: 'toggleHeart', postId: post.id })}
          aria-pressed={Boolean(post.heartedByMe)}
        >
          {HEART}
          {post.hearts}
        </button>
        {full ? (
          <span className={s.act}>
            {REPLY}
            {post.replies.length}
          </span>
        ) : (
          <Link to={`/community/${post.id}`} className={s.act}>
            {REPLY}
            {post.replies.length ? post.replies.length : 'Reply'}
          </Link>
        )}
      </div>
    </article>
  );
}
