import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Cache the client on globalThis across Next.js dev-mode HMR reloads — without this, every hot
// reload creates a fresh connection pool without closing the old one, and the pool count climbs
// until Postgres refuses new connections ("sorry, too many clients already").
const globalForDb = globalThis as unknown as { __moqawilDbClient?: ReturnType<typeof postgres> }
const client = globalForDb.__moqawilDbClient ?? postgres(connectionString, { max: 10 })
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__moqawilDbClient = client
}

export const db = drizzle(client, { schema })

export * from './schema'
export type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
