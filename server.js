const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

const app = express()
const port = 4000

app.use(cors())
app.use(bodyParser.json())

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
  });

app.get('/', (req, res) => {
    res.send("wilkommen");
})

app.use('/flies', require('./routes/flies'))