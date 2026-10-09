const express = require("express");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createTenantPool } = require("../tenant");

const router = express.Router();

router.post(
    "/",
    
    authenticate,
    authorize("manage_users"),
    async (req, res) => {

        const {
            name,
            email,
            password,
            role
        } = req.body;

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            const roleResult = await pool.query(
                `SELECT id FROM roles WHERE name = $1`,
                [role]
            );

            if (roleResult.rows.length === 0) {
                await pool.end();

                return res.status(400).json({
                    message: "Invalid role"
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const result = await pool.query(`
                INSERT INTO users
                (name,email,password_hash,role_id)
                VALUES($1,$2,$3,$4)
                RETURNING id,name,email
            `, [
                name,
                email,
                passwordHash,
                roleResult.rows[0].id
            ]);

            await pool.end();

            res.status(201).json({
                message: "User created",
                user: result.rows[0]
            });

        } catch (error) {

            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.get(
    "/",
    authenticate,
    authorize("manage_users"),
    async (req, res) => {

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            const result = await pool.query(`
                SELECT
                    users.id,
                    users.name,
                    users.email,
                    roles.name AS role
                FROM users
                JOIN roles
                    ON users.role_id = roles.id
                ORDER BY users.id ASC
            `);

            await pool.end();

            res.json(result.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to load employees"
            });

        }
    }
);

module.exports = router;
