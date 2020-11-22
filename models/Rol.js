const db = require('../database/db');

class Rol {
    #nombreRol = '';

    constructor(nombreRol) {
        this.#nombreRol = nombreRol;

    }
    /*insertar nueva rol en la basededatos */
    async createRol() {
        try {
            const sqlSentence = "INSERT INTO ?? SET ?"
            const sqlPreparing = ['rol', {
                nombreRol: this.#nombreRol,

            }]
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }
    }

    /*mostrar todas las roles de la basededatos */
    static async getRoles() {
        try {
            const sqlSentence = 'SELECT*FROM ??';
            const sqlPreparing = ['rol'];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const roles = await db.query(sql);

            return roles;

        } catch (error) {
            return error;
        }

    }
    /*editar una rol de la base de datos */
    static async getRol(idRol) {
        try {
            const sqlSentence = "SELECT*FROM ?? WHERE ??=?";
            const sqlPreparing = ['rol', 'idRol', idRol];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const rol = await db.query(sql);

            return rol[0];

        } catch (error) {
            return error;
        }
    }

    /*actualizar una rol de la base de datos */
    static async updateRol(idRol, nombreRol) {
        try {
            const sqlSentence = "UPDATE ?? SET ??=? WHERE ?? = ?";
            const sqlPreparing = ['rol', 'nombreRol', nombreRol, 'idRol', idRol];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }

    }

    /*eliminar rol */
    static async deleteRol(idRol) {
        try {
            const sqlSentence = 'DELETE FROM ?? WHERE ?? = ?';
            const sqlPreparing = ['rol', 'idRol', idRol];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }
    }
}

module.exports = Rol;