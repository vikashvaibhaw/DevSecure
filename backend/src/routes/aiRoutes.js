const express = require('express');
const { authenticate } = require('../middleware/auth');
const { chat, analyzeSecretHandler, getRemediation } = require('../controllers/aiController');

const router = express.Router();

router.use(authenticate);

router.post('/chat', chat);
router.post('/analyze-secret', analyzeSecretHandler);
router.get('/remediation/:alertId', getRemediation);

module.exports = router;