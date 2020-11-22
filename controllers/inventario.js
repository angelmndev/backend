const Inventario = require('../models/Inventario');


const getCodInventarioSedes = async (req, res) => {
    const inventarioSedes = await Inventario.listarCodInventarioSedes()
    res.status(200).json(inventarioSedes);

}

const registrarIngresoInventario = async (req, res) => {

    const responseModel = await Inventario.registrarIngresoInventarioModel(req.body)

    if (responseModel.affectedRows) {
        res.status(200).json({ success: true, message: 'Ingreso al inventario registrado con exito!' })

    } else if (responseModel.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar Ingreso al inventario!', sqlMessage: responseModel.sqlMessage })
    }
}


const getListaKardexInventario = async (req, res) => {
    const kardexLista = await Inventario.ListarKardexDetalles()
    res.status(200).json(kardexLista);
}

const getListaMovimientosInventario = async (req, res) => {
    const listaMovimientos = await Inventario.ListarMovimientosInventarioModel()
    res.status(200).json(listaMovimientos);
}



const registrarSalidaInventario = async (req, res) => {


    const responseModel = await Inventario.registrarSalidaInventarioModel(req.body)

    if (responseModel.affectedRows) {
        res.status(200).json({ success: true, message: 'Salida al inventario registrado con exito!' })

    } else if (responseModel.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar Salida al inventario!', sqlMessage: responseModel.sqlMessage })
    }
}


const obtenerInventarioId = async (req, res) => {
    const { idInventario } = req.params;
    const inventario = await Inventario.obtenerInventarioId(idInventario)
    inventario ? res.status(200).json({ succes: true, fk_sede: inventario.fk_sede })
        : res.status(200).json({ success: false })

}

const obtenerProductosPorSede = async (req, res) => {
    const { fk_sede } = req.params;
    const productos = await Inventario.obtenerProductosPorSede(fk_sede)
    res.status(200).json(productos)
}



const obtenerPrecioReferencialProductoAPI = async (req, res) => {
    const { fk_producto } = req.params;
    const producto = await Inventario.obtenerPrecioReferencialProducto(fk_producto)

    producto ? res.status(200).json({ succes: true, precio: producto.precioReferencialProducto })
        : res.status(200).json({ success: false })
}


const registrarInventarioInicial = async (req, res) => {

    const response = await Inventario.registrarInventarioInicial(req.body)

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Inventario inicial registrado con exito!' })

    } else if (response.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar inventario inicial fundo!', sqlMessage: responseModel.sqlMessage })
    }
}

const obtenerCantidadProductoAPI = async (req, res) => {
    const { fk_producto } = req.params;
    const producto = await Inventario.obtenerCantidadProducto(fk_producto)

    producto ? res.status(200).json({ success: true, productoCantidad: producto })
        : res.status(200).json({ success: false })
}


const validarExistenciaProducto = async (req, res) => {
    const { fk_producto } = req.params;
    const producto = await Inventario.validarExistenciaProductoModel(fk_producto)

    producto ? res.status(200).json({ success: true, producto: producto })
        : res.status(200).json({ success: false })
}


//obtener almacen por sede
const obtenerAlmacenPorSede = async (req, res) => {
    const { fk_sede } = req.params;
    const almacenes = await Inventario.obtenerAlmacenPorSede(fk_sede)

    producto ? res.status(200).json({ success: true, almacen: almacenes })
        : res.status(200).json({ success: false })
}

module.exports = {
    getCodInventarioSedes,
    registrarIngresoInventario,
    getListaKardexInventario,
    getListaMovimientosInventario,
    registrarSalidaInventario,
    obtenerInventarioId,
    obtenerProductosPorSede,
    obtenerPrecioReferencialProductoAPI,
    registrarInventarioInicial,
    obtenerCantidadProductoAPI,
    validarExistenciaProducto,
    obtenerAlmacenPorSede
}   