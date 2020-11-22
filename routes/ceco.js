const express = require('express');
const route = express.Router();
const { createCeco, getCecos, getCeco, updateCeco, deleteCeco, getCecosSedes, getCecosSedesUsuario, updatePresupuestoId } = require('../controllers/ceco');


route.post('/', createCeco);
route.get('/', getCecos);
route.get('/:idCeco', getCeco);
route.get('/sedes/:idCecoSede', getCecosSedes);
route.get('/sedes/:idCecoSede/usuario/:idUsuario', getCecosSedesUsuario);
route.put('/:idCeco', updateCeco);
route.put('/presupuesto/:idCeco', updatePresupuestoId)
route.delete('/:idCeco', deleteCeco);




module.exports = route;