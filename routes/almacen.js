const { Router } = require('express');
const route = Router();
const {

    obtenerAlmacenPorSede,
    obtenerMaterialesPorSede,
    registrarInicializacionAlmacen,
    validarProductoAlmacen,
    registrarIngresoMaterial,
    registrarSalidaMaterial,
    mostrarKardex,
    mostrarMovimientos,
    mostrarMovimientosDetalles,
    obtenerDetalleMovimientoId,
    actualizarCantidadMovimientoAndAlmacenId,
    obtenerMaterialesPorAlmacen,
    moverMaterial,
    filtroProductoSedeAlmacen,
    filtrarKardexProductoFechas,
    filtrarKardexPorFecha,
    actualizarStockGeneral,
    eliminarMateriales
} = require('../controllers/almacen');
const { moverEntreAlmacen } = require('../models/Almacen');



//obtener almacen por sede
route.get('/almacenPorSede/:fk_sede', obtenerAlmacenPorSede)

//obtener materiales por almacen
route.get('/materiales/:fk_sede', obtenerMaterialesPorSede)

//obtener materiales por almacen
route.get('/materialPorAlmacen/:codigo_almacen', obtenerMaterialesPorAlmacen)

//registrarInicializacionAlmacen
route.post('/', registrarInicializacionAlmacen)

//validar producto y almacen
route.get('/material/:idProducto/almacen/:idAlmacen', validarProductoAlmacen)


//registrar ingreso
route.post('/ingreso', registrarIngresoMaterial)
//registrar salida
route.post('/salida', registrarSalidaMaterial)

//kardex
route.get('/kardex', mostrarKardex)
//movimientos
route.get('/movimientos', mostrarMovimientos)

//movimientos detalles
route.get('/movimientos/detalles/:idMovimiento', mostrarMovimientosDetalles)

//movimiento detalle editar
route.get('/movimientos/detalles/editar/:idMovimientoDetalle', obtenerDetalleMovimientoId)

//modificando cantidad en movimiento_detalle y cantidad en producto_almacen
route.put('/movimientos/detalles/actualizar/:idMovimientoDetalle', actualizarCantidadMovimientoAndAlmacenId)

route.post('/moverMaterial', moverMaterial)

route.get('/filtroProductoSedeAlmacen/:sede', filtroProductoSedeAlmacen)

route.get('/filtroProductoSedeAlmacen/:sede/:almacen', filtroProductoSedeAlmacen)

route.get('/kardex/:material/:fechaInicio/:fechaFin', filtrarKardexProductoFechas)

route.get('/kardex/:fechaInicio/:fechaFin', filtrarKardexPorFecha)

route.post('/actualizarStock/almacenGeneral', actualizarStockGeneral)



module.exports = route;