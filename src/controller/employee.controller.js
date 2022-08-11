const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Employee = require('../models/employee.model');
const validation = require('../util/validation');

const EmployeeController = {
  // [GET] /api/employees
  getList: async (req, res) => {
    let page = parseInt(req.query._page) || 1;
    let limit = parseInt(req.query._limit) || 5;
    let searchOptions = {};

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;
    if (req.query.name_like) {
      searchOptions.$text = { $search: req.query.name_like };
    }

    try {
      const employees = await Employee.find(searchOptions)
        .select('-password -refreshToken')
        .skip((page - 1) * limit)
        .limit(limit);
      const count = await Employee.countDocuments(searchOptions);

      res.json({
        status: 'success',
        data: employees,
        pagination: { _page: page, _limit: limit, _totalRecords: count },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [GET] /api/employees/deleted
  getListDeleted: async (req, res) => {
    let page = parseInt(req.query._page) || 1;
    let limit = parseInt(req.query._limit) || 5;
    let searchOptions = {};

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;
    if (req.query.name_like) {
      searchOptions.$text = { $search: req.query.name_like };
    }

    try {
      const employees = await Employee.findDeleted(searchOptions)
        .select('-password -refreshToken')
        .skip((page - 1) * limit)
        .limit(limit);
      const count = await Employee.countDocumentsDeleted(searchOptions);

      res.json({
        status: 'success',
        data: employees,
        pagination: { _page: page, _limit: limit, _totalRecords: count },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [GET] /api/employees/auth
  auth: async (req, res) => {
    try {
      const employee = await Employee.findOne({ _id: req.userId }).select(
        '-password -refreshToken'
      );

      if (!employee) {
        return res.status(400).json({ status: 'error', message: 'Employee not found' });
      }

      res.json({ status: 'success', data: employee });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [GET] /api/employees/:id
  getById: async (req, res) => {
    try {
      const employee = await Employee.findOne({ _id: req.params.id }).select(
        '-password -refreshToken'
      );

      if (!employee) {
        return res.status(400).json({ status: 'error', message: 'Employee not found' });
      }

      res.json({ status: 'success', data: employee });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/employees/register
  register: async (req, res) => {
    const { username, password, passwordConfirm, email, phoneNumber, image, address, type } =
      req.body;

    // Simple validation
    if (!username || !password || !email || !address) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Invalid username or password or information' });
    }

    // Check regex phone number
    if (!validation.isVietnamesePhoneNumber(phoneNumber)) {
      return res.status(400).json({ status: 'error', message: 'Invalid phone number' });
    }

    // Match password
    if (password !== passwordConfirm) {
      return res.status(400).json({ status: 'error', message: 'Password not match' });
    }

    try {
      // Check if email used
      const employee = await Employee.findOne({ email });
      if (employee) {
        return res.status(400).json({ status: 'error', message: 'Email already used' });
      }

      // All good
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const newUser = new Employee({
        username,
        email,
        phoneNumber,
        password: hashPassword,
        image,
        address,
        type: type || 'staff',
      });

      await newUser.save();

      res.json({ status: 'success', message: 'User saved successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/employees/login
  // @param email and password
  login: async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
    }

    try {
      const employee = await Employee.findOne({ email });
      if (!employee) {
        return res.status(400).json({ status: 'error', message: 'Incorrect email or password' });
      }

      // Compare password
      const isWatch = await bcrypt.compare(password, employee.password);
      if (!isWatch) {
        return res.status(400).json({ status: 'error', message: 'Incorrect username or password' });
      }

      // Access token
      const accessToken = await jwt.sign(
        { userId: employee._id, type: employee.type },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_LIFE,
        }
      );

      // Refresh token
      const refreshToken = await jwt.sign(
        { userId: employee._id, type: employee.type },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_LIFE }
      );

      // Save refresh token in database
      await Employee.findOneAndUpdate({ _id: employee._id }, { refreshToken });

      res.json({
        status: 'success',
        message: 'User login successfully',
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/employees
  update: async (req, res) => {
    const { username, email, phoneNumber, image, address, type, _id } = req.body;

    // Simple validation
    if (!username || !email || !phoneNumber || !address) {
      return res.status(400).json({ status: 'error', message: 'Invalid information' });
    }

    let filterOptions = {
      _id: req.userType === 'admin' ? _id : req.userId,
    };

    try {
      let updatedEmployee = {
        username,
        email,
        phoneNumber,
        image: image || '',
        address,
        type,
      };
      updatedEmployee = await Employee.findOneAndUpdate(filterOptions, updatedEmployee, {
        new: true,
      });

      if (!updatedEmployee) {
        return res.status(400).json({ status: 'error', message: 'Employee not found' });
      }

      res.json({ status: 'success', message: 'Employee updated successfully' });
    } catch (error) {
      res.status(500).json({ success: 'error', message: 'Internal server error' });
    }
  },

  // [DELETE] /api/employees/:id
  delete: async (req, res) => {
    try {
      const deletedEmployee = await Employee.delete({ _id: req.params.id });

      if (!deletedEmployee) {
        return res.status(400).json({ status: 'error', message: 'Employee not found' });
      }

      res.json({ status: 'success', message: 'Employee deleted successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [PATCH] /api/employees/:id/restore
  restore: async (req, res) => {
    try {
      const restoredEmployee = await Employee.restore({ _id: req.params.id });

      if (!restoredEmployee) {
        return res.status(404).json({ status: 'error', message: 'Employee not found' });
      }

      res.json({ status: 'success', message: 'Employee restored' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/employees/token
  createToken: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(404).json({ status: 'error', message: 'Invalid refresh token' });
    }

    try {
      const { userId } = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const employee = await Employee.findOne({ _id: userId });

      if (employee.refreshToken !== refreshToken) {
        return res.status(400).json({ status: 'error', message: 'Mismatch refresh token' });
      }

      // Create new access token for employee
      const accessToken = await jwt.sign(
        { userId: employee._id, type: employee.type },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_LIFE,
        }
      );

      res.json({ status: 'success', data: accessToken });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};

module.exports = EmployeeController;
