const express = require('express');
const route = express.Router();
const {
    createUsuario,
    getUsuarios,
    getUsuario,
    updateUsuario,
    deleteUsuario,
    changePasswordUser
} = require('../controllers/usuario');



//routes
route.post('/', createUsuario);
route.get('/', getUsuarios);
route.get('/:idUsuario', getUsuario);
route.put('/:idUsuario', updateUsuario);
route.delete('/:idUsuario', deleteUsuario);
route.put('/changePassword/:id', changePasswordUser);


module.exports = route;