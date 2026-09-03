/**
 * The privacy promises, stated as tests.
 *
 * Katy and Marian are one couple; Rae and Sam are another. Every "cannot"
 * below is a promise the app makes to its users, so each one is checked
 * against the database rather than against the UI that happens to hide it.
 */
import { freshDb, signUp, as, asAnon, check, denied, report } from './harness.mjs';

// A thrown Postgres error carries the whole WASM bundle in its stack, which
// buries the one line that matters. Print just the message.
process.on('uncaughtException', (e) => {
  console.error('\nUNEXPECTED SQL ERROR:', e.message);
  process.exit(1);
});

const db = await freshDb();
const one = r => r.rows[0];

const katy = await signUp(db, 'katy@example.com', 'Katy');
const marian = await signUp(db, 'marian@example.com', 'Marian');
const rae = await signUp(db, 'rae@example.com', 'Rae');
const sam = await signUp(db, 'sam@example.com', 'Sam');

console.log('\nProfiles');
check('signing up creates a profile',
  one(await db.query('select count(*)::int n from public.profiles')).n === 4);

await as(db, katy, async () => {
  await db.query(`update public.profiles set display_name = 'Katy', home_base = 'Munich' where id = $1`, [katy]);
  check('you can edit your own profile',
    one(await db.query('select home_base from public.profiles where id = $1', [katy])).home_base === 'Munich');
});
await as(db, rae, async () => {
  const r = await db.query('select id from public.profiles where id = $1', [katy]);
  check('a stranger cannot read your profile', r.rows.length === 0);
  await denied('a stranger cannot edit your profile', async () => {
    const u = await db.query(`update public.profiles set display_name = 'hacked' where id = $1 returning id`, [katy]);
    if (u.rows.length === 0) throw new Error('no rows');
  });
});

console.log('\nCouples');
let coupleId;
await as(db, katy, async () => {
  const code = one(await db.query('select public.generate_invite_code() c')).c;
  check('invite code reads like K7-4M2P', /^[A-Z2-9]{2}-[A-Z2-9]{4}$/.test(code), code);
  coupleId = one(await db.query(
    `insert into public.couples (created_by, partner_1_user_id, invite_code, together_since, home_base)
     values ($1, $1, $2, '2023-06-01', 'Munich') returning id`, [katy, code])).id;
  check('you can create your own space', !!coupleId);
});

await as(db, marian, async () => {
  check('the invited partner cannot see the space before joining',
    (await db.query('select id from public.couples where id = $1', [coupleId])).rows.length === 0);
});

await as(db, rae, async () => {
  await denied('you cannot create a space owned by someone else', () =>
    db.query(`insert into public.couples (created_by, partner_1_user_id, invite_code)
              values ($1, $1, 'ZZ-ZZZZ')`, [katy]));
});

console.log('\nJoining');
const code = await as(db, katy, async () =>
  one(await db.query('select invite_code from public.couples where id = $1', [coupleId])).invite_code);

await asAnon(db, async () => {
  const peek = await db.query('select * from public.peek_invite($1)', [code]);
  check('the invite page can show who is inviting, before sign-in', peek.rows[0]?.inviter_name === 'Katy');
  check('and whether there is room', peek.rows[0]?.is_open === true);
  check('but nothing else about the couple', !('id' in (peek.rows[0] ?? {})));
});

await as(db, marian, async () => {
  const got = one(await db.query('select public.join_couple_by_code($1) id', [code])).id;
  check('the partner can join with the code', got === coupleId);
  check('and can now see the shared space',
    (await db.query('select id from public.couples where id = $1', [coupleId])).rows.length === 1);
  check('joining twice is not an error',
    one(await db.query('select public.join_couple_by_code($1) id', [code])).id === coupleId);
});

await as(db, rae, async () => {
  await denied('a third person cannot join a full space', () =>
    db.query('select public.join_couple_by_code($1)', [code]));
});
check('the space still has exactly two people',
  one(await db.query('select partner_2_user_id from public.couples where id = $1', [coupleId])).partner_2_user_id === marian);

await as(db, marian, async () => {
  await denied('a member cannot swap the other partner out', async () => {
    const u = await db.query(
      `update public.couples set partner_1_user_id = $2 where id = $1 returning id`, [coupleId, rae]);
    if (u.rows.length === 0) throw new Error('no rows');
  });
});

console.log('\nShared data');
let cycleId, planId;
await as(db, katy, async () => {
  cycleId = one(await db.query(
    `insert into public.cycles (couple_id, tier, seq, start_date, due_date)
     values ($1, 'day', 1, current_date, current_date + 7) returning id`, [coupleId])).id;
  planId = one(await db.query(
    `insert into public.plans (couple_id, cycle_id, created_by, cycle_type, title, scheduled_date, status)
     values ($1, $2, $3, 'day', 'Dinner at Osteria', current_date + 3, 'planned') returning id`,
    [coupleId, cycleId, katy])).id;
});
await as(db, marian, async () => {
  check('both partners see the same plan',
    one(await db.query('select title from public.plans where id = $1', [planId])).title === 'Dinner at Osteria');
  check('both partners see the same 777 clocks',
    (await db.query('select id from public.cycles where couple_id = $1', [coupleId])).rows.length === 1);
});
await as(db, rae, async () => {
  check('another couple sees none of it',
    (await db.query('select id from public.plans where couple_id = $1', [coupleId])).rows.length === 0);
  await denied('and cannot write into it', () =>
    db.query(`insert into public.plans (couple_id, created_by, cycle_type, title)
              values ($1, $2, 'day', 'intrusion')`, [coupleId, rae]));
});

console.log('\nSurprises stay surprises');
let surpriseId;
await as(db, katy, async () => {
  surpriseId = one(await db.query(
    `insert into public.plans (couple_id, created_by, cycle_type, title, scheduled_date, surprise)
     values ($1, $2, 'week', 'Weekend in Fussen', current_date + 20, true) returning id`,
    [coupleId, katy])).id;
  check('the author can see their own surprise',
    (await db.query('select id from public.plans where id = $1', [surpriseId])).rows.length === 1);
});
await as(db, marian, async () => {
  check('the partner cannot see a future surprise at all',
    (await db.query('select id from public.plans where id = $1', [surpriseId])).rows.length === 0);
});
await db.exec(`update public.plans set scheduled_date = current_date where id = '${surpriseId}'`);
await as(db, marian, async () => {
  check('but it appears on the day it happens',
    (await db.query('select id from public.plans where id = $1', [surpriseId])).rows.length === 1);
});

console.log('\nInvitations');
let inviteId;
await as(db, katy, async () => {
  inviteId = one(await db.query(
    `insert into public.plan_invites (plan_id, couple_id, sender_user_id, recipient_user_id, message)
     values ($1, $2, $3, $4, 'Want to make this our date this week?') returning id`,
    [planId, coupleId, katy, marian])).id;
  await denied('the sender cannot accept their own invitation', async () => {
    const u = await db.query(
      `update public.plan_invites set status = 'accepted' where id = $1 returning id`, [inviteId]);
    if (u.rows.length === 0) throw new Error('no rows');
  });
});
await as(db, marian, async () => {
  check('the recipient sees it',
    one(await db.query('select message from public.plan_invites where id = $1', [inviteId])).message.startsWith('Want to'));
  const u = await db.query(
    `update public.plan_invites set status = 'accepted', responded_at = now() where id = $1 returning status`, [inviteId]);
  check('and can accept it', u.rows[0].status === 'accepted');
  await db.query(`update public.plans set status = 'confirmed' where id = $1`, [planId]);
});
await as(db, katy, async () => {
  check('the sender sees the plan become confirmed',
    one(await db.query('select status from public.plans where id = $1', [planId])).status === 'confirmed');
});
await as(db, rae, async () => {
  check('another couple cannot read the invitation',
    (await db.query('select id from public.plan_invites where id = $1', [inviteId])).rows.length === 0);
});

console.log('\nPrivate words on a shared memory');
let memoryId;
await as(db, katy, async () => {
  memoryId = one(await db.query(
    `insert into public.memories (couple_id, created_by, happened_on, title, shared_note)
     values ($1, $2, current_date, 'Dinner at Osteria', 'We walked the long way home.') returning id`,
    [coupleId, katy])).id;
  await db.query(
    `insert into public.memory_private_notes (memory_id, user_id, body) values ($1, $2, 'I was nervous.')`,
    [memoryId, katy]);
});
await as(db, marian, async () => {
  check('the partner sees the shared line',
    one(await db.query('select shared_note from public.memories where id = $1', [memoryId])).shared_note.startsWith('We walked'));
  check('but not the private one',
    (await db.query('select body from public.memory_private_notes where memory_id = $1', [memoryId])).rows.length === 0);
  await denied('and cannot write a private note as someone else', () =>
    db.query(`insert into public.memory_private_notes (memory_id, user_id, body) values ($1, $2, 'forged')`,
      [memoryId, katy]));
});

console.log('\nNotifications');
await as(db, marian, async () => {
  await db.query(
    `insert into public.notifications (couple_id, user_id, kind, title, plan_id)
     values ($1, $2, 'invite_accepted', 'Marian said yes', $3)`, [coupleId, katy, planId]);
});
await as(db, katy, async () => {
  check('a notification reaches the other partner',
    (await db.query(`select id from public.notifications where user_id = $1`, [katy])).rows.length === 1);
});
await as(db, marian, async () => {
  check('but is not readable by anyone else, partner included',
    (await db.query(`select id from public.notifications where user_id = $1`, [katy])).rows.length === 0);
});

console.log('\nAnonymous visitors');
await asAnon(db, async () => {
  for (const t of ['profiles', 'couples', 'cycles', 'plans', 'plan_invites', 'memories', 'notifications']) {
    check(`a signed-out visitor reads nothing from ${t}`,
      (await db.query(`select * from public.${t} limit 1`)).rows.length === 0);
  }
});

console.log('\nNo table left open');
const open = await db.query(`
  select c.relname from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
check('every public table has RLS enabled', open.rows.length === 0,
  open.rows.map(r => r.relname).join(', '));

report('RLS');
