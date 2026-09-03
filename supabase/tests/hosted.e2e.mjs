/**
 * Does the real hosted Supabase project actually work?
 *
 * Everything the app needs, checked in the order it would fail: credentials,
 * reachability, schema, auth, then the whole MVP loop driven through the real
 * @supabase/supabase-js client as two separate accounts.
 *
 *   node supabase/tests/hosted.e2e.mjs          (or: npm run test:hosted)
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or
 * VITE_SUPABASE_ANON_KEY) from the environment, falling back to .env.local.
 *
 * Every failure is labelled with whose problem it is, because that is the
 * question you actually have when a check goes red:
 *
 *   [CODE]     a bug in this repository — fix it here
 *   [SUPABASE] a setting in the Supabase dashboard — fix it there
 *   [AUTH]     an auth/OAuth provider step not finished yet
 *   [NETWORK]  this machine cannot reach the project at all
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

/* ------------------------------ configuration ----------------------------- */

/** Env first, .env.local second — so CI and a laptop both work unchanged. */
function loadEnv() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return {
    url: process.env.VITE_SUPABASE_URL?.trim(),
    key:
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.VITE_SUPABASE_ANON_KEY?.trim(),
    keyName: process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      ? 'VITE_SUPABASE_PUBLISHABLE_KEY'
      : 'VITE_SUPABASE_ANON_KEY',
  };
}

/* -------------------------------- reporting ------------------------------- */

let passed = 0;
const failures = [];
const notes = [];

function ok(name, detail = '') {
  passed++;
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, kind, detail) {
  failures.push({ name, kind, detail });
  console.log(`  ✗ ${name}\n      [${kind}] ${detail}`);
}

function note(text) {
  notes.push(text);
  console.log(`      note: ${text}`);
}

function section(title) {
  console.log(`\n${title}`);
}

/** Stop the run: everything after this point would fail for the same reason. */
class Fatal extends Error {}
function fatal(name, kind, detail) {
  fail(name, kind, detail);
  throw new Fatal(name);
}

const msg = (e) => (e && typeof e === 'object' && 'message' in e ? e.message : String(e));

/** Postgres/PostgREST says "no such table" in two different dialects. */
function isMissingRelation(error) {
  const m = msg(error).toLowerCase();
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    m.includes('does not exist') ||
    m.includes('could not find the table') ||
    m.includes('schema cache')
  );
}

function isMissingFunction(error) {
  const m = msg(error).toLowerCase();
  return (
    error?.code === '42883' ||
    error?.code === 'PGRST202' ||
    m.includes('could not find the function') ||
    m.includes('function public.')
  );
}

function looksLikeNetwork(error) {
  const m = msg(error).toLowerCase();
  return (
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('enotfound') ||
    m.includes('econnrefused') ||
    m.includes('certificate') ||
    m.includes('tunnel') ||
    m.includes('socket') ||
    m.includes('network')
  );
}

/* --------------------------------- helpers -------------------------------- */

const EXPECTED_TABLES = [
  'profiles',
  'couples',
  'cycles',
  'plans',
  'plan_invites',
  'memories',
  'memory_private_notes',
  'notifications',
];

const RUN = Date.now().toString(36);
const password = `Couple777-test-${RUN}`;
const emailFor = (who) => `couple777.${who}.${RUN}@example.com`;

function client(cfg) {
  // No persistence: each account gets its own in-memory session, which is what
  // makes this a genuine two-account test rather than one user twice.
  return createClient(cfg.url, cfg.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Throw the PostgREST error rather than letting a null quietly flow onward. */
function must(step, { data, error }) {
  if (error) {
    const e = new Error(`${step}: ${msg(error)}`);
    e.cause = error;
    throw e;
  }
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

/* ---------------------------------- 1. env -------------------------------- */

async function main() {
  console.log('Couple777 — hosted Supabase verification\n' + '='.repeat(44));

  section('1. Environment variables');
  const cfg = loadEnv();

  if (!cfg.url) {
    fatal(
      'VITE_SUPABASE_URL is set',
      'SUPABASE',
      'Not set. Add it to the environment (or .env.local) as https://<ref>.supabase.co',
    );
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(cfg.url) && !cfg.url.includes('localhost')) {
    note(`URL is "${cfg.url}" — expected https://<project-ref>.supabase.co`);
  }
  ok('VITE_SUPABASE_URL is set', cfg.url);

  if (!cfg.key) {
    fatal(
      'Browser key is set',
      'SUPABASE',
      'Neither VITE_SUPABASE_PUBLISHABLE_KEY nor VITE_SUPABASE_ANON_KEY is set.',
    );
  }
  const shape = cfg.key.startsWith('sb_publishable_')
    ? 'new-style publishable key'
    : cfg.key.startsWith('eyJ')
      ? 'legacy anon JWT'
      : 'unrecognised';

  if (cfg.key.startsWith('sb_secret_') || cfg.key.startsWith('service_role')) {
    fatal(
      'Browser key is the publishable one',
      'SUPABASE',
      'That is a SECRET key. It bypasses RLS and must never reach a browser. ' +
        'Use the publishable / anon key instead.',
    );
  }
  if (shape === 'unrecognised') {
    note(`Key does not look like sb_publishable_… or a JWT. Double-check you copied the right one.`);
  }
  ok(`${cfg.keyName} is set`, `${shape}, ${cfg.key.length} chars`);

  /* ------------------------------ 2. connection ---------------------------- */

  section('2. Connection to the hosted project');
  const anon = client(cfg);

  try {
    const res = await fetch(`${cfg.url}/auth/v1/health`, { headers: { apikey: cfg.key } });
    // Any answer at all means the tunnel and TLS are fine and something is
    // listening; only 401 is a real verdict, and it is about the key.
    if (res.status === 401)
      fatal('GoTrue (auth) reachable', 'SUPABASE', 'HTTP 401 — the key is rejected by this project.');
    ok('GoTrue (auth) reachable', `HTTP ${res.status}`);
    if (!res.ok) note(`/auth/v1/health answered ${res.status}; real Supabase answers 200.`);
  } catch (e) {
    fatal(
      'GoTrue (auth) reachable',
      looksLikeNetwork(e) ? 'NETWORK' : 'SUPABASE',
      `${msg(e)} — this machine could not open a connection to ${cfg.url}.`,
    );
  }

  try {
    const res = await fetch(`${cfg.url}/rest/v1/`, { headers: { apikey: cfg.key } });
    if (res.status === 401)
      fatal('PostgREST (data API) reachable', 'SUPABASE', 'HTTP 401 — key rejected.');
    ok('PostgREST (data API) reachable', `HTTP ${res.status}`);
  } catch (e) {
    fatal('PostgREST (data API) reachable', looksLikeNetwork(e) ? 'NETWORK' : 'SUPABASE', msg(e));
  }

  /* -------------------------------- 3. schema ------------------------------ */

  section('3. Schema from 0001_init.sql');

  let missingTables = 0;
  for (const table of EXPECTED_TABLES) {
    // As anon with RLS on, a present-but-closed table answers with an empty
    // list, not an error. Only a *missing* table errors, which is the
    // difference this loop is looking for.
    const { error } = await anon.from(table).select('*').limit(1);
    if (!error) ok(`table public.${table}`);
    else if (isMissingRelation(error)) {
      missingTables++;
      fail(`table public.${table}`, 'SUPABASE', `Not found. Re-run supabase/migrations/0001_init.sql. (${msg(error)})`);
    } else {
      // e.g. "permission denied" — the table is there, RLS/grants are the story.
      ok(`table public.${table}`, `present (anon read refused: ${msg(error)})`);
    }
  }
  if (missingTables === EXPECTED_TABLES.length) {
    fatal(
      'Migration has been applied',
      'SUPABASE',
      'None of the eight tables exist. Run supabase/migrations/0001_init.sql in the SQL editor.',
    );
  }

  // peek_invite is the one RPC an anon caller is allowed, so it doubles as the
  // proof that the functions from the migration are installed and granted.
  {
    const { error } = await anon.rpc('peek_invite', { code: 'ZZ-ZZZZ' });
    if (!error) ok('function public.peek_invite');
    else if (isMissingFunction(error))
      fail('function public.peek_invite', 'SUPABASE', `Missing — re-run the migration. (${msg(error)})`);
    else fail('function public.peek_invite', 'SUPABASE', msg(error));
  }

  /* --------------------------------- 4. auth ------------------------------- */

  section('4. Authentication');

  const a = client(cfg);
  const b = client(cfg);

  async function signUp(sb, who, displayName) {
    const email = emailFor(who);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) {
      const m = msg(error).toLowerCase();
      if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
        fatal(
          `${displayName} can sign up`,
          'AUTH',
          'Email signups are disabled. Supabase → Authentication → Providers → Email → enable "Allow new users to sign up".',
        );
      }
      if (m.includes('invalid') && m.includes('email')) {
        fatal(
          `${displayName} can sign up`,
          'SUPABASE',
          `${msg(error)} — the project may be rejecting @example.com. Authentication → Settings, or lower the email restrictions.`,
        );
      }
      fatal(`${displayName} can sign up`, 'AUTH', msg(error));
    }
    if (!data.session) {
      fatal(
        `${displayName} can sign up`,
        'SUPABASE',
        'Signup succeeded but returned no session, which means "Confirm email" is ON. ' +
          'For this test turn it off: Authentication → Sign In / Providers → Email → uncheck "Confirm email". ' +
          '(Leave it on for production and confirm via the emailed link instead.)',
      );
    }
    ok(`${displayName} signed up`, email);
    return { email, userId: data.user.id };
  }

  const A = await signUp(a, 'a', 'Account A');
  const B = await signUp(b, 'b', 'Account B');

  // The handle_new_user trigger is the difference between a signed-in user
  // with somewhere to write and one stranded with nothing.
  for (const [sb, who, id] of [[a, 'Account A', A.userId], [b, 'Account B', B.userId]]) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) fail(`${who} has a profile row`, 'SUPABASE', msg(error));
    else if (!data)
      fail(
        `${who} has a profile row`,
        'SUPABASE',
        'No profile was created on signup — the on_auth_user_created trigger is missing. Re-run the migration.',
      );
    else ok(`${who} has a profile row`, `display_name="${data.display_name}"`);
  }

  // Signing back in is a separate promise from signing up.
  {
    const fresh = client(cfg);
    const { error } = await fresh.auth.signInWithPassword({ email: A.email, password });
    if (error) fail('Account A can sign back in', 'AUTH', msg(error));
    else ok('Account A can sign back in');
  }

  /* ------------------------------ 5. the MVP loop -------------------------- */

  section('5. MVP flow, end to end');

  // A creates the space.
  const code = must('generate_invite_code', await a.rpc('generate_invite_code'));
  ok('A generated an invite code', code);

  const couple = must(
    'create couple',
    await a
      .from('couples')
      .insert({
        created_by: A.userId,
        partner_1_user_id: A.userId,
        partner_2_name: 'Account B',
        invite_code: code,
        rhythm_start: today(),
        profile: {},
      })
      .select()
      .single(),
  );
  ok('A created a Couple777 space', couple.id);

  // The three clocks. Without them the home screen has nothing on it.
  const cycles = must(
    'seed cycles',
    await a
      .from('cycles')
      .insert([
        { couple_id: couple.id, tier: 'day', seq: 1, start_date: today(), due_date: addDays(7) },
        { couple_id: couple.id, tier: 'week', seq: 1, start_date: today(), due_date: addDays(49) },
        { couple_id: couple.id, tier: 'month', seq: 1, start_date: today(), due_date: addDays(213) },
      ])
      .select(),
  );
  ok('The three 777 clocks started', `${cycles.length} cycles`);

  // What B sees on the invite link before signing in.
  {
    const rows = must('peek_invite', await anon.rpc('peek_invite', { code }));
    const peek = rows?.[0];
    if (!peek) fail('The invite link resolves', 'CODE', 'peek_invite returned nothing for a code that exists.');
    else if (peek.is_open !== true) fail('The invite link shows an open seat', 'CODE', `is_open=${peek.is_open}`);
    else ok('The invite link resolves', `inviter "${peek.inviter_name}", seat open`);
  }

  // A stranger must not be able to read the space.
  {
    const { data } = await anon.from('couples').select('*').eq('id', couple.id);
    if (data?.length) fail('RLS hides the space from strangers', 'SUPABASE', 'anon could read the couple row — RLS is not on.');
    else ok('RLS hides the space from strangers');
  }
  {
    const { data } = await b.from('couples').select('*').eq('id', couple.id);
    if (data?.length) fail('RLS hides the space from B before joining', 'SUPABASE', 'B could read it without joining.');
    else ok('RLS hides the space from B before joining');
  }

  // B joins.
  const joinedId = must('join_couple_by_code', await b.rpc('join_couple_by_code', { code }));
  if (joinedId !== couple.id)
    fail('B joined the same couple', 'CODE', `joined ${joinedId}, expected ${couple.id}`);
  else ok('B joined the same couple');

  {
    const { data } = await b.from('couples').select('*').eq('id', couple.id).maybeSingle();
    if (!data) fail('B can now see the space', 'CODE', 'Still unreadable after joining.');
    else if (data.partner_2_user_id !== B.userId)
      fail('B is the second partner', 'CODE', `partner_2_user_id=${data.partner_2_user_id}`);
    else ok('B can now see the space, as partner 2');
  }

  // Each partner can see the other's name and avatar — every shared screen needs it.
  {
    const { data } = await b.from('profiles').select('*').eq('id', A.userId).maybeSingle();
    if (!data) fail('B can read A’s profile', 'SUPABASE', 'The partner profile policy is not letting this through.');
    else ok('B can read A’s profile', data.display_name);
  }

  // A makes a plan.
  const plan = must(
    'create plan',
    await a
      .from('plans')
      .insert({
        couple_id: couple.id,
        cycle_id: cycles.find((c) => c.tier === 'day')?.id ?? null,
        created_by: A.userId,
        cycle_type: 'day',
        title: 'Dinner at the little place on the corner',
        emoji: '\u{1F35D}',
        scheduled_date: addDays(3),
        scheduled_time: '19:30',
        location: 'The corner',
        surprise: false,
        status: 'planned',
      })
      .select()
      .single(),
  );
  ok('A created a 777 plan', `"${plan.title}" (${plan.status})`);

  // A invites B to it.
  const invite = must(
    'create plan invite',
    await a
      .from('plan_invites')
      .insert({
        plan_id: plan.id,
        couple_id: couple.id,
        sender_user_id: A.userId,
        recipient_user_id: B.userId,
        message: 'Come with me?',
      })
      .select()
      .single(),
  );
  must('mark plan invite_sent', await a.from('plans').update({ status: 'invite_sent' }).eq('id', plan.id));
  must(
    'notify B',
    await a.from('notifications').insert({
      couple_id: couple.id,
      user_id: B.userId,
      kind: 'plan_invite',
      title: 'Account A invited you',
      body: plan.title,
      plan_id: plan.id,
    }),
  );
  ok('A sent B an in-app invite', invite.id);

  // The sender must not be able to answer their own invitation.
  {
    const { data, error } = await a
      .from('plan_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)
      .select();
    if (!error && data?.length)
      fail('A cannot accept their own invite', 'SUPABASE', 'RLS let the sender accept it. The plan_invites update policy is wrong or missing.');
    else ok('A cannot accept their own invite');
  }

  // B sees it waiting.
  {
    const { data } = await b
      .from('plan_invites')
      .select('*')
      .eq('recipient_user_id', B.userId)
      .eq('status', 'pending');
    if (!data?.length) fail('B sees the pending invite', 'CODE', 'Nothing pending for B.');
    else ok('B sees the pending invite');
  }
  {
    const { data } = await b.from('notifications').select('*').eq('user_id', B.userId);
    if (!data?.length) fail('B got the notification', 'CODE', 'No notification row for B.');
    else ok('B got the notification', data[0].title);
  }

  // B accepts.
  must(
    'accept invite',
    await b
      .from('plan_invites')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', invite.id)
      .select()
      .single(),
  );
  must('confirm plan', await b.from('plans').update({ status: 'confirmed' }).eq('id', plan.id));
  must(
    'notify A',
    await b.from('notifications').insert({
      couple_id: couple.id,
      user_id: A.userId,
      kind: 'invite_accepted',
      title: 'Account B said yes',
      body: plan.title,
      plan_id: plan.id,
    }),
  );
  ok('B accepted the invite');

  // And A sees it, which is the whole point.
  {
    const { data } = await a.from('plans').select('*').eq('id', plan.id).maybeSingle();
    if (data?.status !== 'confirmed')
      fail('A sees the plan as confirmed', 'CODE', `status is "${data?.status}", expected "confirmed"`);
    else ok('A sees the plan as confirmed');
  }
  {
    const { data } = await a
      .from('notifications')
      .select('*')
      .eq('user_id', A.userId)
      .eq('kind', 'invite_accepted');
    if (!data?.length) fail('A was told B said yes', 'CODE', 'No invite_accepted notification for A.');
    else ok('A was told B said yes', data[0].title);
  }
  {
    const { data } = await a
      .from('plan_invites')
      .select('*')
      .eq('id', invite.id)
      .maybeSingle();
    if (data?.status !== 'accepted')
      fail('The invite reads accepted for both', 'CODE', `status is "${data?.status}"`);
    else ok('The invite reads accepted for both');
  }

  /* ------------------------------- 6. OAuth -------------------------------- */

  section('6. OAuth providers (informational)');
  for (const provider of ['google', 'apple']) {
    try {
      // A HEAD to the authorize endpoint says whether the provider is wired up
      // without actually starting a sign-in.
      const res = await fetch(
        `${cfg.url}/auth/v1/authorize?provider=${provider}`,
        { redirect: 'manual', headers: { apikey: cfg.key } },
      );
      const location = res.headers.get('location') ?? '';
      if (res.status >= 300 && res.status < 400 && !location.includes('error')) {
        ok(`${provider} OAuth is configured`);
      } else {
        note(`${provider} OAuth is NOT configured — email/password works, the ${provider} button will not.`);
      }
    } catch (e) {
      note(`${provider} OAuth could not be checked: ${msg(e)}`);
    }
  }

  return { coupleId: couple.id, planId: plan.id, emails: [A.email, B.email] };
}

/* --------------------------------- report --------------------------------- */

main()
  .then((result) => {
    console.log('\n' + '='.repeat(44));
    if (result) {
      console.log(`Test couple: ${result.coupleId}`);
      console.log(`Test accounts: ${result.emails.join(', ')}`);
      console.log('(Delete them in Authentication → Users when you are done.)');
    }
  })
  .catch((e) => {
    if (!(e instanceof Fatal)) {
      const kind = looksLikeNetwork(e) ? 'NETWORK' : isMissingRelation(e) || isMissingFunction(e) ? 'SUPABASE' : 'CODE';
      fail('Unexpected failure', kind, msg(e));
      if (process.env.DEBUG) console.error(e);
    }
  })
  .finally(() => {
    console.log('\n' + '='.repeat(44));
    console.log(`${passed} passed, ${failures.length} failed`);
    if (failures.length) {
      const by = (k) => failures.filter((f) => f.kind === k);
      for (const kind of ['NETWORK', 'SUPABASE', 'AUTH', 'CODE']) {
        const list = by(kind);
        if (!list.length) continue;
        const label = {
          NETWORK: 'Cannot reach Supabase from here',
          SUPABASE: 'Supabase configuration you need to change',
          AUTH: 'Auth / OAuth setup still to complete',
          CODE: 'Bugs in this repository',
        }[kind];
        console.log(`\n${label}:`);
        for (const f of list) console.log(`  - ${f.name}\n      ${f.detail}`);
      }
      process.exit(1);
    }
    console.log('Everything the MVP needs is working against the hosted project.');
  });
