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
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "Invalid email or password. Please try again.",
  }),
  async (req, res, next) => {
    try {
      // ✅ only emails if req.user.role === "owner" AND IP is not whitelisted
      await maybeSendOwnerLoginAlert(req, req.user);
    } catch (err) {
      // don't block login if email fails
      console.error("Owner login alert failed:", err);
    }

    // keep your existing session-save pattern
    req.session.save(() => res.redirect("/admin"));
  }
);

router.post('/logout', (req, res, next) => {
  req.logout(err => err ? next(err) : res.redirect('/'));
});

module.exports = router;
