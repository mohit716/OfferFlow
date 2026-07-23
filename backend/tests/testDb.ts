/**
 * Helpers for locating the dedicated test database.
 *
 * The test suite never touches your real database. Instead it derives a
 * sibling database named "<db>_test" from DATABASE_URL and runs migrations
 * against that. e.g. .../offerflow  ->  .../offerflow_test
 */

export function deriveTestUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, '');
  url.pathname = `/${dbName}_test`;
  return url.toString();
}

/** The admin URL points at the default "postgres" database on the same server,
 * used only to CREATE the test database if it doesn't exist. */
export function deriveAdminUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}

export function testDatabaseName(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  return url.pathname.replace(/^\//, '') + '_test';
}
