const { Router } = require('express');
const express = require('express');
const route = express.Router();
const {
    obtenerPrecioReferencialProductoAPI,
    obtenerProductosPorSede,
    obtenerInventarioId,
    getCodInventarioSedes,
    registrarIngresoInventario,
    getListaKardexInventario,
    getListaMovimientosInventario,
    registrarSalidaInventario,
    registrarInventarioInicial,
    obtenerCantidadProductoAPI,
    validarExistenciaProducto,
    obtenerAlmacenPorSede
} = require('../controllers/inventario')


//routes



route.get('/', getListaKardexInventario)
route.get('/movimientos', getListaMovimientosInventario)

//obtener almacen por sede

route.get('/AlmacenPorSede/:fk_sede', obtenerAlmacenPorSede)

//get inventarios codigos
route.get('/inventarioSede', getCodInventarioSedes)
//estado base
route.get('/:idInventario', obtenerInventarioId)
route.get('/productos/:fk_sede', obtenerProductosPorSede)
route.get('/producto/precio/:fk_producto', obtenerPrecioReferencialProductoAPI)
route.get('/producto/cantidad/:fk_producto', obtenerCantidadProductoAPI)
route.post('/registro/inicial', registrarInventarioInicial)

//ingreso
route.post('/', registrarIngresoInventario)
route.post('/salidas', registrarSalidaInventario)
route.get('/producto/validarExistencia/:fk_producto', validarExistenciaProducto)

module.exports = route;