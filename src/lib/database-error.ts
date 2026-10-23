import { getDatabaseUrl } from './database-url';

function redact(message: string): string {
  let result = message;
  for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    if (!value) continue;
    result = result.replaceAll(value, '[database URL hidden]');
    try {
      const password = new URL(value).password;
      for (const secret of new Set([password, decodeURIComponent(password)])) {
        if (secret) result = result.replaceAll(secret, '[password hidden]');
      }
    } catch { /* The message still receives generic URI redaction below. */ }
  }
  return result.replace(/postgres(?:ql)?:\/\/[^\s"'`<>]+/gi, '[database URL hidden]');
}

function describe(error: unknown, depth = 0): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return { message: redact(typeof error === 'string' ? error : 'Unknown database error') };
  }
  const value = error as { name?: unknown; message?: unknown; code?: unknown; cause?: unknown };
  return {
    name: typeof value.name === 'string' ? redact(value.name) : undefined,
    code: typeof value.code === 'string' ? redact(value.code) : undefined,
    message: typeof value.message === 'string' ? redact(value.message) : 'Unknown database error',
    ...(depth < 2 && value.cause ? { cause: describe(value.cause, depth + 1) } : {}),
  };
}

export function formatDatabaseError(operation: string, error: unknown): string {
  let connection: Record<string, unknown> = { configured: !!process.env.DATABASE_URL };
  try {
    const effectiveUrl = getDatabaseUrl()!;
    const url = new URL(effectiveUrl);
    connection = {
      configured: true,
      port: url.port || '5432',
      supabasePooler: url.hostname.endsWith('.pooler.supabase.com'),
      pgbouncer: url.searchParams.get('pgbouncer') === 'true',
      sslRequired: url.searchParams.get('sslmode') === 'require',
      compatibilityApplied: effectiveUrl !== process.env.DATABASE_URL,
    };
  } catch { /* Do not print a malformed URL: it can contain credentials. */ }
  // JSON escapes line breaks so Vercel receives the whole error as one log entry.
  return JSON.stringify({ event: 'database_error', operation, connection, error: describe(error) });
}
