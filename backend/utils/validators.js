// utils/validators.js
const DOMPurify = require('isomorphic-dompurify');
const { body, param, query, validationResult } = require('express-validator');

// Sanitize HTML content
const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                   'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  });
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Discussion validators
const createDiscussionValidators = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Content must be between 10 and 50000 characters'),
  body('fileUrls')
    .optional()
    .isArray()
    .withMessage('File URLs must be an array'),
  body('fileUrls.*')
    .optional()
    .isURL()
    .withMessage('Invalid file URL'),
  handleValidationErrors
];

const updateDiscussionValidators = [
  param('id').isString().withMessage('Invalid discussion ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Content must be between 10 and 50000 characters'),
  handleValidationErrors
];

// Comment validators
const createCommentValidators = [
  body('discussionId')
    .isString()
    .withMessage('Discussion ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment must be between 1 and 5000 characters'),
  body('parentId')
    .optional()
    .isString()
    .withMessage('Invalid parent comment ID'),
  handleValidationErrors
];

// Pagination validators
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

module.exports = {
  sanitizeHTML,
  createDiscussionValidators,
  updateDiscussionValidators,
  createCommentValidators,
  paginationValidators,
  handleValidationErrors
};