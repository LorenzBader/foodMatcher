var express = require('express')
var bcrypt = require('bcrypt')
var router = express.Router()
var jwt = require('jsonwebtoken')
const Database = require('../database');

const db = new Database();

// Connect to the database
db.connect().catch(err => {
    console.error("Error connecting to the database:", err);
});

var users = []

const saltRounds = 3

const jwtSecret = process.env.JWT_SECRET

router.get('/', function(req, res, next) {
  res.send('This is the users endpoint');
});

router.get('/login', async function(req, res, next) {
  const { mail, pw } = req.query
    if (!mail || !pw) {
      return res.status(400).send({ status: 'fail', message: 'Missing email or password' });
    }

    try {
        const user = await db.getUserByMail(mail);
        if (user && await bcrypt.compare(pw, user.pw)) {
            const data = { userMail: user.mail }
            const token = jwt.sign(data, jwtSecret, { expiresIn: '1h' })
            res.send({ status: 'success', message: 'Login successful', token: token, userName: user.username, expiresAt: Date.now() + 3600000 })
        } else {
            res.status(401).send({ status: 'fail', message: 'Invalid credentials' })
        }
    } catch (error) {
        res.status(500).send({ status: 'fail', message: 'Server error' });
    }  
})

router.get('/register', async function(req, res, next) {
  const { name, mail, pw } = req.query

if (!name || !mail || !pw) {
      return res.status(400).send({ status: 'fail', message: 'Missing a value' });
  }

  try {
    const userMailExists = await db.getUserByMail(mail);
    const userNameExists = await db.getUserByUsername(name);
    if (userMailExists || userNameExists) {
        res.status(409).send({ status: 'fail', message: 'User already exists' })
    } else {
        const hashedPw = await bcrypt.hash(pw, saltRounds)
        await db.addUser({mail: mail, username: name, pw: hashedPw});
        res.send({ status: 'success', message: 'Registration successful' })
    }
  } catch (error) {
    res.status(500).send({ status: 'fail', message: 'Server error' });
  }  
})


module.exports = router;
