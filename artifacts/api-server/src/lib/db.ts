import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.RYZER_DATABASE_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  max: 5,
});
