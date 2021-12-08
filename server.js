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

const app = express()
const port = 4000

app.use(cors(
  {
    origin: 'http://localhost:3000',
    credentials: true
  }
))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({     //documentation
  secret: "secretcode",
  resave: true,
  saveUninitialized: true
}));

app.use(cookieParser("secretcode"))
app.use(passport.initialize())
app.use(passport.session())
require('./passportConfig')(passport)



app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
  });

app.get('/', (req, res) => {
    res.send("wilkommen");
})

app.post('/login', (req, res, next) => {
  console.log("received login requiest")
  passport.authenticate("local", (err, user, info) => {
    if(err) throw err
    if (!user) res.send(info)
    else {
      req.logIn(user, (err) => {
        if (err) throw err
        res.send('Successfully Authed')
        console.log(req.user)
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
      res.status(200).json(req.body)
    })
  })

});

app.get('/user', (req,res) => {
  console.log(req.body)
});



app.use('/flies', require('./routes/flies'))