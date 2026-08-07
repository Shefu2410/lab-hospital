require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const testRoutes = require('./routes/testRoutes');
const resultRoutes = require('./routes/resultRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const viewRoutes = require('./routes/viewRoutes');
const labRoutes = require('./routes/labRoutes');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---------------- Middleware ----------------

app.use(cors());
app.use(express.json());

// ---------------- APIs ----------------

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/labs', labRoutes);

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
            console.log(
                `Multi-Lab Hospital LIMS running on http://localhost:${PORT}`
            );
        });
    })
    .catch((err) => {
        console.error('MongoDB Connection Failed:', err);
    });