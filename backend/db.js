// ECODATA NEON DATABASE CONNECTION

import { neon } from "@neondatabase/serverless";

if(!process.env.DATABASE_URL) {
  throw new Error ("DATABASE_URL is missing from your env file");
}

const sql = neon(process.env.DATABASE_URL);

export default sql;