const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an array of express-validator checks; short-circuits with a 400
// listing every failed field instead of trusting handlers to check manually.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`).join('; ');
    return next(new ApiError(400, `Validation failed - ${messages}`));
  }
  next();
};

module.exports = validate;
