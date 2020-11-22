const express = require('express');
const route = express.Router();
const { createPedido,
    getPedidos,
    getDetalles,
    getDetallesPedido,
    updateDetallePedidoId,
    deleteDetallePedidoId,
    aprobarPedidoId,
    rechazarPedidoId,
    obtenerProductosPorCecos,
    obtenerProductoPorCantidad,
    buscarProductoPorCodigo,
    crearPedidoApi,
    exportarExcel,
    getListPedidosUsuarioApi
} = require('../controllers/pedido');



route.post('/', crearPedidoApi);
route.get('/', getPedidos);
route.get('/detalles/:idPedido', getDetalles)
route.get('/detalleProducto/:idPedido', getDetallesPedido)
route.put('/detalleProducto/:idPedido', updateDetallePedidoId)
route.delete('/detalleProducto/:idPedido', deleteDetallePedidoId)
route.put('/:idPedido', aprobarPedidoId)
// route.get('/:idProducto', getProductoId);
// route.put('/:idProducto', updateProducto);
route.delete('/:idPedido', rechazarPedidoId);
route.get('/productosPorCecos/:idCeco', obtenerProductosPorCecos)
route.get('/productosPorCantidad/:idProducto', obtenerProductoPorCantidad)
// route.get('/area/:idArea', getProductoIdAreas);
route.get('/buscarProducto/:producto', buscarProductoPorCodigo)
route.get('/exportar/:id', exportarExcel)
route.get('/pedidos/status/usuario/:idUsuario', getListPedidosUsuarioApi)
module.exports = route;