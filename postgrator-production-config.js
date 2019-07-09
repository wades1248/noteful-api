require('dotenv').config();

module.exports = {
  "migrationDirectory": "migrations",
  "driver": "pg",
  connectionString: process.env.DATABASE_URL,
}