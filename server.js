const express = require('express')
const cors = require('cors')
require('dotenv').config()
const passport = require('passport')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const app = express()
const port = 4000

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

require('./src/config/passportConfig')(passport)

app.use(passport.initialize())
app.use(passport.session())

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
  });

app.get('/', (req, res) => {
    res.send("wilkommen");
})

// app.get('/test', async (req, res) => {
//     s3.getObject({Bucket: process.env.AWS_BUCKET, Key: 'img/admin/3x.png'}, (err, data) => {
//       if (err) console.log(err, err.stack); // an error occurred
//       else     console.log(data);           // successful response
//     })
//     s3.listObjects({Bucket: 'fly-box'} , (err, data) => {
//       if (err) console.log(err, err.stack);
//       else console.log(data);
//     });
// })




app.use('/flies', require('./src/api/routes/flies'))
app.use('/tags', require('./src/api/routes/tags'))
app.use('/', require('./src/api/routes/auth'))

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send({message: 'Something broke!'})
})
