import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ message: "Invalid Authorization format" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload should contain at least { id, role || role_id }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Optional auth: Try to authenticate, but allow request through if no token
export const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    req.user = null; // No user, but allow through
    return next();
  }
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    req.user = null;
    return next();
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    req.user = null; // Invalid token, but allow through
    next();
  }
};

// role hierarchy: customer < staff < manager < admin
const ROLE_LEVEL = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

// requireRole accepts one or more allowed roles and permits access if user's role level
// is >= the minimum allowed role level. It supports passing role names like 'staff', 'manager', 'admin'.
export const requireRole = (...allowedRoles) => {
  // compute minimum required level
  const levels = allowedRoles
    .map((r) => String(r || "").toLowerCase())
    .map((name) =>
      typeof ROLE_LEVEL[name] === "number" ? ROLE_LEVEL[name] : -1
    );
  const minLevel = levels.length ? Math.min(...levels) : 0;

  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    // user.role can be name or role_id; prefer name
    const userRoleName = (user.role || user.role_name || user.role_type || "")
      .toString()
      .toLowerCase();
    const userLevel =
      typeof ROLE_LEVEL[userRoleName] === "number"
        ? ROLE_LEVEL[userRoleName]
        : -1;
    if (userLevel >= minLevel) return next();
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  };
};

/*
  Notes:
  - The JWT payload set by your login controller should include either `role` (string) or
    `role_name` so the middleware can determine permission level. Example payload:
      { id: 12, email: 'a@b.com', role: 'manager' }

  - For quick testing you can generate tokens using Node REPL or a small script:
      import jwt from 'jsonwebtoken';
      const token = jwt.sign({ id:1, email:'a@b', role: 'admin' }, process.env.JWT_SECRET || 'dev-secret');

  - The role hierarchy is: customer < staff < manager < admin.
*/
