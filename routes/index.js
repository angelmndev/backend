const { Router } = require('express')
const authUsuario = require('../middlewares/authUsuario')
const validateUsuario = require('../middlewares/validateUsuario')
const route = Router()


route.post('/login', authUsuario)

route.get('/dashboard', validateUsuario)

module.exports = route