/**
 * Runs the real migration against real Postgres (PGlite is Postgres compiled
 * to WASM) with a faithful stand-in for the parts Supabase supplies: an auth
 * schema, an auth.uid() that reads the request JWT claim, and the anon /
 * authenticated roles. That is enough for the policies to behave exactly as
 * they will in a Supabase project, which is the only way to know they hold.
 */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const MIGRATION = new URL('../migrations/0001_init.sql', import.meta.url).pathname;

export async function freshDb() {
  const db = new PGlite();
  await db.exec(`
    create schema if not exists auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text unique,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    -- Matches Supabase's own definition, including the nullif that keeps an
    -- absent or empty claims setting from blowing up the cast.
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', ''
      )::uuid;
    $$;
    create role anon nologin;
    create role authenticated nologin;
    grant usage on schema public, auth to anon, authenticated;
  `);
  await db.exec(fs.readFileSync(MIGRATION, 'utf8'));
  // Supabase grants table privileges to these roles; RLS then narrows them.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select on all tables in schema public to anon;
    grant execute on all functions in schema public to anon, authenticated;
  `);
  return db;
}

/** Sign up a user the way GoTrue does, firing the profile trigger. */
export async function signUp(db, email, displayName) {
  await db.exec('reset role; reset request.jwt.claims;');
  const r = await db.query(
    `insert into auth.users (email, raw_user_meta_data)
     values ($1, jsonb_build_object('display_name', $2::text)) returning id`,
    [email, displayName],
  );
  return r.rows[0].id;
}

/** Run a block as a signed-in user, under the authenticated role and RLS. */
export async function as(db, userId, fn) {
  await db.exec('reset role;');
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    JSON.stringify({ sub: userId, role: 'authenticated' }),
  ]);
  await db.exec(`set role authenticated;`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role;');
  }
}

export async function asAnon(db, fn) {
  // A signed-out PostgREST request still carries claims — the anon role's —
  // they just have no `sub`. Sending an empty string instead would test a
  // situation that never happens.
  await db.exec('reset role;');
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    JSON.stringify({ role: 'anon' }),
  ]);
  await db.exec(`set role anon;`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role;');
  }
}

/* ------------------------------- assertions ------------------------------- */

let passed = 0;
const failures = [];

export function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}

/** Assert a statement is refused (by RLS, a constraint, or a raise). */
export async function denied(name, fn) {
  try {
    await fn();
    check(name, false, 'expected a refusal, but it succeeded');
  } catch (e) {
    check(name, true);
    return e;
  }
}

export function report(title) {
  console.log(`\n${title}: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
}
