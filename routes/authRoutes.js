const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Lab = require('../models/Lab');

const { protect } = require('../middleware/auth');

const router = express.Router();


// ======================================================
// CREATE JWT
// ======================================================

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      lab: user.lab
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    }
  );
}


// ======================================================
// LOGIN
//
// POST /api/auth/login
//
// Body:
// {
//   labCode,
//   username,
//   password
// }
// ======================================================

router.post('/login', async (req, res, next) => {
  try {
    const {
      labCode,
      username,
      password
    } = req.body;


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!labCode || !username || !password) {
      return res.status(400).json({
        message: 'Lab code, username and password are required.'
      });
    }


    const normalizedCode =
      labCode.trim().toUpperCase();

    const normalizedUsername =
      username.trim().toLowerCase();


    // ==================================================
    // PLATFORM OWNER LOGIN
    // ==================================================

    if (normalizedCode === 'PLATFORM') {

      const admin = await User.findOne({
        role: 'superadmin',
        username: normalizedUsername
      });

      if (
        !admin ||
        !(await admin.comparePassword(password))
      ) {
        return res.status(401).json({
          message: 'Invalid username or password.'
        });
      }


      const token = signToken(admin);

      return res.json({
        token,
        user: admin.toSafeObject(),
        lab: null
      });
    }


    // ==================================================
    // FIND LAB
    // ==================================================

    const lab = await Lab.findOne({
      labCode: normalizedCode
    });


    if (!lab) {
      return res.status(404).json({
        message: 'No lab found with that code.'
      });
    }


    // ==================================================
    // CHECK LAB STATUS
    // ==================================================

    if (lab.status !== 'approved') {

      if (lab.status === 'pending') {
        return res.status(403).json({
          message:
            'This lab is still awaiting owner approval.'
        });
      }

      if (lab.status === 'rejected') {
        return res.status(403).json({
          message:
            'This lab registration was rejected.'
        });
      }

      if (lab.status === 'revoked') {
        return res.status(403).json({
          message:
            'This lab access has been revoked.'
        });
      }

      return res.status(403).json({
        message: 'This lab is not active.'
      });
    }


    // ==================================================
    // FIND USER
    // ==================================================

    const user = await User.findOne({
      lab: lab._id,
      username: normalizedUsername
    });


    if (!user) {
      return res.status(401).json({
        message:
          'Username not found for this laboratory.'
      });
    }


    // ==================================================
    // CHECK PASSWORD
    // ==================================================

    const passwordMatch =
      await user.comparePassword(password);


    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid username or password.'
      });
    }


    // ==================================================
    // CREATE TOKEN
    // ==================================================

    const token = signToken(user);


    // ==================================================
    // LOGIN SUCCESS
    // ==================================================

    return res.json({
      message: 'Login successful',

      token,

      user: user.toSafeObject(),

      lab: {
        id: lab._id,
        code: lab.labCode,
        name: lab.labName,
        email: lab.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
});


// ======================================================
// CURRENT USER
//
// GET /api/auth/me
// ======================================================

router.get('/me', protect, (req, res) => {

  res.json({
    user: req.user
  });

});


module.exports = router;