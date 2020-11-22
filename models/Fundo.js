const db = require('../database/db');
class Fundo {
    #nombreFundo = "";
    #fk_sede = 0;

    constructor(nombreFundo, fk_sede) {
        this.#nombreFundo = nombreFundo;
        this.#fk_sede = fk_sede;
    }

    async createFundo() {
        try {
            const sqlSentence = "INSERT INTO ?? SET ?";
            const sqlPreparing = ['fundo', { nombreFundo: this.#nombreFundo, fk_sede: this.#fk_sede }];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }
    };

    static async getFundos() {
        try {
            const sqlSentence = "SELECT idSede, nombreSede, idFundo,fk_sede, nombreFundo FROM ?? INNER JOIN ?? ON fundo.fk_sede = sede.idSede";
            const sqlPreparing = ['fundo', 'sede'];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }
    }

    static async getFundo(idFundo) {
        try {
            const sqlSentence = "SELECT fk_sede,idFundo, nombreFundo, idSede, nombreSede FROM ?? INNER JOIN ?? ON fundo.fk_sede = sede.idSede WHERE fundo.idFundo = ? ";
            const sqlPreparing = ['fundo', 'sede', idFundo];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);
            return response[0];

        } catch (error) {
            return error;
        }
    }

    static async updateFundo(idFundo, { nombreFundo, fk_sede }) {
        try {
            const sqlSentence = "UPDATE fundo SET nombreFundo=?, fk_sede=? WHERE idFundo=?";
            const sqlPreparing = [nombreFundo, fk_sede, idFundo];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }
    }
    static async deleteFundo(idFundo) {
        try {
            const sqlSentence = "DELETE FROM fundo WHERE  idFundo=?";
            const sqlPreparing = [idFundo];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }
    }

    static async obtenerFundoPorSede(idSede) {
        try {
            const sqlSentence = `SELECT idFundo, nombreFundo FROM ?? WHERE fk_sede = ?`;
            const sqlPreparing = ['fundo', idSede];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }
    }


}

module.exports = Fundo;