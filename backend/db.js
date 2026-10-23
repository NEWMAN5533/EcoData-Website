// ECODATA NEON DATABASE CONNECTION

import {
  neon,
  neonConfig,
  Pool
 } from "@neondatabase/serverless";

 import ws from "ws";

if(!process.env.DATABASE_URL) {
  throw new Error ("DATABASE_URL is missing from your env file");
}


// neon HTTP client -existing controllers continue using:
const sql = neon(process.env.DATABASE_URL);

// Websocket transport for interactive PostgreSQL transactions.
neonConfig.webSocketConstructor = ws;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default sql;
