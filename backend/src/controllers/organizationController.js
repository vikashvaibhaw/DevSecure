const { pool } = require('../config/db');

// Store active organizations in memory
const activeOrganizations = new Map();

// Create organization
const createOrganization = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: 'Organization name required' });
  }

  try {
    await pool.query('BEGIN');
    
    const orgResult = await pool.query(
      `INSERT INTO organizations (name, created_by) 
       VALUES ($1, $2) 
       RETURNING id, name, created_at`,
      [name, userId]
    );
    
    await pool.query(
      `INSERT INTO members (user_id, organization_id, role) 
       VALUES ($1, $2, $3)`,
      [userId, orgResult.rows[0].id, 'admin']
    );
    
    await pool.query('COMMIT');
    
    res.status(201).json({ success: true, organization: orgResult.rows[0] });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Create organization error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's organizations
const getUserOrganizations = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT o.id, o.name, o.created_at, m.role
       FROM organizations o
       JOIN members m ON m.organization_id = o.id
       WHERE m.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    res.json({ success: true, organizations: result.rows });
  } catch (err) {
    console.error('Get organizations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Switch organization
const switchOrganization = async (req, res) => {
  const { organizationId } = req.params;
  const userId = req.user.userId;

  try {
    const member = await pool.query(
      `SELECT role FROM members 
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (member.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    activeOrganizations.set(userId, organizationId);
    
    res.json({ 
      success: true, 
      organizationId,
      role: member.rows[0].role
    });
  } catch (err) {
    console.error('Switch organization error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get active organization
const getActiveOrganization = async (req, res) => {
  const userId = req.user.userId;
  const organizationId = activeOrganizations.get(userId);

  if (!organizationId) {
    return res.json({ success: true, organization: null });
  }

  try {
    const result = await pool.query(
      `SELECT o.id, o.name, m.role 
       FROM organizations o
       JOIN members m ON m.organization_id = o.id
       WHERE o.id = $1 AND m.user_id = $2`,
      [organizationId, userId]
    );
    
    res.json({ success: true, organization: result.rows[0] || null });
  } catch (err) {
    console.error('Get active organization error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  switchOrganization,
  getActiveOrganization
};