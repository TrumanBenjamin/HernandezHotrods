const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const staticRoutes = require('./routes/staticRoutes');
app.use('/', staticRoutes);

const servicesRoute = require('./routes/servicesRoute');
app.use('/services', servicesRoute);

const contactRoute = require('./routes/contactRoute');
app.use('/contact', contactRoute);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// mount the builds router
const buildsRouter = require('./routes/builds');
app.use('/builds', buildsRouter);

// Routes
const homeRoutes = require('./routes/homeRoutes');
app.use('/', homeRoutes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
