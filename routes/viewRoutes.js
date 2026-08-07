const express = require('express');

const loginPage = require('../views/loginPage');
const dashboardPage = require('../views/dashboardPage');
const registrationPage = require('../views/registrationPage');
const catalogPage = require('../views/catalogPage');
const resultsPage = require('../views/resultsPage');
const ownerPage = require('../views/ownerPage');

const router = express.Router();

const send = (page) => (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(page());
};

// Login
router.get(['/', '/index.html'], send(loginPage));

// Dashboard
router.get('/dashboard.html', send(dashboardPage));

// Registration / Signup
router.get('/registration.html', send(registrationPage));
router.get('/signuppage.html', send(registrationPage));

// Test Catalog
router.get('/catalog.html', send(catalogPage));

// Test Results
router.get('/results.html', send(resultsPage));

// Owner
router.get('/owner.html', send(ownerPage));

module.exports = router;