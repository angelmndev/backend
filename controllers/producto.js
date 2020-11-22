const Producto = require('../models/Producto');
const multer = require('multer')

const createProducto = async (req, res) => {
    const { skuProducto,
        nombreProducto,
        tipoProducto,
        precioReferencialProducto,
        unidadProducto,
        fk_categoria,
        fk_area,
        fk_ceco
    } = req.body;

    const producto = new Producto(skuProducto, nombreProducto, tipoProducto, precioReferencialProducto, unidadProducto, fk_categoria, fk_area,
        fk_ceco)
    const response = await producto.createProducto();


    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Producto registrado con exito!' })

    } else if (response.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar producto!', sqlMessage: responseModel.sqlMessage })
    }
}

const getProductos = async (req, res) => {
    const productos = await Producto.getProductos();
    res.status(200).json(productos);

}

const getProductoId = async (req, res) => {
    const { idProducto } = req.params;
    const producto = await Producto.getProductoId(idProducto);

    producto ? res.status(200).json({ succes: true, producto })
        : res.status(200).json({ success: false })
}


const getProductoIdAreas = async (req, res) => {
    const { idArea } = req.params;
    const productos = await Producto.getProductoIdAreas(idArea);

    productos ? res.status(200).json({ succes: true, productos })
        : res.status(200).json({ success: false })
}


const updateProducto = async (req, res) => {
    const { idProducto } = req.params;
    const response = await Producto.updateProducto(idProducto, req.body)


    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Producto actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar producto!' })

    }
}


const deleteProductoId = async (req, res) => {
    const { idProducto } = req.params;
    const response = await Producto.deleteProductoId(idProducto);


    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Producto eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar producto!' })
    }
}


const subidaMasiva = async (req, res) => {
    const response = await Producto.subidaMasiva(req.body)

}

module.exports = {
    createProducto,
    getProductos,
    getProductoId,
    updateProducto,
    deleteProductoId,
    getProductoIdAreas,
    subidaMasiva
}