const Almacen = require("../models/Almacen");

//obtener almacen por sede
const obtenerAlmacenPorSede = async (req, res) => {
    const { fk_sede } = req.params;
    const almacenes = await Almacen.obtenerAlmacenPorSede(fk_sede)

    almacenes ? res.status(200).json({ success: true, almacenes: almacenes })
        : res.status(200).json({ success: false })
}

const obtenerMaterialesPorAlmacen = async (req, res) => {
    const { fk_almacen } = req.params;
    // console.log(req.params)
    const materiales = await Almacen.obtenerMaterialesPorAlmacen(fk_almacen)

    materiales ? res.status(200).json({ success: true, materiales: materiales })
        : res.status(200).json({ success: false })
}

const obtenerMaterialesPorSede = async (req, res) => {
    const { fk_sede } = req.params;
    const materiales = await Almacen.obtenerMaterialesPorSede(fk_sede)

    materiales ? res.status(200).json({ success: true, materiales: materiales })
        : res.status(200).json({ success: false })
}


const registrarInicializacionAlmacen = async (req, res) => {

    const response = await Almacen.registrarInventarioInicial(req.body)

    if (response) {
        res.status(200).json({ success: true, message: 'Inventario inicial registrado con exito!' })

    }
}

const validarProductoAlmacen = async (req, res) => {
    const { idProducto, idAlmacen } = req.params
    const material = await Almacen.validarProductoAlmacen(idProducto, idAlmacen)

    if (material) {
        res.status(200).json({ success: true, material: material, message: 'El producto ya ha sido registrado!' })

    }
}


const registrarIngresoMaterial = async (req, res) => {

    const response = await Almacen.registrarIngresoMaterial(req.body)
    console.log(response);
    if (response) {
        res.status(200).json({ success: true, message: 'El producto ha sido ingresado con exito!' })
    }
}

const registrarSalidaMaterial = async (req, res) => {
    console.log(req.body);
    const response = await Almacen.registrarSalidaMaterial(req.body)
    // console.log(response);
    if (response) {
        res.status(200).json({ success: true, message: 'El producto ha sido retirado con exito!' })
    }
}

const mostrarKardex = async (req, res) => {
    const response = await Almacen.mostrarKardex()
    res.status(200).json(response);
}
const mostrarMovimientos = async (req, res) => {
    const response = await Almacen.mostrarMovimientos()
    res.status(200).json(response);
}

const mostrarMovimientosDetalles = async (req, res) => {
    const { idMovimiento } = req.params
    const response = await Almacen.mostrarMovimientosDetalles(idMovimiento)
    res.status(200).json(response);

}

const obtenerDetalleMovimientoId = async (req, res) => {

    const { idMovimientoDetalle } = req.params
    const response = await Almacen.obtenerDetalleMovimientoId(idMovimientoDetalle)
    res.status(200).json(response);
}

const actualizarCantidadMovimientoAndAlmacenId = async (req, res) => {
    const { idMovimientoDetalle } = req.params;
    const { fk_productoAlmacen, cantidadProducto } = req.body;
    const response = await Almacen.actualizarCantidadMovimientoAndAlmacenId(idMovimientoDetalle, fk_productoAlmacen, cantidadProducto)
    res.status(200).json(response);
}

const moverMaterial = async (req, res) => {
    console.log(req.body);
    const response = await Almacen.moverEntreAlmacen(req.body);
    res.status(200).json({ success: response });
}

const filtroProductoSedeAlmacen = async (req, res) => {
    const { sede, almacen } = req.params
    // console.log(almacen);
    const response = await Almacen.filtroProductoSedeAlmacen(sede, almacen)
    res.status(200).json(response);
}

const filtrarKardexProductoFechas = async (req, res) => {

    // console.log(req.params);
    let { material, fechaInicio, fechaFin } = req.params

    const response = await Almacen.filtrarKardexProductoFechas(fechaInicio, fechaFin, material)
    console.log(response);
    res.status(200).json(response);


}

const filtrarKardexPorFecha = async (req, res) => {
    // console.log(req.params);
    let { fechaInicio, fechaFin } = req.params

    const response = await Almacen.filtrarKardexPorFecha(fechaInicio, fechaFin)

    res.status(200).json(response);

}
const actualizarStockGeneral = async (req, res) => {

    const response = await Almacen.actualizarStockGeneral(req.body)

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: "Actualización de stock" })

    } else {

    }
}

const eliminarMateriales = async (req, res) => {
    const response = await Almacen.eliminarMaterialesInnecesarios();
    res.status(200).json({ message: 'materiales eliminados' })
}

module.exports = {
    obtenerAlmacenPorSede,
    obtenerMaterialesPorSede,
    obtenerMaterialesPorAlmacen,
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
}