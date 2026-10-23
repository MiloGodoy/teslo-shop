export function getDatabaseUrl(value = process.env.DATABASE_URL): string | undefined {
  if (!value) return value;
  try {
    const url = new URL(value);
    if (['postgres:', 'postgresql:'].includes(url.protocol) &&
        url.hostname.endsWith('.pooler.supabase.com') && url.port === '6543') {
      // Prisma 6 must disable its prepared-statement cache behind Supavisor
      // transaction pooling, regardless of whether the environment URL includes it.
      url.searchParams.set('pgbouncer', 'true');
      if (!url.searchParams.has('sslmode') || ['disable', 'allow', 'prefer'].includes(url.searchParams.get('sslmode')!)) {
        url.searchParams.set('sslmode', 'require');
      }
      return url.toString();
    }
  } catch { /* Let Prisma report invalid URLs; never log their contents here. */ }
  return value;
}
