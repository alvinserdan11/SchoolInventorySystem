// ============================================
// ROLE MIDDLEWARE - Role-based access control
// ============================================

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
        }

        const userRole = req.user.user_type || req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
        }

        next();
    };
}

module.exports = { requireRole };