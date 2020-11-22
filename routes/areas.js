const express = require('express');
const route = express.Router();
const { createArea, getAreas, getArea, updateArea, deleteArea } = require('../controllers/area');


route.post('/', createArea);
route.get('/', getAreas);
route.get('/:idArea', getArea);
route.put('/:idArea', updateArea);
route.delete('/:idArea', deleteArea);


module.exports = route;