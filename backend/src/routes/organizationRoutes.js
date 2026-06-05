const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createOrganization,
  getUserOrganizations,
  switchOrganization,
  getActiveOrganization
} = require('../controllers/organizationController');

const router = express.Router();

router.use(authenticate); // All routes require authentication

router.post('/', createOrganization);
router.get('/', getUserOrganizations);
router.post('/switch/:organizationId', switchOrganization);
router.get('/active', getActiveOrganization);

module.exports = router;