const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator } = require('../utils/validators');

// POST /api/auth/register
router.post('/register', registerValidator, validate, register);

// POST /api/auth/login
router.post('/login', loginValidator, validate, login);

module.exports = router;
