const db = require('../database/db');

class Ceco {

    #codigoCeco = "";
    #nombreCeco = "";
    #fk_sede = 0;
    #presupuestoCeco = 0;
    constructor(codigoCeco, nombreCeco, fk_sede, presupuestoCeco) {
        this.#codigoCeco = codigoCeco;
        this.#nombreCeco = nombreCeco;
        this.#fk_sede = fk_sede;
        this.#presupuestoCeco = presupuestoCeco;

    }


    async createCeco() {
        try {
            const sqlSentence = "INSERT INTO ?? SET ?";
            const sqlPreparing = ["ceco", { codigoCeco: this.#codigoCeco, nombreCeco: this.#nombreCeco, fk_sede: this.#fk_sede, presupuestoCeco: this.#presupuestoCeco }];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }
    };

    static async getCecos() {
        try {
            const sqlSentences = "SELECT idCeco,codigoCeco, nombreCeco, nombreSede, presupuestoCeco FROM ?? JOIN sede ON ceco.fk_sede =sede.IdSede ";
            const sqlPreparing = ["ceco"];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const cecos = await db.query(sql);
            return cecos;

        } catch (error) {
            return error;
        }
    };

    static async getCeco(idCeco) {

        try {
            const sqlSentence = "SELECT*FROM ?? WHERE ??=?";
            const sqlPreparing = ['ceco', 'idCeco', idCeco];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const ceco = await db.query(sql);

            return ceco[0];

        } catch (error) {
            return error;
        }
    };

    static async updateCeco(idCeco, { codigoCeco, nombreCeco, fk_sede, presupuestoCeco }) {
        console.log(presupuestoCeco);
        try {
            const sqlSentence = "UPDATE ?? SET  codigoCeco=?, nombreCeco=?, fk_sede=?, presupuestoCeco=? WHERE idCeco=?";
            const sqlPreparing = ['ceco', codigoCeco, nombreCeco, fk_sede, presupuestoCeco, idCeco];
            const sql = await db.format(sqlSentence, sqlPreparing);
            console.log(sql);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }

    };

    static async deleteCeco(idCeco) {
        try {
            const sqlSentence = "DELETE FROM ?? WHERE ??=?";
            const sqlPreparing = ['ceco', 'idCeco', idCeco];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }

    }

    static async getCecosSede(idCecoSede) {

        try {
            const sqlSentence = "SELECT idCeco,nombreCeco FROM ?? WHERE ?? =?";
            const sqlPreparing = ['ceco', 'fk_sede', idCecoSede];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const cecos = await db.query(sql);

            return cecos;

        } catch (error) {
            return error;
        }

    }
    //FILTRANDO POR DESDE FUNDO_AREA
    static async getCecosSedeUsuario(idCecoSede, idUsuario) {

        try {
            const sqlSentence = `SELECT*FROM ??
             JOIN ceco
             ON fundo_area.fk_ceco = ceco.idCeco
             WHERE ceco.fk_sede=? AND fundo_area.fk_usuario=? `;
            const sqlPreparing = ['fundo_area', idCecoSede, idUsuario];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const cecos = await db.query(sql);

            return cecos;

        } catch (error) {
            return error;
        }

    }
    static async updatePresupuestoId(idCeco, presupuesto) {
        try {
            const sqlSentence = "UPDATE ?? SET   presupuestoCeco=presupuestoCeco + ? WHERE idCeco=?";
            const sqlPreparing = ['ceco', presupuesto, idCeco];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }

    }

}


module.exports = Ceco;