const express = require("express");
const bcrypt = require("bcryptjs");
const masterPool = require("../db");
const { createTenantPool } = require("../tenant");

const router = express.Router();

router.get("/products", async (req, res) => {

    const { orgid } = req.query;

    try {

        const result = await masterPool.query(`
            SELECT database_name
            FROM organizations
            WHERE org_id = $1
        `, [orgid]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        const pool = createTenantPool(
            result.rows[0].database_name
        );

        const products = await pool.query(`
            SELECT id,name,description,price,stock
            FROM products
            WHERE is_published = TRUE
            AND stock > 0
        `);

        await pool.end();

        res.json(products.rows);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/orders", async (req, res) => {

    const {
        orgId,
        productId,
        quantity,
        name,
        email,
        phone,
        address,
        password
    } = req.body;

    const qty = Number(quantity);

    let pool;

    try {

        const org = await masterPool.query(`
            SELECT database_name
            FROM organizations
            WHERE org_id = $1
        `, [orgId]);

        if (org.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        pool = createTenantPool(
            org.rows[0].database_name
        );

        await pool.query("BEGIN");

        const productResult = await pool.query(`
            SELECT *
            FROM products
            WHERE id = $1
            FOR UPDATE
        `, [productId]);

        if (productResult.rows.length === 0) {

            await pool.query("ROLLBACK");
            await pool.end();

            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = productResult.rows[0];

        if (!product.is_published) {

            await pool.query("ROLLBACK");
            await pool.end();

            return res.status(400).json({
                message: "Product is not available"
            });
        }

        if (product.stock < qty) {

            await pool.query("ROLLBACK");
            await pool.end();

            return res.status(400).json({
                message: "Insufficient stock"
            });
        }

        let customer;

        const existingCustomer = await pool.query(
            `SELECT * FROM customers WHERE email = $1`,
            [email]
        );

        if (existingCustomer.rows.length > 0) {

            customer = existingCustomer.rows[0];

        } else {

            const passwordHash = password
                ? await bcrypt.hash(password, 10)
                : null;

            const customerResult = await pool.query(`
                INSERT INTO customers
                (name,email,password_hash,phone,address)
                VALUES($1,$2,$3,$4,$5)
                RETURNING *
            `, [
                name,
                email,
                passwordHash,
                phone,
                address
            ]);

            customer = customerResult.rows[0];
        }

        const total = Number(product.price) * qty;

        const orderResult = await pool.query(`
            INSERT INTO orders
            (customer_id,total_amount,shipping_address,status)
            VALUES($1,$2,$3,'ORDERED')
            RETURNING *
        `, [
            customer.id,
            total,
            address
        ]);

        const order = orderResult.rows[0];

        await pool.query(`
            INSERT INTO order_items
            (order_id,product_id,quantity,unit_price)
            VALUES($1,$2,$3,$4)
        `, [
            order.id,
            product.id,
            qty,
            product.price
        ]);

        await pool.query(`
            UPDATE products
            SET stock = stock - $1
            WHERE id = $2
        `, [
            qty,
            product.id
        ]);

        await pool.query("COMMIT");

        await pool.end();

        res.status(201).json({
            message: "Order placed successfully",
            orderId: order.id,
            status: order.status,
            totalAmount: total
        });

    } catch (error) {

        if (pool) {

            try {
                await pool.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }

            try {
                await pool.end();
            } catch (endError) {
                console.error("Pool close failed:", endError);
            }
        }

        console.error(error);

        res.status(500).json({
            message: "Order failed",
            error: error.message
        });
    }
});

router.post("/track", async (req, res) => {

    const {
        orgId,
        email,
        password
    } = req.body;

    try {

        const org = await masterPool.query(`
            SELECT database_name
            FROM organizations
            WHERE org_id = $1
        `, [orgId]);

        if (org.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        const pool = createTenantPool(
            org.rows[0].database_name
        );

        const customerResult = await pool.query(
            `SELECT * FROM customers WHERE email = $1`,
            [email]
        );

        if (customerResult.rows.length === 0) {
            await pool.end();

            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const customer = customerResult.rows[0];

        if (!customer.password_hash) {
            await pool.end();

            return res.status(401).json({
                message: "Customer password not configured"
            });
        }

        const valid = await bcrypt.compare(
            password,
            customer.password_hash
        );

        if (!valid) {
            await pool.end();

            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const orders = await pool.query(`
            SELECT
                o.id,
                o.status,
                o.total_amount,
                o.shipping_address,
                o.created_at,
                oi.product_id,
                p.name AS product_name,
                oi.quantity,
                oi.unit_price
            FROM orders o
            JOIN order_items oi
            ON oi.order_id = o.id
            JOIN products p
            ON p.id = oi.product_id
            WHERE o.customer_id = $1
            ORDER BY o.id DESC
        `, [customer.id]);

        await pool.end();

        res.json({
            customer: {
                name: customer.name,
                email: customer.email
            },
            orders: orders.rows
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
