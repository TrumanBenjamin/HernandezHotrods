const router = require('express').Router();
const passport = require('passport');
const { maybeSendOwnerLoginAlert } = require("../services/securityAlert"); 

router.get('/login', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  const err = (res.locals.flash?.error && res.locals.flash.error[0]) || null;

  res.render('auth/login', {
    title: 'Admin Login',
    error: err,
  });
});

router.post(
  "/login",
  (req, res, next) => {
    console.log("[LOGIN] hit /auth/login");
    next();
  },
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "Invalid email or password. Please try again.",
  }),
  async (req, res, next) => {
    console.log("[LOGIN] passport success; user:", req.user?.email || req.user?.id);
    console.log("[LOGIN] req.secure:", req.secure, "x-forwarded-proto:", req.get("x-forwarded-proto"));
    console.log("[LOGIN] sessionID:", req.sessionID);

    // This tells us if session store save is the hang
    const t0 = Date.now();
    console.log("[LOGIN] about to req.session.save()");

    req.session.save((err) => {
      console.log("[LOGIN] session.save callback after", Date.now() - t0, "ms", "err=", err);
      console.log("[LOGIN] redirecting now");
      return res.redirect("/admin");
    });
  }
);

router.post('/logout', (req, res, next) => {
  req.logout(err => err ? next(err) : res.redirect('/'));
});

module.exports = router;
