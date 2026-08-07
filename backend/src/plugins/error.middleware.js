const ApiError = require('./ApiError');

const errorHandler = (err, req, reply) => {
  let { statusCode, message } = err;

  // Handle unexpected non-ApiError exceptions
  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal Server Error';
  }

  const response = {
    success: false,
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', err);
  }

  reply.status(statusCode).send(response);
};

module.exports = errorHandler;
