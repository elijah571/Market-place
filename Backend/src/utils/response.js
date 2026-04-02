export const sendSuccess = (
  res,
  { data = null, message = 'OK', status = 200, meta = {} } = {}
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    meta,
    requestId: res.getHeader('x-request-id') || null,
  });
};
