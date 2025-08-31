import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://builderai:builderai123@localhost:5432/builderai_dev';

// Create postgres client
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export the raw postgres client for direct SQL queries
export { client };

export default db;
