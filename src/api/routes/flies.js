
const express = require('express')
const router = express.Router()
const checkLoggedIn = require('../middleware/loggedIn')
const multer = require('multer')
const upload = multer({dest: 'images/'})
const checkFlyOwner = require('../middleware/checkFlyOwner')

module.exports = router

const flyController = require('../controllers/flyController')

router.get('/', flyController.getFlies)

router.get('/:id', flyController.getFlyById)

router.delete('/:id', checkFlyOwner, flyController.deleteFly)

router.post('/', checkLoggedIn, upload.single('image'), flyController.createFly)

router.post('/:id/favorite', checkLoggedIn, flyController.favoriteFly)