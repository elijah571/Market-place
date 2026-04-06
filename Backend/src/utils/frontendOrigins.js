const splitConfiguredOrigins = (value = '') =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const stripTrailingSlash = (value = '') => String(value || '').replace(/\/$/, '');

const toNormalizedOrigin = (value = '') => {
  const normalizedValue = stripTrailingSlash(value).trim();

  if (!normalizedValue || normalizedValue.includes('*')) {
    return normalizedValue;
  }

  try {
    const url = new URL(normalizedValue);
    return stripTrailingSlash(url.origin);
  } catch {
    return normalizedValue;
  }
};

const escapeRegex = (value = '') =>
  value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');

const matchesOriginPattern = (origin, configuredOrigin) => {
  const normalizedOrigin = toNormalizedOrigin(origin);
  const normalizedConfiguredOrigin = toNormalizedOrigin(configuredOrigin);

  if (!normalizedOrigin || !normalizedConfiguredOrigin) {
    return false;
  }

  if (!normalizedConfiguredOrigin.includes('*')) {
    return normalizedOrigin === normalizedConfiguredOrigin;
  }

  const pattern = new RegExp(
    `^${escapeRegex(normalizedConfiguredOrigin).replace(/\*/g, '[^.\\/]+')}$`
  );

  return pattern.test(normalizedOrigin);
};

export const getConfiguredFrontendOrigins = () =>
  splitConfiguredOrigins(process.env.FRONTEND_URL);

export const isAllowedFrontendOrigin = (
  origin,
  allowedOrigins = getConfiguredFrontendOrigins()
) => {
  const configuredOrigins = Array.isArray(allowedOrigins) ? allowedOrigins : [];

  if (!origin || configuredOrigins.length === 0) {
    return true;
  }

  return configuredOrigins.some((configuredOrigin) =>
    matchesOriginPattern(origin, configuredOrigin)
  );
};

export const doesRequestMatchAllowedFrontendOrigin = ({
  origin = '',
  referer = '',
  allowedOrigins = getConfiguredFrontendOrigins(),
} = {}) => {
  if (isAllowedFrontendOrigin(origin, allowedOrigins)) {
    return true;
  }

  if (!referer) {
    return false;
  }

  try {
    const refererOrigin = new URL(referer).origin;
    return isAllowedFrontendOrigin(refererOrigin, allowedOrigins);
  } catch {
    return false;
  }
};

export const getPrimaryFrontendOrigin = () =>
  getConfiguredFrontendOrigins().find(
    (configuredOrigin) =>
      Boolean(toNormalizedOrigin(configuredOrigin)) &&
      !toNormalizedOrigin(configuredOrigin).includes('*')
  ) || '';
