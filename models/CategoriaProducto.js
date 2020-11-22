const db = require('../database/db');

class Categoria {

    static async getCategorias() {

        try {
            const sqlSentences = "SELECT*FROM ??";
            const sqlPreparing = ["categoria"];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            console.log(error);
        }
    }



}


module.exports = Categoria;