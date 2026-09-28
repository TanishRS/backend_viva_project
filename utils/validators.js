const { body, param } = require('express-validator');
const { ROLES, NEED_CATEGORY, URGENCY, DONATION_TYPE, ALERT_SEVERITY } = require('../config/constants');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role'),
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const volunteerValidator = [
  body('skills').optional().isArray().withMessage('skills must be an array of strings'),
  body('availability')
    .optional()
    .isIn(['immediate', 'today', 'tomorrow', 'this_week', 'unavailable']),
];

const needValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category').isIn(Object.values(NEED_CATEGORY)).withMessage('Invalid category'),
  body('urgency').optional().isIn(Object.values(URGENCY)),
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('location.coordinates must be [lng, lat]'),
];

const donationValidator = [
  body('type').isIn(Object.values(DONATION_TYPE)).withMessage('Invalid donation type'),
  body('amount')
    .if(body('type').equals('funds'))
    .isFloat({ gt: 0 })
    .withMessage('amount must be greater than 0 for fund donations'),
];

const reliefCampValidator = [
  body('name').trim().notEmpty().withMessage('Camp name is required'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('location.coordinates must be [lng, lat]'),
];

const alertValidator = [
  body('title').trim().notEmpty().withMessage('Alert title is required'),
  body('message').trim().notEmpty().withMessage('Alert message is required'),
  body('severity').optional().isIn(Object.values(ALERT_SEVERITY)),
];

const mongoIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`${name} must be a valid Mongo ObjectId`);

module.exports = {
  registerValidator,
  loginValidator,
  volunteerValidator,
  needValidator,
  donationValidator,
  reliefCampValidator,
  alertValidator,
  mongoIdParam,
};
