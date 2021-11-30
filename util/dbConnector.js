const {Pool , Client} = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fly',
    password: 'admin',
    port: 5432,
  })

module.exports = pool