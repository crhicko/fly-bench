const express = require('express')
const cors = require('cors')
require('dotenv').config()
const passport = require('passport')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const session = require('express-session')
const knex=require('./util/dbConnector')
const s3 = require('./util/S3Connector')

const app = express()
const port = 4000

//S3 Setup


console.log("Region: ", s3.config.region);

console.log(process.env.UI_URL)
app.use(cors(
  {
    origin: process.env.UI_URL,
    credentials: true
  }
))
app.use(express.json({limit: '5kb'}))
app.use(express.urlencoded({extended: true, limit: '5kb'}))
app.use(cookieParser())
app.use(session({     //documentation
  secret: process.env.SESSION_SECRET,
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

app.get('/test', async (req, res) => {
    s3.getObject({Bucket: process.env.AWS_BUCKET, Key: 'img/admin/3x.png'}, (err, data) => {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    })
    s3.listObjects({Bucket: 'fly-box'} , (err, data) => {
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
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
  bcrypt.hash(req.body.password, 10, async (err, hash) => {
    console.log(hash)
    try {
      const result = await knex('users').insert({username: req.body.username, passhash: hash, email: req.body.email}).returning('id')
      res.status(200).send({id: result[0].id})
    } catch(err) {

    }
  })

});

app.get('/logout', (req, res) => {
  console.log('received logout request')
  req.logOut()
  console.log('loggedout')
})

app.get('/user', (req,res) => {
  console.log(req.user)
  res.send({user: req.user, is_auth: req.isAuthenticated()})
});

app.use('/flies', require('./routes/flies'))
app.use('/tags', require('./routes/tags'))

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send({message: 'Something broke!'})
})
