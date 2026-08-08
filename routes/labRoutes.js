const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Lab = require('../models/Lab');
const User = require('../models/User');
const { sendNewLabRegisteredEmail } = require('../utils/mailer');

const { requireOwnerKey } =
  require('../middleware/ownerAuth');


const router = express.Router();


// ======================================================
// GENERATE LAB CODE
// ======================================================

function generateLabCode() {

  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = 'RKH';

  for (let i = 0; i < 5; i++) {

    code +=
      chars.charAt(
        Math.floor(
          Math.random() * chars.length
        )
      );

  }

  return code;

}


// ======================================================
// CREATE UNIQUE LAB CODE
// ======================================================

async function createUniqueLabCode() {

  let code;

  let exists = true;


  while (exists) {

    code =
      generateLabCode();


    exists =
      await Lab.exists({
        labCode: code
      });

  }


  return code;

}


// ======================================================
// REGISTER NEW LAB
// POST /api/labs/register
// ======================================================

router.post(
  '/register',
  async (req, res) => {

    try {

      const {
        labName,
        email,
        adminName,
        username,
        password
      } = req.body;


      // ----------------------------------------------
      // VALIDATION
      // ----------------------------------------------

      if (
        !labName ||
        !email ||
        !adminName ||
        !username ||
        !password
      ) {

        return res.status(400).json({

          message:
            'All fields are required.'

        });

      }


      if (password.length < 6) {

        return res.status(400).json({

          message:
            'Password must be at least 6 characters.'

        });

      }


      const cleanEmail =
        email
          .toLowerCase()
          .trim();


      const cleanUsername =
        username
          .toLowerCase()
          .trim();


      // ----------------------------------------------
      // CHECK EMAIL
      // ----------------------------------------------

      const existingEmail =
        await Lab.findOne({
          email: cleanEmail
        });


      if (existingEmail) {

        return res.status(409).json({

          message:
            'A laboratory with this email is already registered.'

        });

      }


      // ----------------------------------------------
      // CHECK USERNAME
      // ----------------------------------------------

      const existingUsername =
        await Lab.findOne({
          username: cleanUsername
        });


      if (existingUsername) {

        return res.status(409).json({

          message:
            'This username is already in use. Please choose another username.'

        });

      }


      // ----------------------------------------------
      // HASH PASSWORD
      // ----------------------------------------------

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      // ----------------------------------------------
      // CREATE LAB
      //
      // Lab code is NOT generated yet.
      // It will be generated when owner approves.
      // ----------------------------------------------

      const lab =
        await Lab.create({

          labName:
            labName.trim(),

          email:
            cleanEmail,

          adminName:
            adminName.trim(),

          username:
            cleanUsername,

          password:
            hashedPassword,

          labCode:
            null,

          status:
            'pending'

        });


      // ----------------------------------------------
      // NOTIFY OWNER BY EMAIL
      //
      // Fire-and-forget: do NOT await/block on this,
      // and never let a mail failure fail registration.
      // ----------------------------------------------

      sendNewLabRegisteredEmail(lab);


      return res.status(201).json({

        message:
          'Registration submitted successfully. Your laboratory is pending owner approval.',

        labId:
          lab._id

      });

    }

    catch (err) {

      console.error(
        'Lab registration error:',
        err
      );


      return res.status(500).json({

        message:
          'Server error during laboratory registration.'

      });

    }

  }
);


// ======================================================
// LAB LOGIN
//
// POST /api/labs/login
//
// Requires:
// labCode
// username
// password
// ======================================================

router.post(
  '/login',
  async (req, res) => {

    try {

      const {
        labCode,
        username,
        password
      } = req.body;


      // ----------------------------------------------
      // VALIDATION
      // ----------------------------------------------

      if (
        !labCode ||
        !username ||
        !password
      ) {

        return res.status(400).json({

          message:
            'Lab Code, Username and Password are required.'

        });

      }


      const cleanLabCode =
        labCode
          .trim()
          .toUpperCase();


      const cleanUsername =
        username
          .trim()
          .toLowerCase();


      // ----------------------------------------------
      // FIND LAB
      // ----------------------------------------------

      const lab =
        await Lab.findOne({

          labCode:
            cleanLabCode,

          username:
            cleanUsername

        });


      if (!lab) {

        return res.status(404).json({

          message:
            'No laboratory found with this Lab Code and Username.'

        });

      }


      // ----------------------------------------------
      // CHECK STATUS
      // ----------------------------------------------

      if (
        lab.status === 'pending'
      ) {

        return res.status(403).json({

          message:
            'Your laboratory is still pending owner approval.'

        });

      }


      if (
        lab.status === 'rejected'
      ) {

        return res.status(403).json({

          message:
            'Your laboratory registration was rejected.'

        });

      }


      if (
        lab.status === 'revoked'
      ) {

        return res.status(403).json({

          message:
            'Your laboratory access has been revoked by the owner.'

        });

      }


      if (
        lab.status !== 'approved'
      ) {

        return res.status(403).json({

          message:
            'Your laboratory is not approved.'

        });

      }


      // ----------------------------------------------
      // CHECK PASSWORD
      // ----------------------------------------------

      const passwordMatch =
        await bcrypt.compare(
          password,
          lab.password
        );


      if (!passwordMatch) {

        return res.status(401).json({

          message:
            'Invalid username or password.'

        });

      }


      // ----------------------------------------------
      // CREATE JWT
      // ----------------------------------------------

      const token =
        jwt.sign(

          {

            id:
              lab._id,

            role:
              'lab',

            labCode:
              lab.labCode,

            username:
              lab.username

          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              '12h'
          }

        );


      // ----------------------------------------------
      // RESPONSE
      // ----------------------------------------------

      return res.json({

        message:
          'Login successful',

        token,

        lab: {

          id:
            lab._id,

          labName:
            lab.labName,

          email:
            lab.email,

          adminName:
            lab.adminName,

          username:
            lab.username,

          labCode:
            lab.labCode

        }

      });

    }

    catch (err) {

      console.error(
        'Lab login error:',
        err
      );


      return res.status(500).json({

        message:
          'Server error during laboratory login.'

      });

    }

  }
);


// ======================================================
// OWNER - VIEW ALL LABS
//
// GET /api/labs/owner/all
// ======================================================

router.get(
  '/owner/all',
  requireOwnerKey,
  async (req, res) => {

    try {

      const labs =
        await Lab.find({})
          .select(
            'labName email adminName username labCode status createdAt'
          )
          .sort({
            createdAt: -1
          });


      const result =
        labs.map(
          (lab) => ({

            id:
              lab._id,

            code:
              lab.labCode,

            name:
              lab.labName,

            email:
              lab.email,

            admin:
              lab.adminName,

            username:
              lab.username,

            status:
              lab.status,

            active:
              lab.status === 'approved'

          })
        );


      res.json(result);

    }

    catch (err) {

      console.error(
        'Owner labs error:',
        err
      );


      res.status(500).json({

        message:
          'Could not load laboratories.'

      });

    }

  }
);


// ======================================================
// OWNER - APPROVE LAB
//
// PUT /api/labs/owner/:id/approve
// ======================================================

router.put(
  '/owner/:id/approve',
  requireOwnerKey,
  async (req, res) => {

    try {

      const lab = await Lab.findById(req.params.id);

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found.'
        });
      }


      // ----------------------------------------------
      // ALREADY APPROVED
      // ----------------------------------------------

      if (lab.status === 'approved') {

        return res.json({
          message: 'Lab is already approved.',
          labCode: lab.labCode
        });

      }


      // ----------------------------------------------
      // GENERATE LAB CODE
      // ----------------------------------------------

      const labCode =
        lab.labCode ||
        await createUniqueLabCode();


      // ----------------------------------------------
      // CHECK WHETHER ADMIN USER ALREADY EXISTS
      // ----------------------------------------------

      let user = await User.findOne({
        lab: lab._id,
        username: lab.username
      });


      // ----------------------------------------------
      // CREATE ADMIN USER
      // ----------------------------------------------

      if (!user) {

        user = await User.create({
          name: lab.adminName,
          username: lab.username,

          // IMPORTANT:
          // lab.password is already bcrypt hashed.
          password: lab.password,

          role: 'admin',

          lab: lab._id
        });

      }


      // ----------------------------------------------
      // APPROVE LAB
      // ----------------------------------------------

      lab.labCode = labCode;
      lab.status = 'approved';

      await lab.save();


      // ----------------------------------------------
      // RESPONSE
      // ----------------------------------------------

      return res.json({

        message:
          'Laboratory approved successfully.',

        labCode: lab.labCode,

        lab: {
          id: lab._id,
          labName: lab.labName,
          email: lab.email,
          adminName: lab.adminName,
          username: lab.username,
          labCode: lab.labCode,
          status: lab.status
        },

        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }

      });

    } catch (err) {

      console.error(
        'Approve lab error:',
        err
      );

      return res.status(500).json({
        message:
          'Could not approve laboratory.'
      });

    }
  }
);


// ======================================================
// OWNER - REJECT LAB
//
// PUT /api/labs/owner/:id/reject
// ======================================================

router.put(
  '/owner/:id/reject',
  requireOwnerKey,
  async (req, res) => {

    try {

      const lab =
        await Lab.findById(
          req.params.id
        );


      if (!lab) {

        return res.status(404).json({

          message:
            'Lab not found.'

        });

      }


      lab.status =
        'rejected';


      await lab.save();


      return res.json({

        message:
          'Laboratory rejected successfully.'

      });

    }

    catch (err) {

      console.error(
        'Reject lab error:',
        err
      );


      return res.status(500).json({

        message:
          'Could not reject laboratory.'

      });

    }

  }
);


// ======================================================
// OWNER - REVOKE LAB
//
// PUT /api/labs/owner/:id/revoke
// ======================================================

router.put(
  '/owner/:id/revoke',
  requireOwnerKey,
  async (req, res) => {

    try {

      const lab =
        await Lab.findById(
          req.params.id
        );


      if (!lab) {

        return res.status(404).json({

          message:
            'Lab not found.'

        });

      }


      lab.status =
        'revoked';


      await lab.save();


      return res.json({

        message:
          'Laboratory access revoked.'

      });

    }

    catch (err) {

      console.error(
        'Revoke lab error:',
        err
      );


      return res.status(500).json({

        message:
          'Could not revoke laboratory.'

      });

    }

  }
);


module.exports = router;