const bcrypt = require('bcrypt')
const localStrategy =  require('passport-local').Strategy
const connectionPool = require('./util/dbConnector')

const PassportConfig = (passport) => {
    passport.use(
        new localStrategy((username, password, done) => {
            console.log(username)
            connectionPool.query('SELECT * from users WHERE username=$1', [username], (err, queryResult) => {
                console.log(queryResult)
                if (err)
                    throw err
                if (!queryResult.rows[0]) return done(null, false, {message: "No User Found"})
                bcrypt.compare(password, queryResult.rows[0].passhash, (err, result) => {
                    if (err)
                        throw err
                    if (result === true) {
                        return done(null, queryResult.rows[0])
                    }
                    else return done(null, false, {message: "Incorrect Password"})
                })
            })
        })
    )

    passport.serializeUser((user, done) => {
        console.log("Serializing " + user.id)
        done(null, user.id)
    })
    passport.deserializeUser((id ,done) => {
        console.log("Deserializing")
        connectionPool.query('SELECT * from users WHERE id=$1', [id], (err, queryResult) => {
            done(err, queryResult.rows[0])
        })
    })
}

module.exports = PassportConfig