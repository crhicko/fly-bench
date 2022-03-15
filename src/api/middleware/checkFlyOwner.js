const knex = require('../util/dbConnector')

async function checkFlyOwner(req, res, next) {
    const results = await knex('flies').where('id', req.params.id)
    console.log(req.user, results[0].user_id)
    if (req.user.id === results[0].user_id) {
        next();
    } else {
        res.status(401).send({ message: 'User does not have permission for that operation.' })
    }
}

module.exports = checkFlyOwner