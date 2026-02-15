const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET || (isProduction 
  ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })()
  : 'dev-only-secret-key-for-development-only'
);

const tokenBlacklist = new Set();

function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

function blacklistToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      const ttl = expiresAt - now;
      if (ttl > 0) {
        tokenBlacklist.add(token);
        setTimeout(() => tokenBlacklist.delete(token), ttl);
      }
    }
  } catch (e) {
    console.error('Error blacklisting token:', e);
  }
}

function authenticateToken(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
  blacklistToken,
  JWT_SECRET
};
