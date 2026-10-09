const { createTenantPool } = require("../tenant");

function authorize(...requiredPermissions) {
  return async (req, res, next) => {
    let pool;

    try {
      pool = createTenantPool(req.user.databaseName);
      const result = await pool.query(
        `SELECT p.name
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = $1`,
        [req.user.roleId]
      );

      const permissions = result.rows.map((row) => row.name);
      const allowed = requiredPermissions.every((permission) =>
        permissions.includes(permission)
      );

      if (!allowed) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Authorization error" });
    } finally {
      if (pool) {
        try {
          await pool.end();
        } catch (error) {
          console.error("Failed to close authorization database pool:", error);
        }
      }
    }
  };
}

module.exports = authorize;
