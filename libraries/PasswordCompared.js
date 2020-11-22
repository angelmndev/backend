const bcrypt = require('bcrypt')

const passwordCompared = async (password, dbHash) => {

    let result = await bcrypt.compare(password, dbHash)
    return result
}

module.exports = passwordCompared