const connectionPool = require('../util/dbConnector')
const express = require('express')
const router = express.Router()

module.exports = router

router.get('/', (req, res) => {
    if(req.user) {
        console.log("Looking for user flies xd")
        connectionPool.query('SELECT f.*, CASE WHEN EXISTS (SELECT fly_id FROM favorites WHERE user_id=$1 and fly_id=f.id) THEN TRUE ELSE FALSE END AS is_favorite FROM flies f ORDER BY id ASC LIMIT 5', [req.user.id], (err, results) => {
        // connectionPool.query('SELECT FLIES.*, favorites.fly_id from FLIES LEFT JOIN favorites ON FLIES.id=favorites.fly_id AND favorites.user_id=$1 ORDER BY id ASC LIMIT 5', [req.user.id], (err, results) => {
            if (err)
                throw err
            res.status(200).json(results.rows)
        })
    }
    else {
        console.log("Looking for all flies")
        connectionPool.query('SELECT * FROM flies LIMIT 10', (err, results) => {
            if (err)
                throw err
            res.status(200).json(results.rows)
        })
    }
})

router.get('/:id', (req, res) => {
    console.log(req.params.id)
    console.log(typeof req.params.id)
    if (!req.user)
        connectionPool.query('SELECT * FROM flies WHERE id=$1', [req.params.id], (err, results) => {
            if (err)
                throw err
            res.status(200).json(results.rows[0])
        })
    else{
        console.log(typeof req.user.id)
    connectionPool.query('SELECT *, CASE WHEN EXISTS (SELECT id FROM favorites WHERE user_id=$1 and fly_id=$2) THEN TRUE ELSE FALSE END AS is_favorite FROM flies WHERE id=$2', [req.user.id, req.params.id], (err, results) => {
        if (err)
            throw err
        res.status(200).json(results.rows[0])
    })
    }
})

router.post('/', (req,res) => {
    console.log("Adding " + req.body.name + " to the db")
    connectionPool.query('INSERT INTO flies (user_id, name) SELECT id, $1 from users;', [req.body.name], (err, results) => {
        if (err)
            throw err
        res.status(200).json(req.body)
    })
})

router.post('/:id/favorite', (req, res, next) => {
    console.log(req.body)
    if (req.user) {
        if(req.body.set_favorite)
            connectionPool.query('INSERT INTO favorites (user_id, fly_id) VALUES($1, $2)', [req.user.id, req.params.id], (err, results) => {
                if (err) next(err)
                else res.status(200).json({message: 'Fly Favorited'})
            })
        else
            connectionPool.query('DELETE FROM favorites WHERE user_id=$1 and fly_id=$2', [req.user.id, req.params.id], (err, results) => {
            if (err) next(err)
            else res.status(200).json({message: 'Fly Unfavorited'})
        })
    }

})