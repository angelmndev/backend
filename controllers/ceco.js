const Ceco = require('../models/Ceco');

const createCeco = async (req, res) => {
    const { codigoCeco, nombreCeco, fk_sede, presupuestoCeco } = req.body;
    const ceco = new Ceco(codigoCeco, nombreCeco, fk_sede, presupuestoCeco);
    const response = await ceco.createCeco();

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Ceco registrado con exito!' })

    } else if (response) {
        res.status(403).json({ success: false, message: 'Error al registrar Ceco!', error: response.sqlMessage })
    }
}

const getCecos = async (req, res) => {
    const cecos = await Ceco.getCecos();
    res.status(200).json(cecos);

}

const getCeco = async (req, res) => {
    const { idCeco } = req.params;
    const ceco = await Ceco.getCeco(idCeco);

    ceco ? res.status(200).json({ succes: true, ceco })
        : res.status(200).json({ success: false })

}

const updateCeco = async (req, res) => {
    const { idCeco } = req.params;
    const { codigoCeco, nombreCeco, fk_sede, presupuestoCeco } = req.body;
    const ceco = {
        codigoCeco, nombreCeco, fk_sede, presupuestoCeco

    }

    const response = await Ceco.updateCeco(idCeco, ceco);

    if (response.changedRows) {
        res.status(200).json({ success: true, message: 'Ceco actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar ceco!' })

    }
}

const deleteCeco = async (req, res) => {
    const { idCeco } = req.params;
    const response = await Ceco.deleteCeco(idCeco);


    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Ceco eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar Ceco!' })
    }
}

const getCecosSedes = async (req, res) => {

    const { idCecoSede } = req.params;
    const cecos = await Ceco.getCecosSede(idCecoSede);
    res.status(200).json(cecos);
}

const getCecosSedesUsuario = async (req, res) => {
    const { idCecoSede, idUsuario } = req.params;
    const cecos = await Ceco.getCecosSedeUsuario(idCecoSede, idUsuario);
    res.status(200).json(cecos);
}

const updatePresupuestoId = async (req, res) => {
    const { idCeco } = req.params;
    const { monto } = req.body;


    const response = await Ceco.updatePresupuestoId(idCeco, monto);

    if (response.changedRows) {
        res.status(200).json({ success: true, message: 'Ceco actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar ceco!' })

    }
}
module.exports = {
    createCeco,
    getCecos,
    getCeco,
    updateCeco,
    deleteCeco,
    getCecosSedes,
    updatePresupuestoId,
    getCecosSedesUsuario
}   