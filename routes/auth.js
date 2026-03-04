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

router.post("/login",
  (req, res, next) => {
    console.log("[LOGIN] request received");
    next();
  },

  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "Invalid email or password. Please try again.",
  }),

  (req, res) => {
    console.log("[LOGIN] auth success:", req.user.email);

    maybeSendOwnerLoginAlert(req, req.user)
      .then(() => console.log("[LOGIN] owner alert sent"))
      .catch(err => console.error("[LOGIN] owner alert failed:", err.message));

    console.log("[LOGIN] redirecting to /admin");
    res.redirect("/admin");
  }
);

router.post('/logout', (req, res, next) => {
  req.logout(err => err ? next(err) : res.redirect('/'));
});

module.exports = router;
