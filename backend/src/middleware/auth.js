import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'Server misconfigured: missing JWT_SECRET' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.auth = { userId: payload.userId };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
