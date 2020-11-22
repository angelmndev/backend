const bcrypt = require('bcrypt')
const saltRounds = 10

const passwordEncrypt = async (password) => {
    let hash = await bcrypt.hash(password, saltRounds)
    return hash
}

module.exports = passwordEncrypt