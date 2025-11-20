// Middleware to ensure user can only access their own tenant's data
const enforceTenantIsolation = (req, res, next) => {
  // This middleware assumes authenticateToken has already run
  // and req.user.tenant_id is available
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  if (!req.user.tenant_id) {
    return res.status(403).json({ error: 'Tenant information not available' });
  }
  
  // Store tenant_id in a way that can't be overridden
  req.tenantId = req.user.tenant_id;
  
  next();
};

module.exports = { enforceTenantIsolation };

