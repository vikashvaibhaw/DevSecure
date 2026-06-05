const { pool } = require('../config/db');
const { encrypt, decrypt } = require('../utils/encryption');

// Create a new secret
const createSecret = async (req, res) => {
  const { key_name, plain_value, organizationId } = req.body;
  const userId = req.user.userId;
  
  // Use organization from params or body
  const orgId = organizationId || req.params.organizationId;
  
  if (!key_name || !plain_value) {
    return res.status(400).json({ error: 'Key name and value required' });
  }
  
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID required' });
  }
  
  try {
    // Check if user has permission (admin or developer can create)
    const member = await pool.query(
      `SELECT role FROM members WHERE user_id = $1 AND organization_id = $2`,
      [userId, orgId]
    );
    
    if (!member.rows.length) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    if (member.rows[0].role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot create secrets' });
    }
    
    // Encrypt the secret
    const encrypted_value = encrypt(plain_value);
    
    // Store in database
    const result = await pool.query(
      `INSERT INTO secrets (organization_id, key_name, encrypted_value, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, key_name, created_at`,
      [orgId, key_name, encrypted_value, userId]
    );
    
    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'CREATE_SECRET', 'secret', result.rows[0].id, JSON.stringify({ key_name, organizationId: orgId })]
    );
    
    res.status(201).json({ 
      success: true, 
      secret: result.rows[0],
      message: 'Secret created successfully'
    });
  } catch (err) {
    console.error('Create secret error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all secrets for an organization
const getSecrets = async (req, res) => {
  const { organizationId } = req.params;
  const userId = req.user.userId;
  
  try {
    // Check if user is member
    const member = await pool.query(
      `SELECT role FROM members WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (!member.rows.length) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    // Get secrets (without decrypted values for listing)
    const result = await pool.query(
      `SELECT id, key_name, created_by, created_at 
       FROM secrets 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [organizationId]
    );
    
    res.json({ success: true, secrets: result.rows });
  } catch (err) {
    console.error('Get secrets error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single secret (with decrypted value)
const getSecret = async (req, res) => {
  const { secretId, organizationId } = req.params;
  const userId = req.user.userId;
  
  try {
    // Check if user is member
    const member = await pool.query(
      `SELECT role FROM members WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (!member.rows.length) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    // Get secret
    const result = await pool.query(
      `SELECT id, key_name, encrypted_value, created_by, created_at 
       FROM secrets 
       WHERE id = $1 AND organization_id = $2`,
      [secretId, organizationId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Secret not found' });
    }
    
    const secret = result.rows[0];
    
    // Decrypt the value (only if user is admin or developer)
    let decrypted_value = null;
    if (member.rows[0].role !== 'viewer') {
      decrypted_value = decrypt(secret.encrypted_value);
    }
    
    // Create audit log for access
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'VIEW_SECRET', 'secret', secretId, JSON.stringify({ key_name: secret.key_name })]
    );
    
    res.json({ 
      success: true, 
      secret: {
        id: secret.id,
        key_name: secret.key_name,
        value: decrypted_value,
        created_by: secret.created_by,
        created_at: secret.created_at
      }
    });
  } catch (err) {
    console.error('Get secret error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a secret
const deleteSecret = async (req, res) => {
  const { secretId, organizationId } = req.params;
  const userId = req.user.userId;
  
  try {
    // Check if user is admin (only admins can delete)
    const member = await pool.query(
      `SELECT role FROM members WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (!member.rows.length) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    if (member.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete secrets' });
    }
    
    // Get secret info before deleting for audit log
    const secret = await pool.query(
      `SELECT key_name FROM secrets WHERE id = $1 AND organization_id = $2`,
      [secretId, organizationId]
    );
    
    if (secret.rows.length === 0) {
      return res.status(404).json({ error: 'Secret not found' });
    }
    
    // Delete secret
    await pool.query(
      `DELETE FROM secrets WHERE id = $1 AND organization_id = $2`,
      [secretId, organizationId]
    );
    
    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'DELETE_SECRET', 'secret', secretId, JSON.stringify({ key_name: secret.rows[0].key_name })]
    );
    
    res.json({ success: true, message: 'Secret deleted successfully' });
  } catch (err) {
    console.error('Delete secret error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createSecret, getSecrets, getSecret, deleteSecret };