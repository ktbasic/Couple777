import { photo } from '@/lib/photo';
/**
 * The big-adventure wishlist. `savedBy` is seeded so the couple already has
 * one revealed match and one unrevealed one waiting to be found.
 */
export const DESTINATIONS = [
    {
        id: 'd-japan',
        name: 'Japan',
        country: 'Kyoto & Tokyo',
        blurb: 'Two weeks between a city that never stops and temples that have not changed in six hundred years.',
        image: photo('japan', 900, 1200),
        bestTime: 'April or November',
    },
    {
        id: 'd-iceland',
        name: 'Iceland',
        country: 'Ring road',
        blurb: 'Ten days, one car, no plan beyond the direction of travel.',
        image: photo('iceland', 900, 1200),
        bestTime: 'September for the lights',
    },
    {
        id: 'd-namibia',
        name: 'Namibia',
        country: 'Sossusvlei & Etosha',
        blurb: 'Dunes at sunrise, and nights so dark you can see the galaxy from the roof of the car.',
        image: photo('namibia', 900, 1200),
        bestTime: 'May to October',
    },
    {
        id: 'd-portugal',
        name: 'Portugal',
        country: 'Alentejo coast',
        blurb: 'Cliffs, empty beaches, and long lunches that turn into afternoons.',
        image: photo('portugal', 900, 1200),
        bestTime: 'May or September',
    },
    {
        id: 'd-norway',
        name: 'Norway',
        country: 'Lofoten',
        blurb: 'A slow drive north with the sea on both sides and the lights overhead.',
        image: photo('norway', 900, 1200),
        bestTime: 'February or June',
    },
    {
        id: 'd-vietnam',
        name: 'Vietnam',
        country: 'North to south',
        blurb: 'Trains, motorbikes, and the best food either of you has eaten.',
        image: photo('vietnam', 900, 1200),
        bestTime: 'March or October',
    },
    {
        id: 'd-scotland',
        name: 'Scotland',
        country: 'The Highlands',
        blurb: 'A rented car, terrible weather, and a fire at the end of every day.',
        image: photo('scotland', 900, 1200),
        bestTime: 'May or September',
    },
    {
        id: 'd-patagonia',
        name: 'Patagonia',
        country: 'Chile & Argentina',
        blurb: 'The one that takes real planning. Weeks of walking and nowhere to be.',
        image: photo('patagonia', 900, 1200),
        bestTime: 'December to February',
    },
    {
        id: 'd-morocco',
        name: 'Morocco',
        country: 'Atlas & the coast',
        blurb: 'Mountains in the morning, mint tea in the afternoon, sea air by the weekend.',
        image: photo('morocco', 900, 1200),
        bestTime: 'March or October',
    },
    {
        id: 'd-greece',
        name: 'The Greek islands',
        country: 'The small ones',
        blurb: 'Ferries, no cars, and a month of doing nothing in particular.',
        image: photo('greece', 900, 1200),
        bestTime: 'June or September',
    },
];
