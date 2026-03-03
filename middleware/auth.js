exports.ensureAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};

exports.ensureRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).send('Forbidden');
    }

    next();
  };
};