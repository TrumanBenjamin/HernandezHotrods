const db = require('../db');

exports.aboutPage = (req, res) => {
  res.render('about', { title: 'About Us' });
}; 
