const connectionPool = require('../util/dbConnector')
const express = require('express')
const router = express.Router()

module.exports = router

router.get('/', (req, res) => {
    connectionPool.query('SELECT * FROM flies', (err, results) => {
        if (err)
            throw err
        res.status(200).json(results.rows)
    })
})

router.get('/:id', (req, res) => {
    connectionPool.query('SELECT * FROM flies WHERE id=$1', [req.params.id], (err, results) => {
        if (err)
            throw err
        res.status(200).json(results.rows[0])
    })
})

