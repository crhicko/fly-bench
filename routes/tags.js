const knex = require('../util/dbConnector')
const express = require('express')
const router = express.Router()

module.exports = router

router.get('/', async(req, res) => {
    try {
        const results = await knex('tags')
        res.status(200).send(results)
    } catch {
        console.error(error)
        res.status(500).send({ message: 'Could not retrieve objects' })
    }
})