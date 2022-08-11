const express = require('express');
const router = express.Router();

const { verifyToken, verifyPermission } = require('../middleware/authenticate');
const EmployeeController = require('../controller/employee.controller');

router.get('/deleted', verifyToken, verifyPermission(['admin']), EmployeeController.getListDeleted);
router.get('/auth', verifyToken, EmployeeController.auth);
router.get('/:id', verifyToken, verifyPermission(['admin']), EmployeeController.getById);
router.get('/', verifyToken, verifyPermission(['admin', 'staff']), EmployeeController.getList);
router.post('/register', verifyToken, verifyPermission(['admin']), EmployeeController.register);
router.post('/login', EmployeeController.login);
router.post('/token', EmployeeController.createToken);
router.post('/', verifyToken, verifyPermission(['admin', 'staff']), EmployeeController.update);
router.patch('/:id/restore', verifyToken, verifyPermission(['admin']), EmployeeController.restore);
router.delete('/:id', verifyToken, verifyPermission(['admin']), EmployeeController.delete);

module.exports = router;
