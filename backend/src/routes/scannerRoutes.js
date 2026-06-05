const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  scanRepository,
  getSecurityAlerts,
  fixAlert
} = require('../controllers/scannerController');

const router = express.Router();

router.use(authenticate);

router.post('/:organizationId/scan', scanRepository);
router.get('/:organizationId/alerts', getSecurityAlerts);
router.put('/:organizationId/alerts/:alertId/fix', fixAlert);

module.exports = router;