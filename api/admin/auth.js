const crypto = require('crypto');

// Server-side secret key from Vercel environment variables, with fallback
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'r7esports';
const ADMIN_FIREBASE_PASSWORD = process.env.ADMIN_FIREBASE_PASSWORD || '12345678';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'r7esports@gmail.com';
const SESSION_SALT = process.env.ADMIN_SESSION_SALT || 'r7-esports-admin-salt-2026';

function generateSessionToken() {
  const dayStamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return crypto.createHmac('sha256', SESSION_SALT)
    .update(`r7-admin-session:${dayStamp}`)
    .digest('hex');
}

function verifySessionToken(token) {
  if (!token) return false;
  const currentToken = generateSessionToken();
  const prevDayStamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) - 1;
  const prevToken = crypto.createHmac('sha256', SESSION_SALT)
    .update(`r7-admin-session:${prevDayStamp}`)
    .digest('hex');
  return token === currentToken || token === prevToken;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, secretKey, token } = req.body || {};

    // 1. Verify existing session token
    if (action === 'verify_token') {
      const isValid = verifySessionToken(token);
      return res.status(200).json({ valid: isValid });
    }

    // 2. Validate passcode secret key
    if (!secretKey) {
      return res.status(400).json({ error: 'Admin passcode key is required' });
    }

    const trimmedInput = String(secretKey).trim();
    const expectedKey = String(ADMIN_SECRET_KEY).trim();

    // Secure timing-safe check
    const bufA = Buffer.from(trimmedInput);
    const bufB = Buffer.from(expectedKey);
    const isMatch = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin passcode key' });
    }

    // Passcode validated successfully
    const sessionToken = generateSessionToken();

    return res.status(200).json({
      success: true,
      message: 'Admin authorization successful',
      sessionToken,
      email: ADMIN_EMAIL,
      // Provide auth credential securely to client only after server validation
      authPayload: Buffer.from(ADMIN_FIREBASE_PASSWORD).toString('base64')
    });
  } catch (err) {
    console.error('Admin Auth Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
