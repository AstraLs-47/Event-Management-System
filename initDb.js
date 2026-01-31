import 'dotenv/config';
import pool from './src/config/db.js';

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database tables...');
    await client.query('BEGIN');

    // Users Table
    // Note: "fullName" is quoted to match the camelCase usage in authController
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        "fullName" VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Events Table
    // Note: "userId" is quoted to match eventController logic
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        date TIMESTAMP,
        time VARCHAR(255),
        location VARCHAR(255),
        image TEXT,
        type VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255),
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Comments Table
    // Note: "userId" and "eventId" are quoted to match commentController logic
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "eventId" INTEGER REFERENCES events(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database tables initialized successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

initDb();