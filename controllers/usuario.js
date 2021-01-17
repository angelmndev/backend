const Usuario = require('../models/Usuario');
const passwordHash = require('../libraries/PasswordHash');

const createUsuario = async (req, res) => {
    let { nombreUsuario, claveUsuario, nombrePersonalUsuario, apellidoPersonalUsuario, fk_rol } = req.body;

    //hash password
    claveUsuario = await passwordHash(claveUsuario)


    const usuario = new Usuario(
        nombreUsuario,
        claveUsuario,
        nombrePersonalUsuario,
        apellidoPersonalUsuario,
        fk_rol
    );
    // programando funcionalidad q permite reggistrar fk_area de array

    const response = await usuario.createUser();

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Usuario registrado con exito!' })

    } else if (response.sqlMessage) {
        res.status(403).json({ success: false, message: 'Error al registrar usuario!', sqlMessage: responseModel.sqlMessage })
    }

}

const getUsuarios = async (req, res) => {
    const usuarios = await Usuario.getUsers();
    res.status(200).json(usuarios);
}

const getUsuario = async (req, res) => {
    const { idUsuario } = req.params;

    const usuario = await Usuario.getUser(idUsuario);

    usuario ? res.status(200).json({ succes: true, usuario })
        : res.status(200).json({ success: false })
}

const updateUsuario = async (req, res) => {

    const { idUsuario } = req.params;

    let {
        nombreUsuario,
        nombrePersonalUsuario,
        apellidoPersonalUsuario,
        fk_rol } = req.body;


    const usuario = {
        nombreUsuario,
        nombrePersonalUsuario,
        apellidoPersonalUsuario,
        fk_rol

    }



    const response = await Usuario.updateUser(idUsuario, usuario);

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Usuario actualizado con exito!' })

    } else if (response.changedRows === 0) {
        res.status(403).json({ success: false, message: 'Error al actualizar usuario!' })

    }

}

const deleteUsuario = async (req, res) => {

    const { idUsuario } = req.params;

    const response = await Usuario.deleteUser(idUsuario)

    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'Usuario eliminado con exito!' })

    } else {
        res.status(403).json({ success: false, message: 'Error al eliminar usuario!' })
    }


}


const changePasswordUser = async (req, res) => {

    const { id } = req.params;
    let { password } = req.body;
    password = await passwordHash(password);

    const response = await Usuario.changeUserPassword(id, password)
    res.status(200).json({ success: true, message: 'cambiando password' })
    // //hash password



}


module.exports = {
    createUsuario,
    getUsuarios,
    getUsuario,
    updateUsuario,
    deleteUsuario,
    changePasswordUser
}