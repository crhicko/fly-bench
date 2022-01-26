function loggedIn(req, res, next) {
    console.log(req.user)
    if (req.user) {
        next();
    } else {
        res.status(401).send({ message: 'User must be authenticated' })
    }
  }

module.exports = loggedIn