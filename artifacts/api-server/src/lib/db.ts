import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.RYZER_DATABASE_URL ?? process.env.DATABASE_URL,
});
