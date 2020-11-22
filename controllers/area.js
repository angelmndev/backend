const Area = require('../models/Area');

const createArea = async (req, res) => {
    const { nombreArea } = req.body;
    const area = new Area(nombreArea);
    const response = await area.createArea();

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Area registrado con exito!' })

    } else if (response) {
        res.status(403).json({ success: false, message: 'Error al registrar Area!', error: response.sqlMessage })
    }
}

const getAreas = async (req, res) => {
    const areas = await Area.getAreas();
    res.status(200).json(areas);

}

const getArea = async (req, res) => {
    const { idArea } = req.params;
    const area = await Area.getArea(idArea);

    area ? res.status(200).json({ succes: true, area })
        : res.status(200).json({ success: false })

}

const updateArea = async (req, res) => {
    const { idArea } = req.params;
    const { nombreArea } = req.body;
    const area = {
        nombreArea

    }

    const response = await Area.updateArea(idArea, area);

    if (response.changedRows) {
        res.status(200).json({ success: true, message: 'Area actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar Area!' })

    }
}

const deleteArea = async (req, res) => {
    const { idArea } = req.params;
    const response = await Area.deleteArea(idArea);

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Area eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar Area!' })
    }
}

module.exports = {
    createArea,
    getAreas,
    getArea,
    updateArea,
    deleteArea
}   