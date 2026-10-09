const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createTenantPool } = require("../tenant");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("view_orders"),
    async (req, res) => {

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            const result = await pool.query(`
                SELECT
                    o.id,
                    c.name AS customer_name,
                    c.email,
                    o.total_amount,
                    o.status,
                    o.shipping_address,
                    o.created_at
                FROM orders o
                JOIN customers c
                ON c.id = o.customer_id
                ORDER BY o.id DESC
            `);

            await pool.end();

            res.json(result.rows);

        } catch (error) {

            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.patch(
    "/:id/status",
    authenticate,
    authorize("update_order_status"),
    async (req, res) => {

        const { status } = req.body;

        const allowedStatuses = [
            "ORDERED",
            "SHIPPED",
            "DELIVERED"
        ];

        try {

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid status"
                });
            }

            const pool = createTenantPool(
                req.user.databaseName
            );

            const current = await pool.query(
                `SELECT status FROM orders WHERE id = $1`,
                [req.params.id]
            );

            if (current.rows.length === 0) {
                await pool.end();

                return res.status(404).json({
                    message: "Order not found"
                });
            }

            const oldStatus = current.rows[0].status;

            const validTransition =
                (oldStatus === "ORDERED" && status === "SHIPPED") ||
                (oldStatus === "SHIPPED" && status === "DELIVERED");

            if (!validTransition) {
                await pool.end();

                return res.status(400).json({
                    message: `Invalid transition from ${oldStatus} to ${status}`
                });
            }

            const result = await pool.query(`
                UPDATE orders
                SET status = $1
                WHERE id = $2
                RETURNING *
            `, [
                status,
                req.params.id
            ]);

            await pool.end();

            res.json(result.rows[0]);

        } catch (error) {

            res.status(500).json({
                message: error.message
            });
        }
    }
);

module.exports = router;
