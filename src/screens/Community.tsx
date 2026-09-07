import { useState } from 'react';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { ButtonLink } from '@/components/ui/Button';
import { Chip, ChipWrap } from '@/components/ui/Chip';
import { FloatingAction } from '@/components/ui/FloatingAction';
import { PostCard } from '@/features/PostCard';
import { useStore } from '@/context/store';
import { TOPIC_EMOJI, TOPIC_LABEL, TOPICS } from '@/data/community';
import type { CommunityTopic } from '@/lib/types';
import s from './Community.module.css';

/**
 * The forum, and the tab opens straight onto it.
 *
 * There is no landing page in front of this on purpose: a page explaining what
 * a community is, in front of the community, is one tap between someone and
 * the reason they came. The filters are here rather than on a screen of their
 * own for the same reason.
 */
export default function CommunityScreen() {
  const { state } = useStore();
  const [topic, setTopic] = useState<CommunityTopic | null>(null);

  /* Writing while filtered to Conflict means writing about conflict — asking
     for the topic again on the next screen is asking twice. */
  const composeTo = topic ? `/community/new?topic=${topic}` : '/community/new';

  const posts = [...state.communityPosts]
    .filter((p) => !topic || p.topic === topic)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <ScreenHeader eyebrow="Community" title="A space for couples to ask, share, and relate" />

      {/*
        Wrapping rather than scrolling. Seven chips do not fit one line on a
        phone, and in a scrolling row the last two are off-screen with nothing
        saying so — a topic nobody can see is a topic nobody uses.
      */}
      <div className={s.filters}>
        <ChipWrap>
          <Chip selected={topic === null} onClick={() => setTopic(null)}>
            All
          </Chip>
          {TOPICS.map((t) => (
            <Chip
              key={t}
              emoji={TOPIC_EMOJI[t]}
              selected={topic === t}
              onClick={() => setTopic(topic === t ? null : t)}
            >
              {TOPIC_LABEL[t]}
            </Chip>
          ))}
        </ChipWrap>
      </div>

      <Section>
        {posts.length ? (
          <div className={s.feed}>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className={s.empty}>
            <p className={s.emptyTitle}>Nothing here yet 🌱</p>
            <p className={s.emptyBody}>
              {topic ? `Nothing under ${TOPIC_LABEL[topic]} yet.` : 'No posts yet.'} Start it off.
            </p>
            <ButtonLink to={composeTo} variant="accent" size="sm">
              Write a post
            </ButtonLink>
          </div>
        )}
      </Section>

      <FloatingAction to={composeTo} label="Write a post" />
    </Screen>
  );
}
