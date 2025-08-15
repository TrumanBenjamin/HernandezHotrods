const express = require('express');
const router = express.Router();

// Sample static services (later can be from database)
const services = [
  { name: 'Custom Fabrication', description: 'Bespoke metal work and fabrication for your hot rod.' },
  { name: 'Engine Swaps', description: 'LS swaps, big blocks, and more — done right.' },
  { name: 'Suspension Work', description: 'Lowering, air ride setups, and full suspension rebuilds.' }
];

router.get('/', (req, res) => {
  res.render('services/list', { title: 'Our Services', services });
});

module.exports = router;
