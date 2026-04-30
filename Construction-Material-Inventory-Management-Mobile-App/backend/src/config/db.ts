import {Pool} from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// a pool manages multiple client connections to PostgreSQL.
// express will reuse these connections across requests instead of opening a new connection for every query.
const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'construction_inventory',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

// test the connection when the server starts
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Failed to connect to PostgreSQL:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL');
        release();
    }
});

export default pool;