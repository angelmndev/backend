const { jwtVerify } = require('../libraries/jwtUsuario')
const Usuario = require('../models/Usuario')

const validateUsuario = async (req, res, next) => {
    const tokenClient = req.headers.token


    if (tokenClient) {
        const tokenDecode = await jwtVerify(tokenClient)

        const usuario = await Usuario.getUser(tokenDecode.id)
        res.status(200).json({ auth: true, message: 'Token validado y acceso al dashboard permitido', usuario: usuario })

    } else {
        res.status(403).json({ auth: false, message: 'Token invalido y acceso al dashboard negado' })

    }

}

module.exports = validateUsuario
