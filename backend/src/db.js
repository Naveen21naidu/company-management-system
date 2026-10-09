const { Pool } = require("pg");
require("dotenv").config();

const masterPool = new Pool({
  connectionString: process.env.MASTER_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = masterPool;
