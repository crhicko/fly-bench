const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const knex = require('../util/dbConnector')
const passport = require('passport')

module.exports = router

router.post('/logout', (req, res) => {
    console.log('received logout request')
    req.logOut()
    res.status(200).send()
    console.log('loggedout')
})

router.post('/login', (req, res, next) => {
    console.log("received login request")
    passport.authenticate("local", (err, user, info) => {
        console.log(info)
        if (err) throw err
        if (!user) res.status(401).send(info)
        else {
            req.logIn(user, (err) => {
                if (err) throw err
                res.cookie('auth_status', true, { maxAge: 2592000000 }).send(JSON.stringify({ id: user.id, username: user.username }))
            })
        }
    })(req, res, next)
});


router.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
        console.log(hash)
        try {
            const result = await knex('users').insert({ username: req.body.username, passhash: hash, email: req.body.email }).returning('id')
            res.status(200).send({ id: result[0].id })
        } catch (err) {

        }
    })

});

router.get('/user', (req, res) => {
    console.log(req.user)
    res.send({ user: req.user, is_auth: req.isAuthenticated() })
});
