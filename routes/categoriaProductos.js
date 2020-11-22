const express = require('express');
const route = express.Router();
const { getCategoriaProductos } = require('../controllers/categoriaProducto');



// route.post('/', createProducto);
route.get('/', getCategoriaProductos);
// route.get('/:idProducto', getProductoId);
// route.put('/:idProducto', updateProducto);
// route.delete('/:idProducto', deleteProductoId);


module.exports = route;