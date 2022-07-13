const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authenticate');

const CustomerController = require('../controller/customer.controller');

router.post('/register', CustomerController.register);
router.post('/login', CustomerController.login);
router.post('/logout', CustomerController.logout);
router.post('/token', CustomerController.createToken);
router.get('/profile', verifyToken, CustomerController.authCustomer);

module.exports = router;
