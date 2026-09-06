import { useState } from 'react';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { ButtonLink } from '@/components/ui/Button';
import { Chip, ChipRow } from '@/components/ui/Chip';
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

  const posts = [...state.communityPosts]
    .filter((p) => !topic || p.topic === topic)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Community"
        title="Other couples, working it out"
        sub="Ask anything, with your name on it or not."
      />

      <div className={s.filters}>
        <ChipRow>
          <Chip selected={topic === null} onClick={() => setTopic(null)}>
            Everything
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
        </ChipRow>
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
              No {topic ? TOPIC_LABEL[topic].toLowerCase() : 'posts'} so far. Start it off.
            </p>
            <ButtonLink to="/community/new" variant="accent" size="sm">
              Write a post
            </ButtonLink>
          </div>
        )}
      </Section>

      <FloatingAction to="/community/new" label="Write a post" />
    </Screen>
  );
}
