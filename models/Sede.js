const db = require('../database/db');

class Sede {
    #nombreSede = '';

    constructor(nombreSede) {
        this.#nombreSede = nombreSede;

    }
    /*insertar nueva sede en la basededatos */
    async createSede() {
        try {
            const sqlSentence = "INSERT INTO ?? SET ?"
            const sqlPreparing = ['sede', {
                nombreSede: this.#nombreSede,

            }]
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response


        } catch (error) {
            return error;
        }
    }

    /*mostrar todas las sedes de la basededatos */
    static async getSedes() {
        try {
            const sqlSentence = 'SELECT*FROM ??';
            const sqlPreparing = ['sede'];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const sedes = await db.query(sql);

            return sedes;

        } catch (error) {
            return error;
        }

    }
    /*editar una sede de la base de datos */
    static async getSede(idSede) {
        try {
            const sqlSentence = "SELECT*FROM ?? WHERE ??=?";
            const sqlPreparing = ['sede', 'idSede', idSede];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const sede = await db.query(sql);

            return sede[0];

        } catch (error) {
            return error;
        }
    }

    /*actualizar una sede de la base de datos */
    static async updateSede(idSede, nombreSede) {
        try {
            const sqlSentence = "UPDATE ?? SET ??=? WHERE ?? = ?";
            const sqlPreparing = ['sede', 'nombreSede', nombreSede, 'idSede', idSede];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const sede = await db.query(sql);

            return sede;

        } catch (error) {
            return error;
        }

    }

    /*eliminar sede */
    static async deleteSede(idSede) {
        try {
            const sqlSentence = 'DELETE FROM ?? WHERE ?? = ?';
            const sqlPreparing = ['sede', 'idSede', idSede];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const sede = await db.query(sql);

            return sede;

        } catch (error) {
            return error;
        }
    }
}

module.exports = Sede;