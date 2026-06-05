const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createSecret,
  getSecrets,
  getSecret,
  deleteSecret
} = require('../controllers/secretController');

const router = express.Router();

router.use(authenticate);

router.post('/:organizationId/secrets', createSecret);
router.get('/:organizationId/secrets', getSecrets);
router.get('/:organizationId/secrets/:secretId', getSecret);
router.delete('/:organizationId/secrets/:secretId', deleteSecret);

module.exports = router;