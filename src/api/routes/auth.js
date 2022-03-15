const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

module.exports = router

router.post('/logout', userController.logoutUser)

router.post('/login', userController.loginUser);

router.post('/register', userController.registerUser);

router.get('/user', (req, res) => {
    console.log(req.user)
    res.send({ user: req.user, is_auth: req.isAuthenticated() })
});
