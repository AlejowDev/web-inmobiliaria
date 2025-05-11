function checkRole(requiredRoles) {
  return (req, res, next) => {
    const userRole = req.auth.role; // Asumiendo que el middleware JWT añade esto
    
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Unauthorized: Insufficient permissions' 
      });
    }
    
    next();
  };
}

module.exports = {
  checkRole,
  isAdmin: checkRole(['ADMIN']),
  isAgent: checkRole(['AGENT', 'ADMIN']),
  isUser: checkRole(['USER', 'AGENT', 'ADMIN'])
};