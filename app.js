const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const needRoutes = require('./routes/needRoutes');
const donationRoutes = require('./routes/donationRoutes');
const reliefCampRoutes = require('./routes/reliefCampRoutes');
const alertRoutes = require('./routes/alertRoutes');
const mapRoutes = require('./routes/mapRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Health check ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ReliefConnect API is running',
    docs: '/api-docs',
  });
});
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', uptime: process.uptime() }));

// --- Swagger / API docs ---
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('[Swagger] Could not load docs/swagger.yaml:', err.message);
}

// --- Routes (exactly matching the case study's API endpoint spec) ---
app.use('/api/auth', authRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/needs', needRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/relief-camps', reliefCampRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
