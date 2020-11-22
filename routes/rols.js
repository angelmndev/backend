const express = require('express');
const route = express.Router();
const { createRol, getRoles, getRol, updateRol, deleteRol } = require('../controllers/rol')
//routes

route.post('/', createRol)

route.get('/', getRoles)

route.get('/:idRol', getRol)

route.put('/:idRol', updateRol)

route.delete('/:idRol', deleteRol)


module.exports = route;