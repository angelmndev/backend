const Usuario = require('../models/Usuario')
const passwordCompared = require('../libraries/PasswordCompared')
const { jwtUsuario } = require('../libraries/jwtUsuario')

const authUsuario = async (req, res) => {
    const { nombreUsuario, claveUsuario } = req.body

    //validando usuario de la base de datos
    const responseModel = await Usuario.validarUsuario(nombreUsuario)

    if (!responseModel) {
        res.status(403).json({ success: false, message: 'El usuario es incorrecto y no se encuentra registrado!' })

    } else {
        const authPassword = await passwordCompared(claveUsuario, responseModel.claveUsuario)

        if (!authPassword) {
            res.status(403).json({ success: false, message: 'la contraseña es incorrecta!' })
        } else {
            // jwt
            const token = await jwtUsuario(responseModel.idUsuario);
            res.status(200).json({ token: token, success: true, message: 'Bienvenido al sistema' })

        }



    }

}


module.exports = authUsuario