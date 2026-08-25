import { Pool } from "pg";

// Ensure DATABASE_URL is added to your .env and serverless.yml
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Recommended for AWS Lambda to prevent hanging connections
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 2000,
});