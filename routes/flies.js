const knex = require('../util/dbConnector')
const express = require('express')
const router = express.Router()
const checkLoggedIn = require('../util/loggedIn')

module.exports = router

const agg_fly_tags_query = knex('fly_tags').join('tags', 'fly_tags.tag_id', '=', 'tags.id').groupBy('fly_tags.fly_id').select({ fly_id: 'fly_tags.fly_id' }, knex.raw("string_agg(tags.title, ',' order by tags.title) as tag_list")).as('tag_list_query')


router.get('/', async (req, res) => {
    if (req.user) {
        console.log("get all flies including favorite status")
        const get_fly_favorite = knex.raw('CASE WHEN EXISTS (SELECT fly_id FROM favorites WHERE user_id=:user_id and fly_id=flies.id) THEN TRUE ELSE FALSE END AS is_favorite', { user_id: req.user.id })
        const results = await knex('flies').leftJoin(agg_fly_tags_query, 'flies.id', '=', 'tag_list_query.fly_id').leftJoin('users', 'users.id', '=', 'flies.user_id').select('flies.*', 'tag_list_query.tag_list', get_fly_favorite, 'username')
        res.status(200).send(results)
    }
    else {
        console.log("Looking for all flies")
        const results = await knex('flies').leftJoin(agg_fly_tags_query, 'flies.id', '=', 'tag_list_query.fly_id').leftJoin('users', 'users.id', '=', 'flies.user_id').select('flies.*', 'tag_list_query.tag_list', 'username')
        res.status(200).send(results)
    }
})

router.get('/:id', async (req, res, next) => {
    console.log("Getting specific fly " + req.params.id)
    if (req.user) {
        try {
            const result = await knex('flies').where('id', req.params.id).select('*', knex.raw('CASE WHEN EXISTS (SELECT fly_id FROM favorites WHERE user_id=:user_id and fly_id=flies.id) THEN TRUE ELSE FALSE END AS is_favorite', { user_id: req.user.id }))
            res.status(200).send(result[0])
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: 'Could not retrieve object' })
        }
    }
    else {
        try {
            const result = await knex('flies').where('id', req.params.id).select('*')
            res.status(200).send(result[0])
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: 'Could not retrieve object' })
        }
    }
})

router.post('/', checkLoggedIn, async (req, res) => {
    console.log('Adding a fly to the db from user ' + req.user.username)
    try {
        const result = await knex('flies').insert({ name: req.body.name, description: req.body.description, user_id: req.user.id }).returning('id')
        res.status(200).send(result[0])
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Unable to persist object' })
    }
})

router.post('/:id/favorite', checkLoggedIn, async (req, res, next) => {
    if (req.body.set_favorite) {
        console.log('User ' + req.user.username + ' is favoriting fly ' + req.params.id)
        try {
            const result = await knex('favorites').insert({ user_id: req.user.id, fly_id: req.params.id })
            res.status(200).send({ message: 'Fly Favorited' })
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: 'Unable to alter favorite state' })
        }
    }
    else {
        console.log('User ' + req.user.username + ' is unfavoriting fly ' + req.params.id)
        try {
            const result = await knex('favorites').where({ user_id: req.user.id, fly_id: req.params.id }).del()
            res.status(200).send({ message: 'Fly Unfavorited' })
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: 'Unable to alter favorite state' })
        }
    }
})