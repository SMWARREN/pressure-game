/**
 * PRESSURE GAME - Backend Server with MySQL
 *
 * This is an example Node.js/Express server that stores game data in MySQL.
 * Use this as a reference to implement your own backend.
 *
 * Installation:
 *   npm install express mysql2 cors dotenv body-parser
 *
 * Usage:
 *   1. Copy this to server/index.js
 *   2. Set up MySQL database (see schema below)
 *   3. Create .env with MySQL credentials
 *   4. Run: node server/index.js
 *   5. Frontend connects via VITE_API_URL=http://localhost:3001/api
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection Pool
let pool;

async function initDatabase() {
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'pressure_game',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Create table if it doesn't exist
  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS game_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        data_key VARCHAR(255) NOT NULL,
        data_value LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_key (user_id, data_key),
        INDEX idx_user_id (user_id),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Database table ready');
  } catch (error) {
    console.error('❌ Failed to create table:', error);
  } finally {
    connection.release();
  }
}

// Routes

/**
 * GET /api/data/:userId/:key
 * Retrieve a value from the database
 */
app.get('/api/data/:userId/:key', async (req, res) => {
  try {
    const { userId, key } = req.params;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT data_value FROM game_data WHERE user_id = ? AND data_key = ?',
        [userId, key]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.json({ value: rows[0].data_value });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[GET] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/data/:userId/:key
 * Save a value to the database
 */
app.post('/api/data/:userId/:key', async (req, res) => {
  try {
    const { userId, key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Missing value' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO game_data (user_id, data_key, data_value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         data_value = VALUES(data_value),
         updated_at = CURRENT_TIMESTAMP`,
        [userId, key, value]
      );

      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[POST] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/data/:userId/:key
 * Delete a value from the database
 */
app.delete('/api/data/:userId/:key', async (req, res) => {
  try {
    const { userId, key } = req.params;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'DELETE FROM game_data WHERE user_id = ? AND data_key = ?',
        [userId, key]
      );

      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[DELETE] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/user/:userId/data
 * Retrieve all data for a user (for backups/exports)
 */
app.get('/api/user/:userId/data', async (req, res) => {
  try {
    const { userId } = req.params;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT data_key, data_value FROM game_data WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );

      const data = {};
      rows.forEach((row) => {
        data[row.data_key] = row.data_value;
      });

      res.json(data);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[GET ALL] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.SERVER_PORT || 3001;

async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`\n🎮 Pressure Game Server running at http://localhost:${PORT}`);
      console.log(`📊 MySQL Database: ${process.env.MYSQL_DATABASE}`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  GET  /api/data/:userId/:key`);
      console.log(`  POST /api/data/:userId/:key`);
      console.log(`  DELETE /api/data/:userId/:key`);
      console.log(`  GET  /api/user/:userId/data (export all)`);
      console.log(`  GET  /api/health (health check)\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
