const express = require('express');
const route = express.Router();
const { subidaMasiva, createProducto, getProductos, getProductoId, updateProducto, deleteProductoId, getProductoIdAreas } = require('../controllers/producto');



route.post('/', createProducto);
route.get('/', getProductos);
route.get('/:idProducto', getProductoId);
route.put('/:idProducto', updateProducto);
route.delete('/:idProducto', deleteProductoId);
route.get('/area/:idArea', getProductoIdAreas);
route.post('/subidaMasiva', subidaMasiva)
module.exports = route;