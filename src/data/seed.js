import { DESTINATIONS } from './destinations';
import { buildHistory } from './history';
import { photo } from '@/lib/photo';
import { addDays, addMonths, today, toISODate } from '@/lib/dates';
export const PERSON_A = 'p-a';
export const PERSON_B = 'p-b';
/** Seed data is generated relative to today so the prototype never goes stale. */
export function buildSeedState(nameA = 'Katy', nameB = 'Marian') {
    const now = today();
    const d = (offset) => addDays(now, offset);
    /**
     * The three live clocks. Each is mid-turn, in a different state, so the
     * prototype opens showing all of upcoming, confirmed and planned at once.
     */
    const cycles = [
        {
            id: 'cy-day',
            tier: 'day',
            seq: 29,
            startDate: d(-4),
            dueDate: d(3),
            planId: 'pl-day',
        },
        {
            id: 'cy-week',
            tier: 'week',
            seq: 9,
            startDate: d(-31),
            dueDate: d(18),
        },
        {
            id: 'cy-month',
            tier: 'month',
            seq: 5,
            startDate: d(-96),
            dueDate: addMonths(now, 4),
            planId: 'pl-month',
        },
    ];
    const plans = [
        {
            id: 'pl-day',
            cycleId: 'cy-day',
            title: 'Dinner at the place on the corner',
            emoji: '🍷',
            date: d(3),
            time: '19:30',
            createdBy: PERSON_A,
            surprise: false,
            place: 'Osteria, Fraunhoferstraße',
            cost: '€70',
            note: 'Booked for 19:30. Walk home the long way after.',
            reserved: true,
            invite: {
                sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                message: 'I thought we could have a proper dinner together this week ❤️',
                respondedAt: new Date(Date.now() - 86400000).toISOString(),
                response: 'yes',
            },
        },
        {
            id: 'pl-month',
            cycleId: 'cy-month',
            title: 'Japan',
            emoji: '🗼',
            date: addMonths(now, 4),
            endDate: addDays(addMonths(now, 4), 15),
            createdBy: PERSON_B,
            surprise: false,
            place: 'Tokyo · Kyoto · Naoshima',
            cost: '€4,800',
            note: 'Flights held, not booked. Decide on the Kyoto leg by the end of the month.',
            trip: {
                destination: 'Japan',
                country: 'Tokyo · Kyoto · Naoshima',
                heroImage: photo('japan', 1200, 900),
                transport: 'Fly into Tokyo, out of Osaka. Rail pass covers the middle.',
                wishlist: [
                    { id: 'w1', label: 'Stay one night in a ryokan', addedBy: PERSON_A },
                    { id: 'w2', label: 'The art island — Naoshima', addedBy: PERSON_B },
                    { id: 'w3', label: 'Early morning at Fushimi Inari', addedBy: PERSON_A },
                    { id: 'w4', label: 'A proper omakase, once', addedBy: PERSON_B },
                    { id: 'w5', label: 'Day trip to Nara for the deer', addedBy: PERSON_A },
                ],
                stays: [
                    { id: 's1', label: 'Tokyo — somewhere in Shimokitazawa', addedBy: PERSON_B },
                    { id: 's2', label: 'Kyoto — machiya townhouse', addedBy: PERSON_A },
                ],
                notes: 'Two weeks feels right.',
                budget: '€4,800',
            },
        },
    ];
    const memories = [
        {
            id: 'm-1',
            date: d(-4),
            title: 'Pasta date at home',
            emoji: '🍝',
            kind: 'day',
            place: 'Our kitchen',
            photos: [photo('mem-pasta-1'), photo('mem-pasta-2'), photo('mem-pasta-3')],
            mood: 'silly',
            sharedNote: 'Ended up dancing in the kitchen.',
            notes: {
                [PERSON_A]: 'You burned the garlic and refused to admit it. Best evening of the week.',
                [PERSON_B]: 'The garlic was fine. The dancing was not planned and was the best part.',
            },
            privateNotes: {},
        },
        {
            id: 'm-2',
            date: d(-31),
            title: 'Füssen weekend',
            emoji: '🏔️',
            kind: 'week',
            place: 'Füssen, Bavaria',
            photos: [
                photo('mem-fussen-1'),
                photo('mem-fussen-2'),
                photo('mem-fussen-3'),
                photo('mem-fussen-4'),
            ],
            mood: 'calm',
            sharedNote: 'Rained the whole Saturday and we did not mind at all.',
            notes: {
                [PERSON_A]: 'That guesthouse breakfast. And you falling asleep in the car on the way back.',
                [PERSON_B]: 'Walking the gorge in the rain with nobody else there.',
            },
            privateNotes: {},
        },
        {
            id: 'm-3',
            date: d(-58),
            title: 'The night the power went out',
            emoji: '🕯️',
            kind: 'moment',
            place: 'Home',
            photos: [photo('mem-power-1')],
            mood: 'warm',
            sharedNote: 'Three hours of candles and nothing to do.',
            notes: {
                [PERSON_A]: 'We talked about the Japan trip for the first time properly.',
                [PERSON_B]: 'I want more evenings like that without needing a blackout.',
            },
            privateNotes: {},
        },
        {
            id: 'm-4',
            date: d(-96),
            title: 'Lisbon',
            emoji: '🇵🇹',
            kind: 'month',
            place: 'Lisbon, Portugal',
            photos: [
                photo('mem-lisbon-1'),
                photo('mem-lisbon-2'),
                photo('mem-lisbon-3'),
                photo('mem-lisbon-4'),
                photo('mem-lisbon-5'),
            ],
            mood: 'joyful',
            sharedNote: 'Nine days. We got lost every single one of them.',
            notes: {
                [PERSON_A]: 'The tiny restaurant we found on the last night that we will never find again.',
                [PERSON_B]: 'You singing badly on the tram. Repeatedly.',
            },
            privateNotes: {},
        },
        {
            id: 'm-5',
            date: d(-140),
            title: 'Two years together',
            emoji: '❤️',
            kind: 'milestone',
            photos: [photo('mem-anniv-1'), photo('mem-anniv-2')],
            mood: 'tender',
            sharedNote: 'Same restaurant as the first time. Better conversation.',
            notes: {},
            privateNotes: {},
        },
        {
            id: 'm-6',
            date: d(-172),
            title: 'Sunday at the lake',
            emoji: '🏞️',
            kind: 'week',
            place: 'Starnberger See',
            photos: [photo('mem-lake-1'), photo('mem-lake-2')],
            mood: 'calm',
            sharedNote: 'Missed the last train and did not care.',
            notes: { [PERSON_B]: 'The water was far too cold and we went in anyway.' },
            privateNotes: {},
        },
    ];
    const notes = [
        {
            id: 'n-1',
            kind: 'appreciation',
            body: 'You handled the whole week with my parents better than I did. I noticed. Thank you.',
            from: PERSON_B,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            readAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
        },
        {
            id: 'n-2',
            kind: 'love',
            body: 'Open this on Friday when you get home. I have already sorted dinner. Do not cook.',
            from: PERSON_A,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            deliverAt: new Date(Date.now() + 3 * 86400000).toISOString(),
            deliverLabel: 'Friday evening',
        },
        {
            id: 'n-3',
            kind: 'private',
            body: 'Note to self: stop bringing up work at dinner. It is not the conversation either of us wants.',
            from: PERSON_A,
            createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
    ];
    // The handcrafted recent items sit in front of a generated backlog, so the
    // profile and timeline read like a relationship with two years behind it.
    const history = buildHistory(now, [PERSON_A, PERSON_B]);
    return {
        onboarded: false,
        rhythmStart: d(-4),
        cycles: [...cycles, ...history.cycles],
        couple: {
            id: 'c-1',
            people: [
                { id: PERSON_A, name: nameA, initial: nameA.charAt(0).toUpperCase(), avatarId: 'person-1' },
                { id: PERSON_B, name: nameB, initial: nameB.charAt(0).toUpperCase(), avatarId: 'fox' },
            ],
            togetherSince: toISODate(new Date(new Date().getFullYear() - 2, new Date().getMonth() - 4, 14)),
            homeCity: 'Munich',
            inviteCode: 'K7-4M2P',
            currentPersonId: PERSON_A,
            partnerJoined: true,
            profile: {
                wishes: ['adventure', 'quality-time'],
                status: 'dating',
                proximity: 'together',
                vibes: ['cozy', 'adventurous', 'playful'],
            },
        },
        plans: [...plans, ...history.plans],
        memories: [...memories, ...history.memories],
        notes,
        destinations: DESTINATIONS.map((dest) => ({
            ...dest,
            savedBy: dest.id === 'd-japan'
                ? [PERSON_A, PERSON_B]
                : dest.id === 'd-iceland'
                    ? [PERSON_A, PERSON_B] // an unseen match, waiting to be revealed
                    : dest.id === 'd-norway'
                        ? [PERSON_B]
                        : dest.id === 'd-portugal'
                            ? [PERSON_A]
                            : [],
            matchSeen: dest.id === 'd-japan',
        })),
        daily: [
            {
                date: addDays(now, -1),
                promptId: 'p-02',
                answers: {
                    [PERSON_A]: {
                        text: 'You made coffee before I was even awake on Tuesday. Small thing. Not a small thing.',
                        at: new Date(Date.now() - 86400000).toISOString(),
                    },
                    [PERSON_B]: {
                        text: 'You did not once mention the thing I was dreading, and that was exactly right.',
                        at: new Date(Date.now() - 82000000).toISOString(),
                    },
                },
            },
        ],
        roomSessions: [],
        savedIdeaIds: ['i-stargaze', 'i-letters'],
        notificationsEnabled: true,
        readNotificationIds: [],
        checkInDays: 25,
    };
}
