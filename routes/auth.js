const router = require('express').Router();
const passport = require('passport');
const { maybeSendOwnerLoginAlert } = require("../services/securityAlert"); 

router.get('/login', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  const flashErr = (res.locals.flash?.error && res.locals.flash.error[0]) || null;
  const expiredErr = req.query.expired === '1'
    ? 'Your session expired. Please log in again.'
    : null;

  res.render('auth/login', {
    title: 'Admin Login',
    error: flashErr || expiredErr,
  });
});

router.get('/session-status', (req, res) => {
  res.set('Cache-Control', 'no-store');

  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ authenticated: true });
  }
  console.log("[AUTH] session expired");

  return res.status(401).json({ authenticated: false });
});

router.post("/login",
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "Invalid email or password. Please try again.",
  }),
  (req, res, next) => {
    console.log("[LOGIN] auth success:", req.user.email);

    req.session.userEmail = req.user.email;

    maybeSendOwnerLoginAlert(req, req.user)
      .catch(err => console.error("Owner login alert failed:", err));

    req.session.save((err) => {
      if (err) return next(err);
      res.redirect("/admin");
    });
  }
);

router.post('/logout', (req, res, next) => {
  if (!req.session?.userEmail) {
    return res.redirect('/');
  }

  const email = req.session.userEmail;
  console.log(`[AUTH] ${email} logged out of their session`);

  delete req.session.userEmail;

  req.logout(err => err ? next(err) : res.redirect('/'));
});

module.exports = router;
