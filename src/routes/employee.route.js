const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authenticate');
const EmployeeController = require('../controller/employee.controller');

router.get('/deleted', EmployeeController.getListDeleted);
router.get('/auth', verifyToken, EmployeeController.getById);
router.get('/', EmployeeController.getList);
router.post('/register', EmployeeController.register);
router.post('/login', EmployeeController.login);
router.post('/token', EmployeeController.createToken);
router.put('/', EmployeeController.update);
router.patch('/:id/restore', EmployeeController.restore);
router.delete('/:id', EmployeeController.delete);

module.exports = router;
