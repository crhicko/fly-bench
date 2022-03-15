const setUserAuthCookie = (req, res, next) => {
    if (req.user?.id != req.cookies['user-id'])
        res.cookie('user-id', req.user.id, {expires: new Date()})
}

module.exports = setUserAuthCookie