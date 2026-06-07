const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const secretRoutes = require('./routes/secretRoutes');
const { pool } = require('./config/db');

// Add with other imports
const scannerRoutes = require('./routes/scannerRoutes');




const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());



app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api', secretRoutes);  // Secret routes
app.use('/api/scanner', scannerRoutes);
app.use('/api/ai', aiRoutes);
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({ success: true, time: result.rows[0].time });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`🏢 Orgs: http://localhost:${PORT}/api/organizations`);
  console.log(`🔒 Secrets: http://localhost:${PORT}/api/:organizationId/secrets\n`);
});