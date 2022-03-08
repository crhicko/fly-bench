const knex = require('knex')({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    keepAlive: true,
    pool: {
      min: 0
    }
  })

module.exports = knex