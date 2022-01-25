const connectionPool = require('../util/dbConnector')
const express = require('express')
const router = express.Router()

module.exports = router

const fly_and_tag_query = "Select flies.*, a.tag_list from flies LEFT JOIN (SELECT fly_tags.fly_id as fly_id, string_agg(tags.title, ',' order by tags.title) as tag_list from fly_tags LEFT JOIN tags ON fly_tags.tag_id=tags.id GROUP BY fly_tags.fly_id) a ON flies.id=a.fly_id"
const fly_and_tag_and_favorites_query = "Select flies.*, CASE WHEN EXISTS (SELECT fly_id FROM favorites WHERE user_id=$1 and fly_id=flies.id) THEN TRUE ELSE FALSE END AS is_favorite, a.tag_list from flies LEFT JOIN (SELECT fly_tags.fly_id as fly_id, string_agg(tags.title, ',' order by tags.title) as tag_list from fly_tags LEFT JOIN tags ON fly_tags.tag_id=tags.id GROUP BY fly_tags.fly_id) a ON flies.id=a.fly_id"

router.get('/', (req, res) => {
    if(req.user) {
        console.log("Looking for user favorited flies xd")
        connectionPool.query(fly_and_tag_and_favorites_query, [req.user.id], (err, results) => {
        // connectionPool.query('SELECT FLIES.*, favorites.fly_id from FLIES LEFT JOIN favorites ON FLIES.id=favorites.fly_id AND favorites.user_id=$1 ORDER BY id ASC LIMIT 5', [req.user.id], (err, results) => {
            if (err)
                throw err
            res.status(200).json(results.rows)
        })
    }


    else {
        console.log("Looking for all flies")
        connectionPool.query(fly_and_tag_query + ' LIMIT 10', (err, results) => {
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