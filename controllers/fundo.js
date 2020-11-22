//model database
const Fundo = require('../models/Fundo');

/*crear sede */
const createFundo = async (req, res) => {
    const { nombreFundo, fk_sede } = req.body;
    const fundo = new Fundo(nombreFundo, fk_sede);
    const response = await fundo.createFundo()

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Fundo registrado con exito!' })

    } else if (response.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar fundo!', sqlMessage: responseModel.sqlMessage })
    }

};

/*obtener sedes */
const getFundos = async (req, res) => {
    const fundos = await Fundo.getFundos();
    res.status(200).json(fundos)
};

/*obtener sede */
const getFundo = async (req, res) => {
    const { idFundo } = req.params;

    const fundo = await Fundo.getFundo(idFundo);

    fundo ? res.status(200).json({ succes: true, fundo })
        : res.status(200).json({ success: false })
};

/*actualizar sede */
const updateFundo = async (req, res) => {
    const { idFundo } = req.params;
    const { nombreFundo, fk_sede } = req.body;

    const fundo = {
        nombreFundo,
        fk_sede
    }
    const response = await Fundo.updateFundo(idFundo, fundo);

    if (response.changedRows) {
        res.status(200).json({ success: true, message: 'Fundo actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar fundo!' })

    }
};

/*eliminar sede */
const deleteFundo = async (req, res) => {
    const { idFundo } = req.params;

    const response = await Fundo.deleteFundo(idFundo)

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Fundo eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar Fundo!' })
    }


};

const obtenerFundosPorSede = async (req, res) => {
    const { idSede } = req.params;

    const fundos = await Fundo.obtenerFundoPorSede(idSede);

    fundos ? res.status(200).json({ succes: true, fundos })
        : res.status(200).json({ success: false })
}




module.exports = {
    createFundo,
    getFundos,
    getFundo,
    updateFundo,
    deleteFundo,
    obtenerFundosPorSede
}
