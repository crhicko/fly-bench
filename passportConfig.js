const bcrypt = require('bcrypt')
const localStrategy =  require('passport-local').Strategy
const knex = require('./util/dbConnector')

const PassportConfig = (passport) => {
    passport.use(
        new localStrategy(async (username, password, done) => {
            console.log(username)
            try {
                const result = await knex('users').where('username', username).select('*')
                console.log(result.length)
                if(result.length == 0) return done(none, false, {message: "No User Found"})
                bcrypt.compare(password, result[0].passhash, (err, r) => {
                    if (r === true) {
                        return done(null, result[0])
                    }
                    else return done(null, false, {message: "Incorrect Password"})
                })
            } catch(err) {
                console.log("ERROR")
                throw err
            }
        })
    )

    passport.serializeUser((user, done) => {
        console.log("Serializing " + user.id)
        done(null, user.id)
    })
    passport.deserializeUser(async (id ,done) => {
        console.log("Deserializing")

        try {
            const result = await knex('users').where('id', id).select('*')
            done(null, result[0])
        } catch(error) {
            throw error
        }
    })
}

module.exports = PassportConfig