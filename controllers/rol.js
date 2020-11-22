
//model database
const Rol = require('../models/Rol');

/*crear sede */
const createRol = async (req, res) => {
    const { nombreRol } = req.body;
    const rol = new Rol(nombreRol)
    const response = await rol.createRol()

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Rol registrado con exito!' })

    } else if (response.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar rol!', sqlMessage: responseModel.sqlMessage })
    }

};

/*obtener sedes */
const getRoles = async (req, res) => {
    const roles = await Rol.getRoles();
    res.status(200).json(roles)
};

/*obtener sede */
const getRol = async (req, res) => {
    const { idRol } = req.params;

    const rol = await Rol.getRol(idRol);

    rol ? res.status(200).json({ succes: true, rol })
        : res.status(200).json({ success: false })
};

/*actualizar sede */
const updateRol = async (req, res) => {
    const { idRol } = req.params;
    const { nombreRol } = req.body;

    const response = await Rol.updateRol(idRol, nombreRol);

    if (response.changedRows) {
        res.status(200).json({ success: true, message: 'Rol actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar rol!' })

    }
};

/*eliminar sede */
const deleteRol = async (req, res) => {
    const { idRol } = req.params;

    const response = await Rol.deleteRol(idRol)

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Rol eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar rol!' })
    }


};


module.exports = {
    createRol,
    getRoles,
    getRol,
    updateRol,
    deleteRol
}
