/**
 * A local stand-in for the parts of Supabase this app talks to, so the real
 * client code can be driven end to end without a project.
 *
 * It is PGlite — Postgres compiled to WASM — behind a small HTTP server
 * speaking enough PostgREST and GoTrue for @supabase/supabase-js. Every
 * request sets request.jwt.claims and runs as the `authenticated` role, so
 * the actual Row Level Security policies from the migration decide what each
 * user can see. That is the point: the security half is genuinely exercised,
 * not stubbed.
 *
 * What it is NOT: a Supabase emulator. No email confirmation, no OAuth, no
 * Realtime, no refresh-token rotation. It exists to prove the app's own wiring
 * — sign up, create a space, invite, accept, see it confirmed — is correct
 * before it meets the real thing.
 */
import { createServer } from 'node:http';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import crypto from 'node:crypto';

const MIGRATION = new URL('../migrations/0001_init.sql', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 54321);

const db = new PGlite();
await db.exec(`
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    encrypted_password text,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
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
await db.exec(`
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant select on all tables in schema public to anon;
  grant execute on all functions in schema public to anon, authenticated;
`);

/* --------------------------------- tokens --------------------------------- */

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function mintToken(userId, email) {
  // A structurally real JWT. Nothing verifies the signature here; the client
  // only reads the payload for expiry.
  const payload = {
    sub: userId,
    email,
    role: 'authenticated',
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.local`;
}
function readToken(req) {
  const auth = req.headers.authorization ?? '';
  const raw = auth.replace(/^Bearer\s+/i, '');
  const part = raw.split('.')[1];
  if (!part) return null;
  try {
    const claims = JSON.parse(Buffer.from(part, 'base64url').toString());
    return claims.sub ? claims : null;
  } catch {
    return null;
  }
}

/** Run a block as a given user, under RLS. */
async function asUser(claims, fn) {
  await db.exec('reset role;');
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    JSON.stringify(claims ?? { role: 'anon' }),
  ]);
  await db.exec(`set role ${claims ? 'authenticated' : 'anon'};`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role;');
  }
}

const hash = (p) => crypto.createHash('sha256').update(p).digest('hex');

/* ------------------------------ PostgREST bits ----------------------------- */

/** `eq.x`, `in.(a,b)`, `is.null` — the operators this app actually emits. */
function operand(raw, params) {
  const [op, ...rest] = raw.split('.');
  const value = rest.join('.');
  switch (op) {
    case 'eq':
      params.push(value);
      return `= $${params.length}`;
    case 'neq':
      params.push(value);
      return `<> $${params.length}`;
    case 'is':
      return value === 'null' ? 'is null' : `is ${value}`;
    case 'in': {
      const list = value.replace(/^\(|\)$/g, '').split(',').filter(Boolean);
      if (!list.length) return 'in (null)';
      const slots = list.map((v) => {
        params.push(v.replace(/^"|"$/g, ''));
        return `$${params.length}`;
      });
      return `in (${slots.join(', ')})`;
    }
    default:
      throw new Error(`local-server: unsupported operator "${op}"`);
  }
}

function buildWhere(url, params) {
  const clauses = [];
  for (const [key, raw] of url.searchParams) {
    // `columns` is sent by supabase-js on bulk inserts; it is not a filter.
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(key)) continue;
    if (key === 'or') {
      // or=(a.eq.1,b.eq.2)
      const inner = raw.replace(/^\(|\)$/g, '').split(',');
      const parts = inner.map((piece) => {
        const [col, ...opRest] = piece.split('.');
        return `"${col}" ${operand(opRest.join('.'), params)}`;
      });
      clauses.push(`(${parts.join(' or ')})`);
      continue;
    }
    clauses.push(`"${key}" ${operand(raw, params)}`);
  }
  return clauses.length ? `where ${clauses.join(' and ')}` : '';
}

function buildOrder(url) {
  const raw = url.searchParams.get('order');
  if (!raw) return '';
  const parts = raw.split(',').map((p) => {
    const [col, ...mods] = p.split('.');
    const dir = mods.includes('desc') ? 'desc' : 'asc';
    return `"${col}" ${dir}`;
  });
  return `order by ${parts.join(', ')}`;
}

const LOG = process.env.LOG_REQUESTS === '1';

/**
 * `.single()` and `.maybeSingle()` ask for a bare object rather than an array
 * via this Accept header, and real PostgREST obliges. A shim that always
 * returned an array would hand the client `data.id === undefined` and every
 * follow-up write would then be denied for referencing a null id — which looks
 * exactly like an RLS bug and is not one.
 */
function singleWanted(req) {
  return (req.headers.accept ?? '').includes('vnd.pgrst.object');
}

/**
 * PGlite hands back a JS Date for `date` columns, which JSON-serialises to a
 * full timestamp. Real PostgREST sends a plain YYYY-MM-DD. Emitting the
 * timestamp instead would have the client parsing "2026-09-03T00:00:00.000Z"
 * everywhere it expects a day, so match PostgREST.
 */
const DATE_OID = 1082;
function coerceDates(out) {
  const dateCols = (out.fields ?? []).filter((f) => f.dataTypeID === DATE_OID).map((f) => f.name);
  if (!dateCols.length) return out.rows;
  return out.rows.map((row) => {
    const next = { ...row };
    for (const c of dateCols) {
      const v = next[c];
      if (v instanceof Date) next[c] = v.toISOString().slice(0, 10);
      else if (typeof v === 'string' && v.includes('T')) next[c] = v.slice(0, 10);
    }
    return next;
  });
}

function shape(req, rows) {
  if (!singleWanted(req)) return rows;
  return rows.length ? rows[0] : null;
}

const json = (res, code, body) => {
  if (LOG && code >= 400) console.error(`  <- ${code}`, JSON.stringify(body));
  res.writeHead(code, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-expose-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    return undefined;
  }
}

/* --------------------------------- routing --------------------------------- */

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'OPTIONS') return json(res, 204);
  if (LOG) console.error(`  -> ${req.method} ${url.pathname}${url.search}`);

  try {
    /* ---- GoTrue ---- */
    if (url.pathname === '/auth/v1/signup') {
      const body = await readBody(req);
      const existing = await db.query('select id from auth.users where email = $1', [body.email]);
      if (existing.rows.length) {
        return json(res, 400, { message: 'User already registered' });
      }
      const r = await db.query(
        `insert into auth.users (email, encrypted_password, raw_user_meta_data)
         values ($1, $2, $3) returning id, email`,
        [body.email, hash(body.password), JSON.stringify(body.data ?? {})],
      );
      const user = { id: r.rows[0].id, email: r.rows[0].email, user_metadata: body.data ?? {} };
      return json(res, 200, {
        access_token: mintToken(user.id, user.email),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `r-${user.id}`,
        user,
      });
    }

    if (url.pathname === '/auth/v1/token') {
      const body = await readBody(req);
      const r = await db.query(
        'select id, email, raw_user_meta_data from auth.users where email = $1 and encrypted_password = $2',
        [body.email, hash(body.password ?? '')],
      );
      if (!r.rows.length) return json(res, 400, { message: 'Invalid login credentials' });
      const u = r.rows[0];
      const user = { id: u.id, email: u.email, user_metadata: u.raw_user_meta_data };
      return json(res, 200, {
        access_token: mintToken(u.id, u.email),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `r-${u.id}`,
        user,
      });
    }

    if (url.pathname === '/auth/v1/user') {
      const claims = readToken(req);
      if (!claims) return json(res, 401, { message: 'invalid claim' });
      const r = await db.query('select id, email, raw_user_meta_data from auth.users where id = $1', [
        claims.sub,
      ]);
      if (!r.rows.length) return json(res, 401, { message: 'user not found' });
      return json(res, 200, {
        id: r.rows[0].id,
        email: r.rows[0].email,
        user_metadata: r.rows[0].raw_user_meta_data,
        aud: 'authenticated',
challenge: undefined,
      });
    }

    if (url.pathname === '/auth/v1/logout') return json(res, 204);

    /* ---- PostgREST ---- */
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = url.pathname.slice('/rest/v1/rpc/'.length);
      const args = (await readBody(req)) ?? {};
      const claims = readToken(req);
      const names = Object.keys(args);
      const params = names.map((n) => args[n]);
      const call = names.length
        ? `select * from public."${fn}"(${names.map((n, i) => `"${n}" => $${i + 1}`).join(', ')})`
        : `select * from public."${fn}"()`;
      try {
        const out = await asUser(claims, () => db.query(call, params));
        // A scalar-returning function comes back as a bare value.
        const cols = out.fields?.map((f) => f.name) ?? [];
        if (cols.length === 1 && cols[0] === fn) {
          return json(res, 200, out.rows[0]?.[fn] ?? null);
        }
        return json(res, 200, out.rows);
      } catch (e) {
        return json(res, 400, { message: e.message, code: e.code ?? 'P0001' });
      }
    }

    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.slice('/rest/v1/'.length);
      const claims = readToken(req);
      const prefer = req.headers.prefer ?? '';
      const wantsRow = prefer.includes('return=representation');
      const params = [];
      const where = buildWhere(url, params);

      const run = async (sql, ps) => asUser(claims, () => db.query(sql, ps));

      if (req.method === 'GET') {
        const order = buildOrder(url);
        const limit = url.searchParams.get('limit');
        const sql = `select * from public."${table}" ${where} ${order} ${limit ? `limit ${Number(limit)}` : ''}`;
        const out = await run(sql, params);
        return json(res, 200, shape(req, coerceDates(out)));
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const rows = Array.isArray(body) ? body : [body];
        const upsert = prefer.includes('resolution=merge-duplicates');
        const results = [];
        for (const row of rows) {
          const cols = Object.keys(row).filter((k) => row[k] !== undefined);
          const values = cols.map((c) => normalise(row[c]));
          const slots = cols.map((_, i) => `$${i + 1}`);
          let sql = `insert into public."${table}" (${cols.map((c) => `"${c}"`).join(', ')}) values (${slots.join(', ')})`;
          if (upsert) {
            const conflict = url.searchParams.get('on_conflict') ?? primaryKeyOf(table);
            const updates = cols.filter((c) => !conflict.split(',').includes(c));
            sql += ` on conflict (${conflict.split(',').map((c) => `"${c.trim()}"`).join(', ')}) do update set ${updates
              .map((c) => `"${c}" = excluded."${c}"`)
              .join(', ')}`;
          }
          /*
           * Only ask for the row back when the client wants it. RETURNING is
           * checked against the SELECT policy, so a row you may write but not
           * read — Katy writing into Marian's notification inbox is exactly
           * that — would be refused for a reason that has nothing to do with
           * whether the insert was allowed. Real PostgREST omits RETURNING on
           * `Prefer: return=minimal`, and so does this.
           */
          if (wantsRow) sql += ' returning *';
          const out = await run(sql, values);
          if (wantsRow) results.push(...coerceDates(out));
        }
        return json(res, wantsRow ? 200 : 201, wantsRow ? shape(req, results) : undefined);
      }

      if (req.method === 'PATCH') {
        const body = await readBody(req);
        const cols = Object.keys(body).filter((k) => body[k] !== undefined);
        const sets = cols.map((c, i) => `"${c}" = $${params.length + i + 1}`);
        const all = [...params, ...cols.map((c) => normalise(body[c]))];
        const sql = `update public."${table}" set ${sets.join(', ')} ${where}${wantsRow ? ' returning *' : ''}`;
        const out = await run(sql, all);
        return json(res, 200, wantsRow ? shape(req, coerceDates(out)) : undefined);
      }

      if (req.method === 'DELETE') {
        const sql = `delete from public."${table}" ${where}${wantsRow ? ' returning *' : ''}`;
        const out = await run(sql, params);
        return json(res, 200, wantsRow ? out.rows : undefined);
      }
    }

    return json(res, 404, { message: 'not found' });
  } catch (e) {
    return json(res, 400, { message: e.message, code: e.code ?? 'P0001', details: e.detail });
  }
});

function normalise(v) {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return `{${v.map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(',')}}`;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

const PKS = {
  profiles: 'id',
  couples: 'id',
  cycles: 'id',
  plans: 'id',
  plan_invites: 'id',
  memories: 'id',
  memory_private_notes: 'memory_id,user_id',
  notifications: 'id',
};
function primaryKeyOf(table) {
  return PKS[table] ?? 'id';
}

server.listen(PORT, () => console.log(`local supabase stand-in on http://localhost:${PORT}`));
