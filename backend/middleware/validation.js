const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  };
};

// Common validation rules
const validationRules = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],

  login: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  planning: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be 1-255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('is_public')
      .optional()
      .isBoolean()
      .withMessage('is_public must be a boolean'),
    body('visibility')
      .optional()
      .isIn(['private', 'public', 'friends'])
      .withMessage('visibility must be private, public or friends')
  ],

  task: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Title must be 1-500 characters'),
    body('time')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time format (HH:MM)'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category must be less than 50 characters'),
    body('date')
      .isISO8601()
      .withMessage('Invalid date format')
  ],

  comment: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be 1-1000 characters')
  ]
};

module.exports = {
  validate,
  validationRules
};
