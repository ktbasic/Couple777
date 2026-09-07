import { photo } from '@/lib/photo';
import { DATE_IDEAS as CORPUS } from '@shared/dateIdeas';
import type { DateIdea } from '@/lib/types';

/**
 * The corpus, with pictures on.
 *
 * The ideas themselves live in `shared/dateIdeas.ts` so that the recommender
 * running on the server reads exactly the same list the phone does — the whole
 * point of moving them was that the browser should not be the one telling the
 * endpoint what exists. All this adds is the placeholder photography, which is
 * a browser concern and would otherwise drag a UI helper into a serverless
 * function that has no use for it.
 */
export const DATE_IDEAS: DateIdea[] = CORPUS.map((idea) => ({
  ...idea,
  image: photo(idea.imageSeed),
}));

export { CORPUS as BASE_DATE_IDEAS };
