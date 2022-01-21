const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()
const passport = require('passport')
const passportLocalStrategy = require('passport-local').Strategy
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const session = require('express-session')
const connectionPool = require('./util/dbConnector')
const setUserAuthCookie = require('./util/setUserAuthCookie')

const app = express()
const port = 4000

app.use(cors(
  {
    origin: process.env.UI_URL,
    credentials: true
  }
))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(session({     //documentation
  secret: "secretcode",
  resave: false,
  saveUninitialized: false
}));

require('./passportConfig')(passport)


app.use(passport.initialize())
app.use(passport.session())



app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
  });

app.get('/', (req, res) => {
    res.send("wilkommen");
})

app.post('/login', (req, res, next) => {
  console.log("received login request")
  passport.authenticate("local", (err, user, info) => {
    console.log(info)
    if(err) throw err
    if (!user) res.status(401).send(info)
    else {
      req.logIn(user, (err) => {
        if (err) throw err
        res.cookie('auth_status', true, { maxAge: 2592000000 }).send(JSON.stringify({id: user.id, username: user.username}))
      })
    }
  })(req,res,next)
});

//TODO: Sanitize
app.post('/register', (req,res) => {
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    console.log(hash)
    connectionPool.query('INSERT INTO users (username, passhash, email) VALUES($1,$2,$3)', [req.body.username, hash, req.body.email], (err, results) => {
      if (err)
        throw err
      res.status(200).send({message: 'Account Created'})
    })
  })

});

app.get('/logout', (req, res) => {
  console.log('received logout request')
  req.logOut()
  res.redirect('/')
})

app.get('/user', (req,res) => {
  console.log(req.user)
  res.send({user: req.user, is_auth: req.isAuthenticated()})
});



app.use('/flies', require('./routes/flies'))
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send({message: 'Something broke!'})
})
