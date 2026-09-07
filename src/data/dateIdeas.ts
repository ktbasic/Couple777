import { DATE_IDEAS as CORPUS } from '@shared/dateIdeas';
import type { DateIdea } from '@/lib/types';

/**
 * The corpus, as the screens use it.
 *
 * This used to add `image: photo(imageSeed)` — a seeded picsum.photos URL per
 * idea. It was random stock: "Cook one dish from scratch" was as likely to
 * come back a mountain as a kitchen, and every card cost a request that could
 * fail. Date ideas are drawn now, by `IdeaArt`, from the `category` each idea
 * already carries, so there is nothing to fetch and nothing to be wrong.
 *
 * `imageSeed` is still on the data. It costs nothing, and the day these get
 * real photography it is where the mapping goes. Nearby and Big Trips keep
 * their photographs on purpose: those are real places, and a real place wants
 * a picture of itself.
 */
export const DATE_IDEAS: DateIdea[] = CORPUS;

export { CORPUS as BASE_DATE_IDEAS };
