const express = require('express');
const route = express.Router();
const {
    createFundoArea,
    getFundosAreas,
    getFundoArea,
    updateFundoArea,
    deleteFundoArea,
    getFundoAreaUsuario

} = require('../controllers/area_fundo');


route.post('/', createFundoArea);
route.get('/', getFundosAreas);
route.get('/:idFundoArea', getFundoArea);
route.put('/:idFundoArea', updateFundoArea);
route.delete('/:idFundoArea', deleteFundoArea);

route.get('/usuario/:idUsuario', getFundoAreaUsuario);

module.exports = route;