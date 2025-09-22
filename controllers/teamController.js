exports.index = (req, res) => {
  res.render('team', { title: 'Team', isTeam: true });
};