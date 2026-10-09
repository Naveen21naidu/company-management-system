const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createTenantPool } = require("../tenant");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("view_product"),
    async (req, res) => {

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            const result = await pool.query(
                `SELECT * FROM products ORDER BY id DESC`
            );

            await pool.end();

            res.json(result.rows);

        } catch (error) {

            res.status(500).json({
                message: error.message
            });
        }
    }
);


router.post(
    "/",
    authenticate,
    authorize("create_product"),
    async (req, res) => {

        const {
            name,
            description,
            price,
            stock
        } = req.body;

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            const result = await pool.query(`
                INSERT INTO products
                (name,description,price,stock,created_by)
                VALUES($1,$2,$3,$4,$5)
                RETURNING *
            `, [
                name,
                description,
                price,
                stock,
                req.user.userId
            ]);

            await pool.end();

            res.status(201).json(result.rows[0]);

        } catch (error) {

            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.put(
    "/:id",
    authenticate,
    authorize("update_product"),
    async (req, res) => {

        const {
            name,
            description,
            price,
            stock
        } = req.body;

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            const result = await pool.query(`
                UPDATE products
                SET
                    name = $1,
                    description = $2,
                    price = $3,
                    stock = $4
                WHERE id = $5
                RETURNING *
            `, [
                name,
                description,
                price,
                stock,
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

router.delete(
    "/:id",
    authenticate,
    authorize("delete_product"),
    async (req, res) => {

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            // Check if product is already used in an order
            const check = await pool.query(
                `SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1`,
                [req.params.id]
            );

            if (check.rows.length > 0) {

                await pool.end();

                return res.status(400).json({
                    message:
                        "Product cannot be deleted because it has existing orders."
                });
            }

            await pool.query(
                `DELETE FROM products WHERE id = $1`,
                [req.params.id]
            );

            await pool.end();

            res.json({
                message: "Product deleted successfully"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to delete product"
            });
        }
    }
);

router.patch(
    "/:id/publish",
    authenticate,
    authorize("publish_product"),
    async (req, res) => {

        try {

            const pool = createTenantPool(
                req.user.databaseName
            );

            const product = await pool.query(
                `SELECT * FROM products WHERE id = $1`,
                [req.params.id]
            );

            if (product.rows.length === 0) {
                await pool.end();

                return res.status(404).json({
                    message: "Product not found"
                });
            }

            if (product.rows[0].stock <= 0) {
                await pool.end();

                return res.status(400).json({
                    message: "Cannot publish product with zero stock"
                });
            }

            const result = await pool.query(`
                UPDATE products
                SET is_published = TRUE
                WHERE id = $1
                RETURNING *
            `, [req.params.id]);

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
