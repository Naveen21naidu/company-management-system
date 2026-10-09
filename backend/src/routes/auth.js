const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const masterPool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET;
const {
  validateOrgId,
  getDatabaseName,
  createTenantDatabase,
  createTenantTables,
  createTenantPool,
} = require("../tenant");

const router = express.Router();

router.post("/signup", async (req, res) => {

    const {
        orgId,
        orgName,
        email,
        password,
        confirmPassword,
        orgCountry
    } = req.body;

    try {

        if (
            !orgId ||
            !orgName ||
            !email ||
            !password ||
            !confirmPassword ||
            !orgCountry
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!validateOrgId(orgId)) {
            return res.status(400).json({
                message: "Org ID must be alphanumeric"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters"
            });
        }

        const duplicate = await masterPool.query(`
            SELECT id
            FROM organizations
            WHERE org_id = $1 OR email = $2
        `, [orgId, email]);

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                message: "Organization ID or email already exists"
            });
        }

        const databaseName = getDatabaseName(orgId);

        // Create tenant DB
        await createTenantDatabase(databaseName);

        // Create tenant tables
        await createTenantTables(databaseName);

        // Insert organization into master DB
        const orgResult = await masterPool.query(`
            INSERT INTO organizations
            (org_id, org_name, email, country, database_name)
            VALUES($1,$2,$3,$4,$5)
            RETURNING id
        `, [
            orgId,
            orgName,
            email,
            orgCountry,
            databaseName
        ]);

        const organizationId = orgResult.rows[0].id;

        // Free trial
        await masterPool.query(`
            INSERT INTO subscriptions
            (organization_id, plan, status, trial_start, trial_end)
            VALUES(
                $1,
                'FREE_TRIAL',
                'ACTIVE',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP + INTERVAL '14 days'
            )
        `, [organizationId]);

        // Create first Admin
        const tenantPool = createTenantPool(databaseName);

        const passwordHash = await bcrypt.hash(password, 10);

        const roleResult = await tenantPool.query(
            `SELECT id FROM roles WHERE name = 'Admin'`
        );

        await tenantPool.query(`
            INSERT INTO users
            (name, email, password_hash, role_id)
            VALUES($1,$2,$3,$4)
        `, [
            orgName + " Admin",
            email,
            passwordHash,
            roleResult.rows[0].id
        ]);

        await tenantPool.end();

        res.status(201).json({
            message: "Organization created successfully",
            orgId,
            database: databaseName,
            subscription: "FREE_TRIAL"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Signup failed",
            error: error.message
        });
    }
});

router.post("/login", async (req, res) => {

    const {
        orgId,
        email,
        password
    } = req.body;

    try {

        const result = await masterPool.query(`
            SELECT database_name
            FROM organizations
            WHERE org_id = $1
        `, [orgId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        const databaseName = result.rows[0].database_name;

        const pool = createTenantPool(databaseName);

        const userResult = await pool.query(`
            SELECT
                u.id,
                u.name,
                u.email,
                u.password_hash,
                u.role_id,
                r.name AS role
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.email = $1
        `, [email]);

        if (userResult.rows.length === 0) {
            await pool.end();

            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            await pool.end();

            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                orgId,
                databaseName,
                roleId: user.role_id,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        await pool.end();

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});


module.exports = router;
