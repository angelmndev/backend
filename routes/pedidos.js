const express = require('express');
const route = express.Router();
const { createPedido,
    getPedidos,
    getDetalles,
    updateDetallePedidoId,
    deleteDetallePedidoId,
    aprobarPedidoId,
    rechazarPedidoId,
    obtenerProductosPorCecos,
    obtenerProductoPorCantidad,
    buscarProductoPorCodigo,
    crearPedidoApi,
    exportarExcel,
    getListPedidosUsuarioApi,
    deletePedidoId
} = require('../controllers/pedido');



route.post('/', crearPedidoApi);
route.get('/', getPedidos);
route.get('/detalles/:idPedido', getDetalles)
route.put('/detalleProducto/:idPedido', updateDetallePedidoId)
route.delete('/detalleProducto/:idPedido', deleteDetallePedidoId)
route.put('/:idPedido', aprobarPedidoId)

route.delete('/:idPedido', rechazarPedidoId);
route.get('/productosPorCecos/:idCeco', obtenerProductosPorCecos)
route.get('/productosPorCantidad/:idProducto', obtenerProductoPorCantidad)

route.get('/buscarProducto/:producto', buscarProductoPorCodigo)
route.get('/exportar/:id', exportarExcel)
route.get('/pedidos/status/usuario/:idUsuario', getListPedidosUsuarioApi)

route.delete('/deletePedido/:id', deletePedidoId)
module.exports = route;