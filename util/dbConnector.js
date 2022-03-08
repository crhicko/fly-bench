const knex = require('knex')({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  })

module.exports = knex