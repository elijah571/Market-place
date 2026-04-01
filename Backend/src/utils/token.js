import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';

const isProd = process.env.NODE_ENV === 'production';
const sameSite = isProd ? 'none' : 'lax';
const secure = isProd;

export const createAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '30m',
  });

export const createRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge:
      (Number(process.env.JWT_ACCESS_MS) ||
        15 * 60 * 1000),
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge:
      (Number(process.env.JWT_REFRESH_MS) ||
        7 * 24 * 60 * 60 * 1000),
  });
};

export const clearAuthCookies = (res) => {
  res.cookie(ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    secure,
    sameSite,
    expires: new Date(0),
  });
  res.cookie(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure,
    sameSite,
    expires: new Date(0),
  });
};

export const getAccessTokenFromRequest = (req) => {
  if (req.cookies?.[ACCESS_COOKIE_NAME]) {
    return req.cookies[ACCESS_COOKIE_NAME];
  }

  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.headers['x-access-token']) {
    return req.headers['x-access-token'];
  }

  return null;
};

export const getRefreshTokenFromRequest = (req) => {
  if (req.cookies?.[REFRESH_COOKIE_NAME]) {
    return req.cookies[REFRESH_COOKIE_NAME];
  }

  if (req.headers['x-refresh-token']) {
    return req.headers['x-refresh-token'];
  }

  return null;
};

export const issueAuthTokens = async (res, user) => {
  const tokenPayload = {
    userId: user._id,
    tokenVersion: Number(user.tokenVersion || 0),
    type: 'access',
  };

  const accessToken = createAccessToken(tokenPayload);
  const refreshToken = createRefreshToken({
    ...tokenPayload,
    type: 'refresh',
  });

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
};
