const express = require('express');
const route = express.Router();
const { obtenerFundosPorSede, createFundo, getFundos, getFundo, updateFundo, deleteFundo } = require('../controllers/fundo')
//routes

route.post('/', createFundo)

route.get('/', getFundos)

route.get('/:idFundo', getFundo)

route.put('/:idFundo', updateFundo)

route.delete('/:idFundo', deleteFundo)


route.get('/sedes/:idSede', obtenerFundosPorSede)

module.exports = route;