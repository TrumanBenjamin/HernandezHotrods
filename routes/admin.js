const router = require('express').Router();
const { ensureAuth, ensureRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/', ensureAuth, adminController.dashboard);

// Instagram token admin UI
router.get('/ig-token', ensureAuth, adminController.showIgTokenSettings);
router.post('/ig-token', ensureAuth, adminController.updateIgToken);

router.get('/users/new', ensureRole('owner'), adminController.newUserForm);
router.post('/users/new', ensureRole('owner'), adminController.createUser);

router.get('/users/:id/reset-password', ensureRole('owner'), adminController.resetPasswordForm);
router.post('/users/:id/reset-password', ensureRole('owner'), adminController.resetPassword);

module.exports = router;