const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validation = require('../util/validation');

const Customer = require('../models/customer.model');

const CustomerController = {
  // [GET] /api/customers
  authCustomer: async (req, res) => {
    try {
      const user = await Customer.findOne({ _id: req.userId }).select('-password -refreshToken');
      if (!user) return res.status(400).json({ status: 'error', message: 'User not found' });
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  },

  // [POST] /api/customers/register
  register: async (req, res) => {
    const { username, password, confirmPassword, phoneNumber, address } = req.body;
    const type = 'customer';

    // Simple validation
    if (!username || !password || !address) {
      return res.status(400).json({ success: false, message: 'Invalid username or password' });
    }

    // Regex phone number
    if (!validation.isVietnamesePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Match password
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: `Don't match password` });
    }

    try {
      // Check existed user
      let user = Customer.findOneWithDeleted({ phoneNumber });
      if (user.phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is used' });
      }

      // All good
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newCustomer = new Customer({
        username,
        phoneNumber,
        password: hashedPassword,
        address,
        type,
      });
      await newCustomer.save();

      res.json({
        status: 'success',
        message: 'User saved successfully',
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/customers/login
  login: async (req, res) => {
    const { phoneNumber, password } = req.body;

    // Simple validation
    if (!password || !validation.isVietnamesePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid password or phone number' });
    }

    try {
      // Get user in database
      const user = await Customer.findOne({ phoneNumber });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Incorrect username or password' });
      }

      // Compare hash password with user password to see if they are valid
      const isWatch = await bcrypt.compare(password, user.password);
      if (!isWatch) {
        return res.status(400).json({ success: false, message: 'Incorrect username or password' });
      }

      // All good
      // Send JWT access token
      const accessToken = await jwt.sign(
        { userId: user._id, type: user.type },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_LIFE,
        }
      );

      // Refresh token
      const refreshToken = await jwt.sign(
        { userId: user._id, type: user.type },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: process.env.REFRESH_TOKEN_LIFE,
        }
      );

      // Save refresh token in database
      await Customer.findOneAndUpdate({ _id: user._id }, { refreshToken });

      res.json({
        status: 'success',
        message: 'Login successfully',
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({ success: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/customers/token
  // @desc Create a new token
  createToken: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ status: 'error', message: 'Invalid refresh token' });
    }

    try {
      // Match refresh token in database
      const { userId } = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await Customer.findOne({ _id: userId });
      if (user.refreshToken !== refreshToken) {
        return res.status(400).json({ status: 'error', message: 'Mismatch refresh token' });
      }

      // Create new access token
      const accessToken = await jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
      });

      res.json({ status: 'success', data: accessToken });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/customers/logout
  // @desc Delete refresh token in database
  logout: async (req, res) => {
    const { refreshToken } = req.body;

    try {
      // Remove refreshToken in database
      const { userId } = jwt.decode(refreshToken);
      await Customer.findOneAndUpdate({ _id: userId }, { refreshToken: '' });

      res.status(200).json({ status: 'success', message: 'Logout successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};

module.exports = CustomerController;
