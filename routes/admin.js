const router = require('express').Router();
const { ensureAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/', ensureAuth, adminController.dashboard);

// Instagram token admin UI
router.get('/ig-token', ensureAuth, adminController.showIgTokenSettings);
router.post('/ig-token', ensureAuth, adminController.updateIgToken);

module.exports = router;