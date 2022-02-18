const knex = require('../util/dbConnector')
const express = require('express')
const router = express.Router()
const checkLoggedIn = require('../util/loggedIn')
const multer = require('multer')
const upload = multer({dest: 'images/'})
const s3 = require('../util/S3Connector')
const fs = require('fs')
const checkFlyOwner = require('../util/checkFlyOwner')

module.exports = router

const agg_fly_tags_query = knex('fly_tags').join('tags', 'fly_tags.tag_id', '=', 'tags.id').groupBy('fly_tags.fly_id').select({ fly_id: 'fly_tags.fly_id' }, knex.raw("string_agg(tags.title, ',' order by tags.title) as tag_list")).as('tag_list_query')


router.get('/', async (req, res) => {
    if (req.query?.search) {
        console.log("Getting search results")
        try {
             results = await knex('flies').whereILike('name', `%${req.query.search}%`)
             res.status(200).send(results)
        }
        catch {
            console.error(error)
            res.status(500).send({ message: 'Could not retrieve object' })
        }
    }
    else if (req.user) {
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
            const get_fly_favorite = knex.raw('CASE WHEN EXISTS (SELECT fly_id FROM favorites WHERE user_id=:user_id and fly_id=flies.id) THEN TRUE ELSE FALSE END AS is_favorite', { user_id: req.user.id })
            const result = await knex('flies').leftJoin(agg_fly_tags_query, 'flies.id', '=', 'tag_list_query.fly_id').leftJoin('users', 'users.id', '=', 'flies.user_id').select('flies.*', 'tag_list_query.tag_list', get_fly_favorite, 'username')
            res.status(200).send(result[0])
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: 'Could not retrieve object' })
        }
    }
    else {
        try {
            const result = await knex('flies').leftJoin(agg_fly_tags_query, 'flies.id', '=', 'tag_list_query.fly_id').select('tag_list_query.tag_list').where('id', req.params.id).select('*')
            res.status(200).send(result[0])
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: 'Could not retrieve object' })
        }
    }
})

router.delete('/:id', checkFlyOwner, async (req, res, next) => {
    console.log('Attempting to delete fly')
    try {
        const folder = 'img/' + req.user.id + '/' + req.params.id + '/'
        const result = await knex('flies').where('id', req.params.id).del()
        const imageResults = await s3.listObjectsV2({Bucket: process.env.AWS_BUCKET, Prefix: folder}).promise()
        await s3.deleteObjects({Bucket: process.env.AWS_BUCKET, Delete: { Objects: imageResults.Contents.map(e => ({Key: e.Key}))}}).promise()
        res.send({message: 'Object Deleted from DB'})
        // console.log(t)
    } catch (error) {
        console.error(error)
        res.status(500).send({ message: 'Error occurred during delete' })
    }
})

router.post('/', checkLoggedIn, upload.single('image'), async (req, res) => {
    console.log('Adding a fly to the db from user ' + req.user.username)
    let id;
    try {
        //get id in db first for s3 post
        const result = await knex('flies').insert({ name: req.body.name, description: req.body.description, user_id: req.user.id, variant_of: req.body.variant.length==0 ? null : parseInt(req.body.variant)}).returning('id')
        id = result[0].id
        const key = 'img/' + req.user.id + '/' + id + '/preview.png'

        //S3 usually has AWS.Response type as a return instead of promise, so the .promise() is required
        await s3.putObject({Body: fs.readFileSync(req.file.path), Bucket: process.env.AWS_BUCKET, Key: key}).promise()
        await knex('flies').where({id: id}).update({ image_url: `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${key}`})
        if(req.body.tags)
            await knex('fly_tags').insert([req.body.tags].flat().map(t_id => {return {tag_id: parseInt(t_id), fly_id: id}}))

        res.status(200).send({id: id})
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Unable to persist object' })
        try {
            await knex('flies').where({id: id}).del()
            await knex('fly_tags').where({fly_id: id}).del()
        }
        catch (err) {
            console.error(err)
        }
    }
    console.log('Deleting uploaded image file from local with path ' + req.file.path)
    fs.unlink(req.file.path, (err) => {console.error(err)})
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