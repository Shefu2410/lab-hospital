const express = require('express');
const loginPage = require('../views/loginPage');
const dashboardPage = require('../views/dashboardPage');
const registrationPage = require('../views/registrationPage');
const catalogPage = require('../views/catalogPage');
const resultsPage = require('../views/resultsPage');
const ownerPage = require('../views/ownerPage');
const ownerLoginPage = require('../views/ownerLoginPage');
const labSignupPage = require('../views/labSignupPage');

const router = express.Router();

const send = (page) => (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(page());
};

router.get(['/', '/index.html'], send(loginPage));
router.get('/dashboard.html', send(dashboardPage));
router.get('/registration.html', send(registrationPage));
router.get('/catalog.html', send(catalogPage));
router.get('/results.html', send(resultsPage));
router.get('/lab-signup.html', send(labSignupPage));

// Platform owner - separate login + dashboard, not part of any lab.
router.get('/owner-login.html', send(ownerLoginPage));
router.get('/owner.html', send(ownerPage));

module.exports = router;