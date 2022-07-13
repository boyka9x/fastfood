const jwt = require('jsonwebtoken');

module.exports = {
  verifyToken: (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token not found' });
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.userId = decoded.userId;
      req.userType = decoded.type;

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid access token' });
    }
  },
  verifyPermission: (permission) => {
    return (req, res, next) => {
      if (!permission.includes(req.userType)) {
        return res.status(403).json({ success: false, message: 'You do not have permission!' });
      }

      next();
    };
  },
};
