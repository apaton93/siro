/** Local Docker database (see docker-compose.yml). Override with DATABASE_URL for any other environment. */
export const LOCAL_DATABASE_URL = 'postgres://siro:siro@127.0.0.1:5433/siro'

export function databaseUrl(): string {
  return process.env.DATABASE_URL ?? LOCAL_DATABASE_URL
}
