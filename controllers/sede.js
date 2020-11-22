
//model database
const Sede = require('../models/Sede');

/*crear sede */
const createSede = async (req, res) => {
    const { nombreSede } = req.body;
    const sede = new Sede(nombreSede)
    const response = await sede.createSede()

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Usuario registrado con exito!' })

    } else if (response.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar usuario!', sqlMessage: responseModel.sqlMessage })
    }

};

/*obtener sedes */
const getSedes = async (req, res) => {
    const sedes = await Sede.getSedes();
    res.status(200).json(sedes)
};

/*obtener sede */
const getSede = async (req, res) => {
    const { idSede } = req.params;

    const sede = await Sede.getSede(idSede);

    sede ? res.status(200).json({ succes: true, sede })
        : res.status(200).json({ success: false })
};

/*actualizar sede */
const updateSede = async (req, res) => {
    const { idSede } = req.params;
    const { nombreSede } = req.body;

    const response = await Sede.updateSede(idSede, nombreSede);

    if (response.changedRows) {
        res.status(200).json({ success: true, message: 'Usuario actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar usuario!' })

    }
};

/*eliminar sede */
const deleteSede = async (req, res) => {
    const { idSede } = req.params;

    const response = await Sede.deleteSede(idSede)

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Usuario eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar usuario!' })
    }


};


module.exports = {
    createSede,
    getSedes,
    getSede,
    updateSede,
    deleteSede
}
