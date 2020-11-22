const jwt = require('jsonwebtoken')


const jwtUsuario = async (idUsuario) => {

    const token = await jwt.sign({ id: idUsuario }, process.env.SECRET, { expiresIn: '1h' })

    return token
}

const jwtVerify = async (tokenClient) => {
    try {
        const decode = await jwt.verify(tokenClient, process.env.SECRET)

        return decode

    } catch (error) {
        return error
    }
}
module.exports = {
    jwtUsuario,
    jwtVerify
}