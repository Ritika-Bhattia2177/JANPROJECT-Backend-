const jwt = require('jsonwebtoken');

// Generate JWT token with userId and role in payload
const generateToken = (userId, role) => {
  return jwt.sign(
    { 
      id: userId,
      role: role 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '1d'
    }
  );
};

// Generate token and send response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token with userId and role
  const token = generateToken(user._id, user.role);

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' // Prevent CSRF attacks
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
};

module.exports = { generateToken, sendTokenResponse };
