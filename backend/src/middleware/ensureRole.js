// backend/src/middleware/ensureRole.js
export function ensureRole(...allowed) {
  return (req, res, next) => {
    // assumes authRequired already set req.user = { id, email, role }
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
