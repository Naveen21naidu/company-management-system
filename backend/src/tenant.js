const { Pool } = require("pg");
const masterPool = require("./db");

function validateOrgId(orgId) {
  return typeof orgId === "string" && /^[a-zA-Z0-9]+$/.test(orgId);
}

function getDatabaseName(orgId) {
  return `org_${orgId.toLowerCase()}`;
}

async function createTenantDatabase(databaseName) {
  if (!/^org_[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error("Invalid database name");
  }

  try {
    await masterPool.query(`CREATE DATABASE "${databaseName}"`);
  } catch (error) {
    // PostgreSQL error code 42P04 means the database already exists.
    if (error.code !== "42P04") throw error;
  }
}

function createTenantPool(databaseName) {
  const url = new URL(process.env.MASTER_DATABASE_URL);
  url.pathname = `/${databaseName}`;

  return new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  });
}

async function createTenantTables(databaseName) {

    const pool = createTenantPool(databaseName);

    try {

        await pool.query(`

            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY(role_id, permission_id)
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role_id INTEGER REFERENCES roles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                price NUMERIC(12,2) NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                is_published BOOLEAN DEFAULT FALSE,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT,
                phone VARCHAR(50),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id),
                status VARCHAR(30) DEFAULT 'ORDERED',
                total_amount NUMERIC(12,2) DEFAULT 0,
                shipping_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price NUMERIC(12,2) NOT NULL
            );

        `);

        // Roles
        await pool.query(`
            INSERT INTO roles(name)
            VALUES
            ('Admin'),
            ('Inventory Manager'),
            ('Account Manager')
            ON CONFLICT(name) DO NOTHING
        `);

        // Permissions
        const permissions = [
            "view_product",
            "create_product",
            "update_product",
            "delete_product",
            "publish_product",
            "view_orders",
            "update_order_status",
            "manage_users"
        ];

        for (const permission of permissions) {
            await pool.query(
                `INSERT INTO permissions(name)
                 VALUES($1)
                 ON CONFLICT(name) DO NOTHING`,
                [permission]
            );
        }

        // Admin gets all permissions
        await pool.query(`
            INSERT INTO role_permissions(role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r CROSS JOIN permissions p
            WHERE r.name = 'Admin'
            ON CONFLICT DO NOTHING
        `);

        // Inventory Manager permissions
        await pool.query(`
            INSERT INTO role_permissions(role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            JOIN permissions p
            ON p.name IN (
                'view_product',
                'create_product',
                'update_product',
                'delete_product',
                'publish_product'
            )
            WHERE r.name = 'Inventory Manager'
            ON CONFLICT DO NOTHING
        `);

        // Account Manager permissions
        await pool.query(`
            INSERT INTO role_permissions(role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            JOIN permissions p
            ON p.name IN (
                'view_product',
                'view_orders',
                'update_order_status'
            )
            WHERE r.name = 'Account Manager'
            ON CONFLICT DO NOTHING
        `);

        console.log(`Tenant database ready: ${databaseName}`);

    } finally {
        await pool.end();
    }
}

module.exports = {
  validateOrgId,
  getDatabaseName,
  createTenantDatabase,
  createTenantPool,
  createTenantTables,
};
