const express = require('express');
const loginPage = require('../views/loginPage');
const signupPage = require('../views/signupPage');
const adminPage = require('../views/adminPage');
const dashboardPage = require('../views/dashboardPage');
const registrationPage = require('../views/registrationPage');
const catalogPage = require('../views/catalogPage');
const resultsPage = require('../views/resultsPage');

const router = express.Router();

const send = (page) => (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(page());
};

router.get(['/', '/index.html'], send(loginPage));
router.get('/signup.html', send(signupPage));
router.get('/admin.html', send(adminPage));
router.get('/dashboard.html', send(dashboardPage));
router.get('/registration.html', send(registrationPage));
router.get('/catalog.html', send(catalogPage));
router.get('/results.html', send(resultsPage));

module.exports = router;
