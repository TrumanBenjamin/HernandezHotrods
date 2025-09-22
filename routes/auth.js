const router = require('express').Router();
const passport = require('passport');

router.get('/login', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/admin');         // already logged in → go to dashboard
  }
  res.render('auth/login', { title: 'Admin Login' });
});

router.post('/login', 
  passport.authenticate('local', { failureRedirect: '/auth/login' }),
  (req, res) => res.redirect('/admin')
);

router.post('/logout', (req, res, next) => {
  req.logout(err => err ? next(err) : res.redirect('/'));
});

module.exports = router;
