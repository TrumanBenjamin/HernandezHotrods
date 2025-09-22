const express = require('express');
const router = express.Router();
const forSaleController = require('../controllers/forSaleController');

// GET /for-sale
router.get('/', forSaleController.index);

module.exports = router;
