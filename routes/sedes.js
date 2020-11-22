const express = require('express');
const route = express.Router();
const { createSede, getSedes, getSede, updateSede, deleteSede } = require('../controllers/sede')
//routes

route.post('/', createSede)

route.get('/', getSedes)

route.get('/:idSede', getSede)

route.put('/:idSede', updateSede)

route.delete('/:idSede', deleteSede)


module.exports = route;