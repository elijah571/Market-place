const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[String(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? 2;

const writeLog = (level, message, meta = {}) => {
  if ((LOG_LEVELS[level] ?? 2) > currentLevel) {
    return;
  }

  const normalizedMeta = { ...meta };

  if (Object.hasOwn(normalizedMeta, 'message')) {
    normalizedMeta.errorMessage = normalizedMeta.message;
    delete normalizedMeta.message;
  }

  const payload = {
    ...normalizedMeta,
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
};

export const logger = {
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  info: (message, meta) => writeLog('info', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta),
};
