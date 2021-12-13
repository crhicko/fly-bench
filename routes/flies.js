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

router.post('/', (req,res) => {
    console.log("Adding " + req.body.name + " to the db")
    connectionPool.query('INSERT INTO flies (user_id, name) SELECT id, $1 from users;', [req.body.name], (err, results) => {
        if (err)
            throw err
        res.status(200).json(req.body)
    })
})

router.post('/:id/favorite', (req, res) => {
    if (req.user) {
        if(req.body.set_favorite)
            connectionPool.query('INSERT INTO favorites (user_id, fly_id) VALUES($1, $2)', [req.user.id, req.body.fly_id], (err, results) => {
                if (err) throw err
                res.status(200).json(req.body)
            })
        else
            connectionPool.query('DELETE FROM favorites WHERE user_id=$1 and fly_id=$2', [req.user.id, req.body.fly_id], (err, results) => {
            if (err) throw err
            res.status(200).json(req.body)
        })
    }

})