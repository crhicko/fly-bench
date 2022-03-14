const {Model} = require('objection')

const knex = require('knex')({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    keepAlive: true,
    pool: {
      min: 0
    }
  })

Model.knex(knex)

module.exports = knex