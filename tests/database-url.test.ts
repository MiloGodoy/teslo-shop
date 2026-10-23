import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDatabaseUrl } from '../src/lib/database-url';

test('Supabase transaction pooling enables Prisma 6 compatibility without losing credentials or parameters', () => {
  const url = new URL(getDatabaseUrl('postgresql://postgres.project:secret%40value@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public&connection_limit=2')!);
  assert.equal(url.searchParams.get('pgbouncer'), 'true');
  assert.equal(url.searchParams.get('sslmode'), 'require');
  assert.equal(url.searchParams.get('schema'), 'public');
  assert.equal(url.searchParams.get('connection_limit'), '2');
  assert.equal(url.password, 'secret%40value');
  assert.equal(url.username, 'postgres.project');
});

test('Supabase compatibility overrides pgbouncer=false and keeps stricter SSL', () => {
  const url = new URL(getDatabaseUrl('postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=false&sslmode=verify-full')!);
  assert.equal(url.searchParams.get('pgbouncer'), 'true');
  assert.equal(url.searchParams.get('sslmode'), 'verify-full');
});

test('local, session pooler and unrelated connections retain their configuration', () => {
  for (const url of [
    'postgresql://postgres:pass@localhost:5435/teslo-shop?schema=public',
    'postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
    'postgresql://user:pass@other.example:6543/postgres',
    'not a valid URL',
    '',
  ]) assert.equal(getDatabaseUrl(url), url);
});
