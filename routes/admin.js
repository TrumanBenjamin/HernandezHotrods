const router = require('express').Router();
const { ensureAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/', ensureAuth, adminController.dashboard);

module.exports = router;