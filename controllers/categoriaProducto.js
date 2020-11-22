const CategoriaProducto = require('../models/CategoriaProducto');

const getCategoriaProductos = async (req, res) => {
    const categorias = await CategoriaProducto.getCategorias();
    res.status(200).json(categorias);

}



module.exports = {
    getCategoriaProductos


}