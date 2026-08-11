require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const connectDB = require('./config/db');

// Existing Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const testRoutes = require('./routes/testRoutes');
const resultRoutes = require('./routes/resultRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const viewRoutes = require('./routes/viewRoutes');

// Multi-Lab: labs manage themselves, plus a platform owner
const labRoutes = require('./routes/labRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ownerAuthRoutes = require('./routes/ownerAuthRoutes');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---------------- Middleware ----------------
app.use(cors());
app.use(compression()); // gzip every response - biggest single win for perceived load speed
app.use(express.json());

// Shared CSS/JS used to be inlined into every single page's HTML (couldn't be
// cached). They're now written to /public at boot and served as real static
// files with long-lived caching, so the browser only downloads them once
// across login/dashboard/results/etc. See views/buildStatic.js.
app.use(
  '/static',
  express.static(path.join(__dirname, 'public'), {
    maxAge: '30d',
    immutable: true,
  })
);

// ---------------- Existing APIs ----------------
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ---------------- Multi-Lab APIs ----------------

// Lab self registration
app.use('/api/labs', labRoutes);

// Platform owner (approve/reject labs, view lab admin passwords)
app.use('/api/owner', ownerAuthRoutes);
app.use('/api/admin', adminRoutes);

// ---------------- Health ----------------
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Hospital LIMS Server Running'
    });
});

// ---------------- Frontend ----------------
app.use(viewRoutes);

// ---------------- Error Handler ----------------
app.use(notFound);
app.use(errorHandler);

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Multi-Lab Hospital LIMS running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB Connection Failed:', err);
    });
