const knex = require('../util/dbConnector')
const s3 = require('../util/S3Connector')
const Fly = require('../models/fly.model')
const {ref} = require('objection')
const fs = require('fs')

const getFlyById = async (req, res, next) => {
    console.log("Getting specific fly " + req.params.id)

    const queryBuilder = Fly.query()
        .select('flies.*')
        .where('flies.id', '=', req.params.id)
        .modify('includeAggregateTags')

    if (req.user) {
        queryBuilder.modify('includeFavoriteStatus', req.user.id)
    }

    try {
        const result = await queryBuilder;
        res.status(200).send(result[0])
    } catch (error) {
        console.error(error)
        res.status(500).send({ message: 'Could not retrieve object' })
    }
}

const getFlies = async (req, res) => {
    const queryBuilder = Fly.query()
        .select('flies.*')
        .modify('includeAggregateTags')

    if (req.user)
        queryBuilder.modify('includeFavoriteStatus', req.user.id)

    if (req.query?.search) {
        queryBuilder.where(ref('flies.name'), 'ilike', `%${req.query.search}%`);
    }

    try {
        const result = await queryBuilder;
        res.status(200).send(result)
    } catch (error) {
        console.error(error)
        res.status(500).send({ message: 'Could not retrieve object' })
    }
}

const deleteFly = async (req, res, next) => {
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
}

const createFly = async (req, res) => {
    console.log('Adding a fly to the db from user ' + req.user.username)
    let key;

    try {
        const id = await Fly.transaction(async (trx) => {
            const {id: fly_id} = await Fly.query(trx)
                .insert({
                    name: req.body.name,
                    description: req.body.description,
                    user_id: req.user.id,
                    variant_of: req.body.variant.length==0 ? null : parseInt(req.body.variant)})
                .returning('id');
            key = 'img/' + req.user.id + '/' + fly_id + '/preview.png';
            await s3.putObject({Body: fs.readFileSync(req.file.path), Bucket: process.env.AWS_BUCKET, Key: key}).promise()

            await Fly.query(trx).where({id: fly_id}).patch({ image_url: `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${key}`})
            if(req.body.tags)
                await trx('fly_tags').insert([req.body.tags].flat().map(t_id => {return {tag_id: parseInt(t_id), fly_id: fly_id}}))

            return fly_id;
        })
        res.status(200).send({id: id})
    } catch (err) {
        console.log("ROLLING BACK")
        console.error(err)
        res.status(500).send({ message: 'Unable to persist object' })
        console.log('Deleting Image from S3')
        await s3.deleteObjects({Bucket: process.env.AWS_BUCKET, Delete: { Objects: [{Key: key}]}}).promise()
    }
    console.log('Deleting uploaded image file from local with path ' + req.file.path)
    fs.unlink(req.file.path, (err) => {console.error(err)})
}

const favoriteFly = async (req, res, next) => {
    const queryBuilder = knex('favorites')
    let message;

    if (req.body.set_favorite) {
        console.log('User ' + req.user.username + ' is favoriting fly ' + req.params.id)
        queryBuilder.insert({ user_id: req.user.id, fly_id: req.params.id })
        message = 'Fly Favorited'
    }
    else {
        console.log('User ' + req.user.username + ' is unfavoriting fly ' + req.params.id)
        queryBuilder.where({ user_id: req.user.id, fly_id: req.params.id }).del()
        message = 'Fly Unfavorited'
    }

    try {
        await queryBuilder;
        res.status(200).send({ message: message });
    } catch (error) {
        console.error(error)
        res.status(500).send({ message: 'Unable to alter favorite state' })
    }
}

module.exports = {
    getFlyById,
    getFlies,
    deleteFly,
    createFly,
    favoriteFly
}