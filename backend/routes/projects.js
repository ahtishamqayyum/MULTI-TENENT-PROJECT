const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenant');

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authenticateToken);
router.use(enforceTenantIsolation);

// Get all projects for the user's tenant
router.get('/', async (req, res) => {
  try {
    // Ensure tenant_id is present - use req.tenantId from middleware
    const tenantId = req.tenantId || req.user?.tenant_id;
    
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant information not available' });
    }
    
    // Security: Verify user's tenant_id matches the one we're querying
    if (req.user.tenant_id !== tenantId) {
      console.error(`Security violation: User ${req.user.id} tried to access tenant ${tenantId} but belongs to tenant ${req.user.tenant_id}`);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    // Admin sees all projects in their tenant, regular users see only their own projects
    let query, params;
    if (isAdmin) {
      // Admin: Show all projects from their tenant
      query = `SELECT p.id, p.name, p.description, p.created_at, p.updated_at, 
               u.name as created_by_name, u.email as created_by_email
               FROM projects p 
               JOIN users u ON p.created_by = u.id 
               WHERE p.tenant_id = $1
               ORDER BY p.created_at DESC`;
      params = [tenantId];
    } else {
      // Regular user: Show only their own projects
      query = `SELECT p.id, p.name, p.description, p.created_at, p.updated_at, 
               u.name as created_by_name 
               FROM projects p 
               JOIN users u ON p.created_by = u.id 
               WHERE p.tenant_id = $1 AND p.created_by = $2
               ORDER BY p.created_at DESC`;
      params = [tenantId, req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenant_id;
    
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant information not available' });
    }

    // Security: Verify user's tenant_id matches
    if (req.user.tenant_id !== tenantId) {
      console.error(`Security violation: User ${req.user.id} tried to access project ${id} from tenant ${tenantId} but belongs to tenant ${req.user.tenant_id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    // Admin can see any project in their tenant, regular users can only see their own projects
    let query, params;
    if (isAdmin) {
      query = `SELECT p.id, p.name, p.description, p.created_at, p.updated_at, 
               u.name as created_by_name, u.email as created_by_email 
               FROM projects p 
               JOIN users u ON p.created_by = u.id 
               WHERE p.id = $1 AND p.tenant_id = $2`;
      params = [id, tenantId];
    } else {
      query = `SELECT p.id, p.name, p.description, p.created_at, p.updated_at, 
               u.name as created_by_name, u.email as created_by_email 
               FROM projects p 
               JOIN users u ON p.created_by = u.id 
               WHERE p.id = $1 AND p.tenant_id = $2 AND p.created_by = $3`;
      params = [id, tenantId, req.user.id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const tenantId = req.tenantId || req.user?.tenant_id;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant information not available' });
    }

    // Security: Ensure project is created in user's own tenant only
    if (req.user.tenant_id !== tenantId) {
      console.error(`Security violation: User ${req.user.id} tried to create project in tenant ${tenantId} but belongs to tenant ${req.user.tenant_id}`);
      return res.status(403).json({ error: 'Cannot create project in different tenant' });
    }

    // Create project - ALWAYS use user's tenant_id, never allow override
    const result = await pool.query(
      `INSERT INTO projects (name, description, tenant_id, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, description, tenant_id, created_by, created_at, updated_at`,
      [name, description || '', req.user.tenant_id, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const tenantId = req.tenantId || req.user?.tenant_id;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant information not available' });
    }

    // Security: Verify user's tenant_id matches
    if (req.user.tenant_id !== tenantId) {
      console.error(`Security violation: User ${req.user.id} tried to update project ${id} from tenant ${tenantId} but belongs to tenant ${req.user.tenant_id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // First check if project exists and belongs to user's tenant
    const checkResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 AND tenant_id = $4 
       RETURNING id, name, description, tenant_id, created_by, created_at, updated_at`,
      [name, description || '', id, tenantId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tenantId = req.tenantId || req.user?.tenant_id;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant information not available' });
    }

    // Security: Verify user's tenant_id matches
    if (req.user.tenant_id !== tenantId) {
      console.error(`Security violation: User ${req.user.id} tried to delete project ${id} from tenant ${tenantId} but belongs to tenant ${req.user.tenant_id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if project exists and belongs to user's tenant
    const checkResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await pool.query(
      'DELETE FROM projects WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

