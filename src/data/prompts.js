/**
 * One prompt a day. The mix matters more than any single line: questions,
 * memories, appreciation, play, reflection, and the occasional quote.
 * Deliberately specific — generic prompts get generic answers.
 */
export const DAILY_PROMPTS = [
    { id: 'p-01', kind: 'question', text: 'When do you feel most loved by me?' },
    { id: 'p-02', kind: 'appreciation', text: 'One small thing I did this week that you noticed.' },
    { id: 'p-03', kind: 'memory', text: 'A moment with me you still randomly think about.' },
    { id: 'p-04', kind: 'playful', text: 'If we could teleport anywhere for tonight only, where are you taking me?' },
    { id: 'p-05', kind: 'reflection', text: 'When do you feel closest to me?' },
    { id: 'p-06', kind: 'question', text: 'What is something you want us to do more often?' },
    { id: 'p-07', kind: 'memory', text: 'What were you thinking the first time you saw me?' },
    { id: 'p-08', kind: 'appreciation', text: 'Something you are quietly proud of me for.' },
    { id: 'p-09', kind: 'playful', text: 'Which of my habits would you keep even if you could delete it?' },
    { id: 'p-10', kind: 'reflection', text: 'What has been on your mind this week that you have not said out loud?' },
    { id: 'p-11', kind: 'question', text: 'What does a good Sunday look like to you right now?' },
    { id: 'p-12', kind: 'memory', text: 'The first time you thought "this might actually be serious".' },
    {
        id: 'p-13',
        kind: 'quote',
        quote: 'Love is not a feeling you keep. It is a thing you keep doing.',
        quoteAuthor: 'unattributed',
        text: 'What is one thing you are still choosing to do for us?',
    },
    { id: 'p-14', kind: 'playful', text: 'What would the trailer for our relationship be called?' },
    { id: 'p-15', kind: 'question', text: 'What do you need more of from me at the moment?' },
    { id: 'p-16', kind: 'appreciation', text: 'Something I do that makes your day easier.' },
    { id: 'p-17', kind: 'reflection', text: 'Where do you feel we have grown in the last year?' },
    { id: 'p-18', kind: 'memory', text: 'The best meal we have ever had together, and why it was that one.' },
    { id: 'p-19', kind: 'question', text: 'What are you looking forward to that has nothing to do with work?' },
    { id: 'p-20', kind: 'playful', text: 'You have €50 and two hours to surprise me. Go.' },
    {
        id: 'p-21',
        kind: 'quote',
        quote: 'The people who last are not the ones who never drift. They are the ones who keep noticing.',
        quoteAuthor: 'unattributed',
        text: 'Have we drifted anywhere small lately?',
    },
    { id: 'p-22', kind: 'reflection', text: 'When did you last feel completely relaxed around me?' },
    { id: 'p-23', kind: 'question', text: 'What is something you would like to be brave about this year?' },
    { id: 'p-24', kind: 'memory', text: 'A trip we took where something went wrong and it turned out fine.' },
    { id: 'p-25', kind: 'appreciation', text: 'Something about how I treat other people.' },
    { id: 'p-26', kind: 'playful', text: 'If we swapped lives for a day, what would you do first?' },
    { id: 'p-27', kind: 'question', text: 'What kind of affection do you want more of — words, time, touch, or help?' },
    { id: 'p-28', kind: 'reflection', text: 'What is one thing you hope is still true about us in ten years?' },
    { id: 'p-29', kind: 'memory', text: 'A time I made you laugh when you really did not want to.' },
    {
        id: 'p-30',
        kind: 'quote',
        quote: 'Nobody drifts on purpose. That is exactly why it happens.',
        quoteAuthor: 'unattributed',
        text: 'What is one small thing we could put back into the week?',
    },
    { id: 'p-31', kind: 'question', text: 'What is something you have wanted to ask me but have not?' },
    { id: 'p-32', kind: 'playful', text: 'Describe me to a stranger in three words. Be honest.' },
    { id: 'p-33', kind: 'appreciation', text: 'A moment recently where you felt lucky.' },
    { id: 'p-34', kind: 'reflection', text: 'What is taking up the most space in your head right now?' },
    { id: 'p-35', kind: 'question', text: 'Where should we go next, if money were slightly less real?' },
];
/**
 * Stand-in replies for the partner. On one device there is no second person to
 * wait for, so the prototype answers as them a few seconds after you write
 * yours — which is what makes the sealed-then-revealed moment demonstrable.
 * A real build deletes this and waits for the other phone.
 */
const PARTNER_REPLIES = [
    'Honestly? The morning you brought coffee back to bed and we just stayed there talking.',
    'When we walk somewhere with no plan. That is when I feel closest to you.',
    'I keep thinking about the breakfast we had on the balcony last summer. Small thing. Stuck with me.',
    'You noticing when I am quiet before I have said anything about it.',
    'More slow mornings. We are good at evenings and bad at mornings.',
    'The kitchen dancing. I will bring it up for years, be warned.',
    'I want us to keep booking things. We are better when there is something ahead of us.',
];
export function partnerReplyFor(promptId) {
    let h = 0;
    for (let i = 0; i < promptId.length; i++)
        h = (h * 29 + promptId.charCodeAt(i)) >>> 0;
    return PARTNER_REPLIES[h % PARTNER_REPLIES.length];
}
/** Deterministic prompt of the day, so both partners get the same one. */
export function promptForDate(iso) {
    let h = 0;
    for (let i = 0; i < iso.length; i++)
        h = (h * 33 + iso.charCodeAt(i)) >>> 0;
    return DAILY_PROMPTS[h % DAILY_PROMPTS.length];
}
export const PROMPT_KIND_LABEL = {
    question: "Tonight's question",
    memory: 'A memory to dig up',
    appreciation: 'Something to notice',
    playful: 'Just for fun',
    reflection: 'Worth sitting with',
    quote: 'Something to think about',
};
/**
 * The line under the greeting on Home. One per day, about love, connection,
 * growth, or making time on purpose — never generic motivation.
 */
export const DAILY_QUOTES = [
    'Love is built in the moments you keep making time for.',
    'Attention is the most ordinary form of affection.',
    'The relationship you have is the one you keep showing up for.',
    'Being known takes longer than being loved. Both are worth it.',
    'You do not find time for each other. You take it.',
    'Small kindnesses compound faster than grand gestures.',
    'Curiosity is what keeps a long relationship from going quiet.',
    'The good years are made of unremarkable evenings.',
    'Choosing each other is a thing you do on purpose, repeatedly.',
    'Novelty is not the opposite of commitment. It is how it survives.',
    'Say the thing you assume they already know.',
    'A plan on the calendar outlives ten good intentions.',
    'Closeness is a practice, not a state you arrive at.',
    'The best conversations start with a question nobody has asked in a while.',
];
/** Deterministic quote of the day, so both partners see the same line. */
export function quoteForDate(iso) {
    let h = 0;
    for (let i = 0; i < iso.length; i++)
        h = (h * 41 + iso.charCodeAt(i)) >>> 0;
    return DAILY_QUOTES[h % DAILY_QUOTES.length];
}
/** Rotating line under the inspiration card on Home. */
export const INSPIRATION_LINES = [
    'Your next date does not need to be extraordinary. It just needs to be intentional.',
    'The couples who stay close are not the ones with more time. They are the ones who protect it.',
    'A plan on the calendar is worth ten good intentions.',
    'Novelty is what makes time feel longer. Go somewhere neither of you has been.',
    'You do not have to fix anything tonight. You just have to be in the same room, on purpose.',
    'Anticipation is half the pleasure. Book something.',
];
