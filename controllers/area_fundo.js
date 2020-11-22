const FundoArea = require('../models/FundoArea');

const createFundoArea = async (req, res) => {
    const { fk_area, fk_fundo, fk_ceco, fk_usuario } = req.body;
    const fundoArea = new FundoArea(fk_fundo, fk_area, fk_ceco, fk_usuario);
    const response = await fundoArea.createFundoArea();

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Área designada al fundo correctamente!' })

    } else if (response) {
        res.status(403).json({ success: false, message: 'Error al Designar área al fundo!', error: response.sqlMessage })
    }
}

const getFundosAreas = async (req, res) => {
    const fundosareas = await FundoArea.getFundosAreas();
    res.status(200).json(fundosareas);

}

const getFundoArea = async (req, res) => {
    const { idFundoArea } = req.params;
    const fundoArea = await FundoArea.getFundoArea(idFundoArea);

    fundoArea ? res.status(200).json({ succes: true, fundoArea })
        : res.status(200).json({ success: false })

}

const updateFundoArea = async (req, res) => {

    const { idFundoArea } = req.params;
    const { fk_fundo, fk_area, fk_ceco, fk_usuario } = req.body;

    const fundoArea = {
        fk_fundo,
        fk_area,
        fk_ceco,
        fk_usuario

    }

    const response = await FundoArea.updateFundoArea(idFundoArea, fundoArea);


    if (response.changedRows) {
        res.status(200).json({ success: true, message: 'Se actualizo el área asignada en el fundo con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al asignar el área al fundo!' })

    }
}

const deleteFundoArea = async (req, res) => {
    const { idFundoArea } = req.params;
    const response = await FundoArea.deleteFundoArea(idFundoArea);

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Area asignada eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar Area asignada!' })
    }
}

const getFundoAreaUsuario = async (req, res) => {
    const { idUsuario } = req.params;

    const fundoArea = await FundoArea.getFundoAreaUsuario(idUsuario);

    fundoArea ? res.status(200).json({ succes: true, fundoArea })
        : res.status(200).json({ success: false })

}

module.exports = {
    createFundoArea,
    getFundosAreas,
    getFundoArea,
    updateFundoArea,
    deleteFundoArea,
    getFundoAreaUsuario
}   