const jwt = require('jsonwebtoken');

jest.mock('../server/models/database', () => ({
  user: {
    findById: jest.fn()
  }
}), { virtual: true });

const { authenticateToken, requireAdmin, generateToken, JWT_SECRET } = require('../server/middleware/auth');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token provided', () => {
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      mockReq.cookies.token = 'invalid-token';
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should return 403 if token is expired', () => {
      const expiredToken = jwt.sign(
        { id: 'test-user', email: 'test@test.com', name: 'Test', role: 'user' },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );
      mockReq.cookies.token = expiredToken;
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should call next() and set req.user for valid token', () => {
      const userPayload = { id: 'test-user', email: 'test@test.com', name: 'Test', role: 'user' };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
      mockReq.cookies.token = token;
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toMatchObject(userPayload);
    });

    it('should accept token from Authorization header', () => {
      const userPayload = { id: 'test-user', email: 'test@test.com', name: 'Test', role: 'user' };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
      mockReq.headers.authorization = `Bearer ${token}`;
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toMatchObject(userPayload);
    });
  });

  describe('requireAdmin', () => {
    it('should return 403 if user is not admin', () => {
      mockReq.user = { id: 'test-user', role: 'user' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if user is admin', () => {
      mockReq.user = { id: 'test-user', role: 'admin' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user = { id: 'test-user', email: 'test@test.com', name: 'Test', role: 'user' };
      const token = generateToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe('test-user');
      expect(decoded.email).toBe('test@test.com');
    });

    it('should set token expiration to 7 days', () => {
      const user = { id: 'test-user', email: 'test@test.com', name: 'Test', role: 'user' };
      const token = generateToken(user);
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
    });
  });
});
