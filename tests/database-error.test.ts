import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDatabaseError } from '../src/lib/database-error';

test('database diagnostics keep the complete cause on one line without credentials', () => {
  const original = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = 'postgresql://postgres.private:encoded%40secret@private.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require';
    const error = new Error(`Invalid query\nprepared statement "s0" does not exist\n${process.env.DATABASE_URL}\nencoded@secret`, {
      cause: new Error('Database code 26000'),
    });
    const output = formatDatabaseError('product.getBySlug', error);
    assert.equal(output.includes('\n'), false);
    assert.equal(output.includes('encoded@secret'), false);
    assert.equal(output.includes('encoded%40secret'), false);
    assert.equal(output.includes('postgres.private'), false);
    const parsed = JSON.parse(output);
    assert.match(parsed.error.message, /prepared statement "s0" does not exist/);
    assert.equal(parsed.error.cause.message, 'Database code 26000');
    assert.equal(parsed.connection.port, '6543');
    assert.equal(parsed.connection.pgbouncer, true);
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
});

test('database diagnostics redact URLs even when they are not environment values', () => {
  const output = formatDatabaseError('test', new Error('Cannot connect to postgresql://user:other-secret@private.example/db'));
  assert.equal(output.includes('other-secret'), false);
  assert.equal(output.includes('private.example'), false);
});
