const { pool } = require('../config/db');
const { askSecurityAssistant, analyzeSecret, getRemediationAdvice } = require('../services/aiService');

// Chat with AI Security Assistant
const chat = async (req, res) => {
  const { message, context = {} } = req.body;
  const userId = req.user.userId;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Get user's organization context
    const member = await pool.query(
      `SELECT o.name as org_name, m.role 
       FROM members m 
       JOIN organizations o ON o.id = m.organization_id 
       WHERE m.user_id = $1 
       LIMIT 1`,
      [userId]
    );
    
    const orgContext = {
      organizationName: member.rows[0]?.org_name || 'Unknown',
      userRole: member.rows[0]?.role || 'User',
      ...context
    };
    
    const response = await askSecurityAssistant(message, orgContext);
    
    // Log the interaction
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'AI_CHAT', 'ai_assistant', JSON.stringify({ question: message.substring(0, 100) })]
    );
    
    res.json(response);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process request',
      answer: "I'm experiencing technical difficulties. Please try again."
    });
  }
};

// Analyze a secret
const analyzeSecretHandler = async (req, res) => {
  const { secretName, secretValue } = req.body;
  const userId = req.user.userId;
  
  if (!secretName || !secretValue) {
    return res.status(400).json({ error: 'Secret name and value required' });
  }
  
  try {
    const analysis = await analyzeSecret(secretName, secretValue);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get remediation advice for an alert
const getRemediation = async (req, res) => {
  const { alertId } = req.params;
  const userId = req.user.userId;
  
  try {
    // Get alert details from database
    const alert = await pool.query(
      `SELECT alert_type, description FROM security_alerts WHERE id = $1`,
      [alertId]
    );
    
    if (alert.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const advice = await getRemediationAdvice(
      alert.rows[0].alert_type,
      alert.rows[0].description
    );
    
    res.json(advice);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { chat, analyzeSecretHandler, getRemediation };