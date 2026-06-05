const { pool } = require('../config/db');
const { scanGitHubRepo, parseGitHubUrl } = require('../services/githubScanner');

// Scan a repository
const scanRepository = async (req, res) => {
  const { repoUrl, branch = 'main' } = req.body;
  const { organizationId } = req.params;
  const userId = req.user.userId;
  
  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL required' });
  }
  
  try {
    const member = await pool.query(
      `SELECT role FROM members WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (!member.rows.length || member.rows[0].role === 'viewer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { owner, repo } = parseGitHubUrl(repoUrl);
    
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }
    
    // Send immediate response
    res.json({ 
      success: true, 
      message: `Scanning ${owner}/${repo} started...`,
      status: 'scanning'
    });
    
    // Perform scan asynchronously
    const result = await scanGitHubRepo(owner, repo, branch, organizationId, userId);
    
    console.log(`Scan completed: ${result.findings_count} findings`);
    
  } catch (error) {
    console.error('Scan error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};

// Get security alerts
const getSecurityAlerts = async (req, res) => {
  const { organizationId } = req.params;
  const userId = req.user.userId;
  
  try {
    const member = await pool.query(
      `SELECT role FROM members WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (!member.rows.length) {
      return res.status(403).json({ error: 'Not a member' });
    }
    
    const alerts = await pool.query(
      `SELECT * FROM security_alerts 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [organizationId]
    );
    
    res.json({ success: true, alerts: alerts.rows });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark alert as fixed
const fixAlert = async (req, res) => {
  const { organizationId, alertId } = req.params;
  const userId = req.user.userId;
  
  try {
    const member = await pool.query(
      `SELECT role FROM members WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (!member.rows.length || member.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can fix alerts' });
    }
    
    await pool.query(
      `UPDATE security_alerts SET fixed = true WHERE id = $1 AND organization_id = $2`,
      [alertId, organizationId]
    );
    
    res.json({ success: true, message: 'Alert marked as fixed' });
  } catch (error) {
    console.error('Fix alert error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { scanRepository, getSecurityAlerts, fixAlert };